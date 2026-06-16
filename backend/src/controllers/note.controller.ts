import type { Context } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { createNoteSchema, updateNoteSchema, moveNoteSchema } from '../schemas/note.schema.js'
import { parsePagination } from '../lib/pagination.js'
import { noteService } from '../services/note.service.js'

type C = Context<AppEnv>

function hasCode(e: unknown, code: string): boolean {
  return e instanceof Error && (e as Error & { code?: string }).code === code
}

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
    const notes = await noteService.getNotesByFolder(folderId, parsePagination(c))
    return c.json(notes, 200)
  },

  async getById(c: C) {
    const noteId = c.req.param('noteId')!
    try {
      const note = await noteService.getNoteById(noteId)
      return c.json(note, 200)
    } catch {
      return c.json({ error: 'Forbidden' }, 403)
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
      return c.json({ error: 'Forbidden' }, 403)
    }
  },

  async move(c: C) {
    const noteId = c.req.param('noteId')!
    const body = await c.req.json()
    const result = moveNoteSchema.safeParse(body)
    if (!result.success) return c.json({ error: result.error.flatten() }, 400)
    try {
      const note = await noteService.moveNote(noteId, result.data.targetFolderId)
      return c.json(note, 200)
    } catch (e) {
      if (hasCode(e, 'INVALID_TARGET'))
        return c.json({ error: 'Target folder is not in the same workspace' }, 400)
      return c.json({ error: 'Forbidden' }, 403)
    }
  },

  async softDelete(c: C) {
    const noteId = c.req.param('noteId')!
    try {
      await noteService.softDeleteNote(noteId)
      return c.body(null, 204)
    } catch {
      return c.json({ error: 'Forbidden' }, 403)
    }
  },

  async restore(c: C) {
    const noteId = c.req.param('noteId')!
    try {
      const note = await noteService.restoreNote(noteId)
      return c.json(note, 200)
    } catch {
      return c.json({ error: 'Forbidden' }, 403)
    }
  },

  async listTrash(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    const notes = await noteService.getDeletedNotesByWorkspace(workspaceId, parsePagination(c))
    return c.json(notes, 200)
  },
}
