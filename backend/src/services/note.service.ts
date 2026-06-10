import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { extractText } from '../lib/tiptap.js'
import { sanitizeTiptapContent } from '../lib/tiptap-sanitize.js'
import type { CreateNoteInput, UpdateNoteInput } from '../schemas/note.schema.js'

export const noteService = {
  async createNote(data: CreateNoteInput, createdById: string) {
    const content = sanitizeTiptapContent(data.content)
    return prisma.note.create({
      data: {
        title: data.title,
        content,
        contentText: extractText(content),
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
    const patch: Prisma.NoteUpdateInput = {}
    if (data.title !== undefined) patch.title = data.title
    if (data.content !== undefined) {
      const content = sanitizeTiptapContent(data.content)
      patch.content = content
      patch.contentText = extractText(content)
    }
    return prisma.note.update({ where: { id: noteId }, data: patch })
  },

  async softDeleteNote(noteId: string) {
    return prisma.note.update({ where: { id: noteId }, data: { deletedAt: new Date() } })
  },

  async restoreNote(noteId: string) {
    return prisma.note.update({ where: { id: noteId }, data: { deletedAt: null } })
  },
}
