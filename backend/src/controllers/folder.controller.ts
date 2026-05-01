import type { Context } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { createFolderSchema, updateFolderSchema } from '../schemas/folder.schema.js'
import { folderService } from '../services/folder.service.js'

type C = Context<AppEnv>

export const folderController = {
  async create(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    const body = await c.req.json()
    const result = createFolderSchema.safeParse(body)
    if (!result.success) return c.json({ error: result.error.flatten() }, 400)
    const folder = await folderService.createFolder(result.data, workspaceId)
    return c.json(folder, 201)
  },

  async getByWorkspace(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    const folders = await folderService.getFoldersByWorkspace(workspaceId)
    return c.json(folders, 200)
  },

  async update(c: C) {
    const folderId = c.req.param('folderId')!
    const body = await c.req.json()
    const result = updateFolderSchema.safeParse(body)
    if (!result.success) return c.json({ error: result.error.flatten() }, 400)
    try {
      const folder = await folderService.updateFolder(folderId, result.data)
      return c.json(folder, 200)
    } catch {
      return c.json({ error: 'Folder not found' }, 404)
    }
  },

  async remove(c: C) {
    const folderId = c.req.param('folderId')!
    try {
      await folderService.deleteFolder(folderId)
      return c.body(null, 204)
    } catch {
      return c.json({ error: 'Folder not found' }, 404)
    }
  },
}
