import { prisma } from '../lib/prisma.js'
import type { CreateFolderInput, UpdateFolderInput } from '../schemas/folder.schema.js'

export const folderService = {
  async createFolder(data: CreateFolderInput, workspaceId: string) {
    return prisma.folder.create({ data: { ...data, workspaceId } })
  },

  async getFoldersByWorkspace(workspaceId: string) {
    return prisma.folder.findMany({
      where: { workspaceId },
      include: {
        children: true,
        _count: { select: { notes: { where: { deletedAt: null } } } },
      },
    })
  },

  async updateFolder(folderId: string, data: UpdateFolderInput) {
    return prisma.folder.update({ where: { id: folderId }, data })
  },

  async deleteFolder(folderId: string) {
    return prisma.folder.delete({ where: { id: folderId } })
  },
}
