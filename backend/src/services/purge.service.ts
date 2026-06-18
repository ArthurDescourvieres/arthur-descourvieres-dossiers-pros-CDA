import { randomBytes } from 'node:crypto'
import { WorkspaceRole } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { securityLog } from '../lib/logger.js'
import { hashPassword } from '../lib/password.js'
import { workspaceService } from './workspace.service.js'

// Période de grâce avant purge définitive d'un compte désactivé (§ RGPD).
const GRACE_DAYS = 30

// Compte « pierre tombale » : auteur de remplacement pour le contenu qui survit
// à la suppression d'un utilisateur (notes partagées, pièces jointes…). Son hash
// est aléatoire et il n'est membre d'aucun workspace : aucun login possible.
const TOMBSTONE_EMAIL = 'compte-supprime@memo.invalid'

async function getOrCreateTombstone() {
  const existing = await prisma.user.findUnique({ where: { email: TOMBSTONE_EMAIL } })
  if (existing) return existing
  return prisma.user.create({
    data: {
      email: TOMBSTONE_EMAIL,
      name: 'Utilisateur supprimé',
      password: await hashPassword(randomBytes(32).toString('hex')),
    },
  })
}

/**
 * Purge définitive d'un compte désactivé (effacement / anonymisation en cascade,
 * §7 RGPD du MEMO). Idempotent : relançable sans dommage.
 *
 *  1. Workspaces possédés :
 *     - seul membre → suppression complète (BDD + fichiers disque) ;
 *     - partagés → propriété transférée au membre le plus ancien (devient OWNER).
 *  2. Le contenu qui survit (notes, pièces jointes, permissions, invitations) est
 *     réattribué au compte « Utilisateur supprimé » (anonymisation).
 *  3. Le compte est supprimé ; ses adhésions partent en cascade.
 *
 * L'ordre garantit qu'aucune contrainte `ON DELETE RESTRICT` (ownerId, createdById,
 * uploadedById, grantedById, invitedById) ne pointe encore vers l'utilisateur au
 * moment du `delete`.
 */
async function purgeUser(userId: string): Promise<void> {
  const tombstone = await getOrCreateTombstone()

  const owned = await prisma.workspace.findMany({
    where: { ownerId: userId },
    select: { id: true, _count: { select: { members: true } } },
  })

  for (const ws of owned) {
    const heir =
      ws._count.members <= 1
        ? null
        : await prisma.workspaceMember.findFirst({
            where: { workspaceId: ws.id, userId: { not: userId } },
            orderBy: { joinedAt: 'asc' },
          })

    if (!heir) {
      // Seul propriétaire non partagé → suppression complète (disque inclus).
      await workspaceService.deleteWorkspace(ws.id)
    } else {
      await prisma.$transaction([
        prisma.workspace.update({ where: { id: ws.id }, data: { ownerId: heir.userId } }),
        prisma.workspaceMember.update({
          where: { id: heir.id },
          data: { role: WorkspaceRole.OWNER },
        }),
      ])
    }
  }

  await prisma.$transaction([
    prisma.note.updateMany({ where: { createdById: userId }, data: { createdById: tombstone.id } }),
    prisma.attachment.updateMany({
      where: { uploadedById: userId },
      data: { uploadedById: tombstone.id },
    }),
    prisma.permission.updateMany({
      where: { grantedById: userId },
      data: { grantedById: tombstone.id },
    }),
    prisma.invitation.updateMany({
      where: { invitedById: userId },
      data: { invitedById: tombstone.id },
    }),
    prisma.user.delete({ where: { id: userId } }),
  ])
}

export const purgeService = {
  /**
   * Purge tous les comptes désactivés depuis plus de 30 jours. `now` est injectable
   * pour les tests (passer une date dans le futur pour forcer l'éligibilité).
   */
  async purgeDeactivatedAccounts(now: Date = new Date()) {
    const cutoff = new Date(now.getTime() - GRACE_DAYS * 24 * 60 * 60 * 1000)
    const expired = await prisma.user.findMany({
      where: { deactivatedAt: { lt: cutoff }, email: { not: TOMBSTONE_EMAIL } },
      select: { id: true },
    })
    for (const u of expired) {
      await purgeUser(u.id)
    }
    if (expired.length > 0) securityLog('accounts_purged', { count: expired.length })
    return { purged: expired.length }
  },
}
