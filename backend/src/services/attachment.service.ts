import { prisma } from '../lib/prisma.js'
import { storage } from '../lib/storage.js'

export const attachmentService = {
  async create(input: {
    noteId: string
    uploadedById: string
    filename: string
    mimeType: string
    buffer: Buffer
  }) {
    const { storedName, size } = await storage.save(input.buffer, input.filename)
    try {
      return await prisma.attachment.create({
        data: {
          noteId: input.noteId,
          uploadedById: input.uploadedById,
          filename: input.filename,
          storedName,
          mimeType: input.mimeType,
          size,
        },
      })
    } catch (e) {
      // Roll back the file if the DB insert fails.
      await storage.remove(storedName)
      throw e
    }
  },

  async listByNote(noteId: string) {
    return prisma.attachment.findMany({
      where: { noteId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getById(id: string) {
    return prisma.attachment.findUnique({
      where: { id },
      include: { note: { select: { folder: { select: { workspaceId: true } } } } },
    })
  },

  async delete(id: string) {
    const attachment = await prisma.attachment.findUniqueOrThrow({ where: { id } })
    await prisma.attachment.delete({ where: { id } })
    await storage.remove(attachment.storedName)
  },
}
