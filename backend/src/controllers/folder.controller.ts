import type { Context } from 'hono'
import type { AppEnv } from '../types/hono.js'
import {
  createFolderSchema,
  updateFolderSchema,
  moveFolderSchema,
} from '../schemas/folder.schema.js'
import { folderService } from '../services/folder.service.js'

type C = Context<AppEnv>

function hasCode(e: unknown, code: string): boolean {
  return e instanceof Error && (e as Error & { code?: string }).code === code
}

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
      return c.json({ error: 'Accès refusé.' }, 403)
    }
  },

  async move(c: C) {
    const folderId = c.req.param('folderId')!
    const body = await c.req.json()
    const result = moveFolderSchema.safeParse(body)
    if (!result.success) return c.json({ error: result.error.flatten() }, 400)
    try {
      const folder = await folderService.moveFolder(folderId, result.data.targetParentId)
      return c.json(folder, 200)
    } catch (e) {
      if (hasCode(e, 'INVALID_TARGET'))
        return c.json({ error: "Le dossier cible n'appartient pas au même workspace." }, 400)
      if (hasCode(e, 'CYCLE'))
        return c.json(
          { error: "Impossible de déplacer un dossier dans l'un de ses sous-dossiers." },
          400,
        )
      return c.json({ error: 'Accès refusé.' }, 403)
    }
  },

  async remove(c: C) {
    const folderId = c.req.param('folderId')!
    try {
      await folderService.deleteFolder(folderId)
      return c.body(null, 204)
    } catch {
      return c.json({ error: 'Accès refusé.' }, 403)
    }
  },
}
