import { prisma } from '../lib/prisma.js'
import type { CreateFolderInput, UpdateFolderInput } from '../schemas/folder.schema.js'

/**
 * Collecte l'identifiant d'un dossier et de tous ses descendants (parcours en
 * largeur sur `parentId`). Sert à propager le soft-delete et la restauration à
 * tout le sous-arbre. L'arborescence est bornée (cf. getFoldersByWorkspace),
 * donc une poignée de requêtes suffit.
 */
async function subtreeFolderIds(rootId: string): Promise<string[]> {
  const all = [rootId]
  let frontier = [rootId]
  while (frontier.length) {
    const children = await prisma.folder.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    })
    if (children.length === 0) break
    const ids = children.map((c) => c.id)
    all.push(...ids)
    frontier = ids
  }
  return all
}

export const folderService = {
  async createFolder(data: CreateFolderInput, workspaceId: string) {
    return prisma.folder.create({ data: { ...data, workspaceId } })
  },

  async getFoldersByWorkspace(workspaceId: string) {
    // The folder tree is bounded by design, so it is returned whole rather than
    // paginated; the cap is a safety bound against a pathological workspace.
    // Soft-deleted folders (in the trash) are excluded from the live tree.
    return prisma.folder.findMany({
      where: { workspaceId, deletedAt: null },
      include: {
        children: true,
        _count: { select: { notes: { where: { deletedAt: null } } } },
      },
      orderBy: { createdAt: 'asc' },
      take: 1000,
    })
  },

  async updateFolder(folderId: string, data: UpdateFolderInput) {
    return prisma.folder.update({ where: { id: folderId }, data })
  },

  /**
   * Déplace un dossier sous un nouveau parent (ou à la racine si `targetParentId`
   * est nul) au sein du même workspace.
   *
   * Deux gardes (§ périmètre — déplacement) :
   *  - le parent cible doit appartenir au même workspace que le dossier déplacé ;
   *  - anti-cycle : on refuse de déplacer un dossier dans l'un de ses propres
   *    descendants (l'arborescence formerait une boucle). On remonte la chaîne
   *    parentale de la cible : si on y croise le dossier déplacé, c'est un cycle.
   */
  async moveFolder(folderId: string, targetParentId?: string | null) {
    const folder = await prisma.folder.findUniqueOrThrow({
      where: { id: folderId },
      select: { workspaceId: true },
    })

    // Remonter à la racine : simple détachement, aucune cible à valider.
    if (!targetParentId) {
      return prisma.folder.update({ where: { id: folderId }, data: { parentId: null } })
    }

    if (targetParentId === folderId) {
      throw Object.assign(new Error('A folder cannot be its own parent'), {
        code: 'INVALID_TARGET',
      })
    }

    const target = await prisma.folder.findUnique({
      where: { id: targetParentId },
      select: { workspaceId: true },
    })
    if (!target || target.workspaceId !== folder.workspaceId) {
      throw Object.assign(new Error('Target parent is not in the same workspace'), {
        code: 'INVALID_TARGET',
      })
    }

    // Anti-cycle : le dossier déplacé ne doit pas être un ancêtre de la cible.
    const visited = new Set<string>()
    let ancestorId: string | null = targetParentId
    while (ancestorId) {
      if (ancestorId === folderId) {
        throw Object.assign(new Error('Cannot move a folder into its own descendant'), {
          code: 'CYCLE',
        })
      }
      if (visited.has(ancestorId)) break // garde contre des données déjà cycliques
      visited.add(ancestorId)
      const ancestor: { parentId: string | null } | null = await prisma.folder.findUnique({
        where: { id: ancestorId },
        select: { parentId: true },
      })
      ancestorId = ancestor?.parentId ?? null
    }

    return prisma.folder.update({ where: { id: folderId }, data: { parentId: targetParentId } })
  },

  /**
   * Soft-delete : place le dossier et tout son sous-arbre (sous-dossiers + notes)
   * en corbeille en horodatant `deletedAt`. On propage aux notes pour qu'elles
   * sortent des listes et de la recherche (toutes deux filtrent `deletedAt: null`) ;
   * les notes déjà en corbeille conservent leur propre horodatage. Atomique.
   */
  async softDeleteFolder(folderId: string) {
    const ids = await subtreeFolderIds(folderId)
    const deletedAt = new Date()
    return prisma.$transaction([
      prisma.note.updateMany({
        where: { folderId: { in: ids }, deletedAt: null },
        data: { deletedAt },
      }),
      prisma.folder.updateMany({ where: { id: { in: ids } }, data: { deletedAt } }),
    ])
  },

  /**
   * Restaure un dossier mis en corbeille et tout son sous-arbre. Symétrique du
   * soft-delete. La corbeille ne propose que des racines de suppression (parent
   * vivant), donc restaurer ne ressuscite jamais un sous-arbre orphelin.
   */
  async restoreFolder(folderId: string) {
    const ids = await subtreeFolderIds(folderId)
    return prisma.$transaction([
      prisma.note.updateMany({ where: { folderId: { in: ids } }, data: { deletedAt: null } }),
      prisma.folder.updateMany({ where: { id: { in: ids } }, data: { deletedAt: null } }),
    ])
  },

  /**
   * Dossiers en corbeille d'un workspace, réduits aux « racines » de suppression :
   * un dossier supprimé dont le parent est vivant (ou sans parent). On masque
   * ainsi les sous-dossiers supprimés en cascade — restaurer la racine les ramène
   * tous. Borné comme l'arbre vivant.
   */
  async getDeletedFoldersByWorkspace(workspaceId: string) {
    return prisma.folder.findMany({
      where: {
        workspaceId,
        deletedAt: { not: null },
        OR: [{ parentId: null }, { parent: { deletedAt: null } }],
      },
      orderBy: { deletedAt: 'desc' },
      take: 1000,
    })
  },
}
