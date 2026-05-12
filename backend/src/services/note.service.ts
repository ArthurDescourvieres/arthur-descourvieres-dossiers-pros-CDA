import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { extractText } from '../lib/tiptap.js'
import type { CreateNoteInput, UpdateNoteInput } from '../schemas/note.schema.js'

export const noteService = {
  async createNote(data: CreateNoteInput, createdById: string) {
    return prisma.note.create({
      data: {
        title: data.title,
        content: data.content as Prisma.InputJsonValue,
        contentText: extractText(data.content),
        folderId: data.folderId,
        createdById,
      },
    })
  },

  async getNotesByFolder(folderId: string) {
    return prisma.note.findMany({ where: { folderId, deletedAt: null } })
  },

  async getNoteById(noteId: string) {
    return prisma.note.findUniqueOrThrow({ where: { id: noteId } })
  },

  async updateNote(noteId: string, data: UpdateNoteInput) {
    return prisma.note.update({
      where: { id: noteId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && {
          content: data.content as Prisma.InputJsonValue,
          contentText: extractText(data.content),
        }),
      },
    })
  },

  async softDeleteNote(noteId: string) {
    return prisma.note.update({ where: { id: noteId }, data: { deletedAt: new Date() } })
  },

  async restoreNote(noteId: string) {
    return prisma.note.update({ where: { id: noteId }, data: { deletedAt: null } })
  },
}
