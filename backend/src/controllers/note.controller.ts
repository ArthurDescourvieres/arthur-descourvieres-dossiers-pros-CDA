import type { Context } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { createNoteSchema, updateNoteSchema } from '../schemas/note.schema.js'
import { noteService } from '../services/note.service.js'

type C = Context<AppEnv>

export const noteController = {
  async create(c: C) {
    const body = await c.req.json()
    const result = createNoteSchema.safeParse(body)
    if (!result.success) return c.json({ error: result.error.flatten() }, 400)

    const createdById = (c.get('jwtPayload') as { sub: string }).sub
    const note = await noteService.createNote(result.data, createdById)
    return c.json(note, 201)
  },

  async getByFolder(c: C) {
    const folderId = c.req.param('folderId')!
    const notes = await noteService.getNotesByFolder(folderId)
    return c.json(notes, 200)
  },

  async getById(c: C) {
    const noteId = c.req.param('noteId')!
    try {
      const note = await noteService.getNoteById(noteId)
      return c.json(note, 200)
    } catch {
      return c.json({ error: 'Note not found' }, 404)
    }
  },

  async update(c: C) {
    const noteId = c.req.param('noteId')!
    const body = await c.req.json()
    const result = updateNoteSchema.safeParse(body)
    if (!result.success) return c.json({ error: result.error.flatten() }, 400)
    try {
      const note = await noteService.updateNote(noteId, result.data)
      return c.json(note, 200)
    } catch {
      return c.json({ error: 'Note not found' }, 404)
    }
  },

  async softDelete(c: C) {
    const noteId = c.req.param('noteId')!
    try {
      await noteService.softDeleteNote(noteId)
      return c.body(null, 204)
    } catch {
      return c.json({ error: 'Note not found' }, 404)
    }
  },

  async restore(c: C) {
    const noteId = c.req.param('noteId')!
    try {
      const note = await noteService.restoreNote(noteId)
      return c.json(note, 200)
    } catch {
      return c.json({ error: 'Note not found' }, 404)
    }
  },
}
