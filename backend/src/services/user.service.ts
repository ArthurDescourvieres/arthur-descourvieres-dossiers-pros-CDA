import { prisma } from '../lib/prisma.js'
import { authService } from './auth.service.js'

export const userService = {
  /**
   * Désactive (soft-delete) le compte courant : démarre la période de grâce de
   * 30 jours avant purge définitive (§ RGPD — droit à l'effacement).
   *
   * - `deactivatedAt = now` : marque le compte et bloque tout nouveau login ;
   * - bump `tokenVersion` : invalide tous les refresh tokens (toutes sessions) ;
   * - blacklist du refresh courant : coupe la session en cours immédiatement.
   */
  async deactivateAccount(userId: string, refreshToken?: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { deactivatedAt: new Date(), tokenVersion: { increment: 1 } },
    })
    if (refreshToken) {
      await authService.logout(refreshToken)
    }
  },

  /**
   * Export RGPD (droit à la portabilité) : l'ensemble des données personnelles
   * du compte, en JSON. Les pièces jointes sont listées en métadonnées avec un
   * lien de téléchargement authentifié (le binaire n'est pas inliné dans le JSON).
   */
  async exportUserData(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    })
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            ownerId: true,
            createdAt: true,
          },
        },
      },
    })
    const notes = await prisma.note.findMany({
      where: { createdById: userId },
      select: {
        id: true,
        title: true,
        content: true,
        contentText: true,
        folderId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    })
    const attachments = await prisma.attachment.findMany({
      where: { uploadedById: userId },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
        noteId: true,
        createdAt: true,
      },
    })

    return {
      exportedAt: new Date().toISOString(),
      user,
      workspaces: memberships.map((m) => ({ ...m.workspace, role: m.role, joinedAt: m.joinedAt })),
      notes,
      attachments: attachments.map((a) => ({ ...a, downloadUrl: `/api/attachments/${a.id}/file` })),
    }
  },
}
