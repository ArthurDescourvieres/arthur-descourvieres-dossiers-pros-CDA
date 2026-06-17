import { prisma } from '../lib/prisma.js'
import type { CreateFolderInput, UpdateFolderInput } from '../schemas/folder.schema.js'

export const folderService = {
  async createFolder(data: CreateFolderInput, workspaceId: string) {
    return prisma.folder.create({ data: { ...data, workspaceId } })
  },

  async getFoldersByWorkspace(workspaceId: string) {
    // The folder tree is bounded by design, so it is returned whole rather than
    // paginated; the cap is a safety bound against a pathological workspace.
    return prisma.folder.findMany({
      where: { workspaceId },
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

  async deleteFolder(folderId: string) {
    return prisma.folder.delete({ where: { id: folderId } })
  },
}
