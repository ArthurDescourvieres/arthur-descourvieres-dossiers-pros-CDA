import type { Context } from 'hono'
import type { AppEnv } from '../types/hono.js'
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '../schemas/workspace.schema.js'
import { workspaceService } from '../services/workspace.service.js'

type C = Context<AppEnv>

function hasCode(e: unknown, code: string): boolean {
  return e instanceof Error && (e as Error & { code?: string }).code === code
}

export const workspaceController = {
  async create(c: C) {
    const body = await c.req.json()
    const result = createWorkspaceSchema.safeParse(body)
    if (!result.success) return c.json({ error: result.error.flatten() }, 400)

    const ownerId = (c.get('jwtPayload') as { sub: string }).sub
    try {
      const workspace = await workspaceService.createWorkspace(result.data, ownerId)
      return c.json(workspace, 201)
    } catch (e) {
      if (hasCode(e, 'CONFLICT')) return c.json({ error: 'Slug already in use' }, 409)
      throw e
    }
  },

  async getMyWorkspaces(c: C) {
    const userId = (c.get('jwtPayload') as { sub: string }).sub
    const workspaces = await workspaceService.getWorkspacesByUser(userId)
    return c.json(workspaces, 200)
  },

  async getById(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    try {
      const workspace = await workspaceService.getWorkspaceById(workspaceId)
      return c.json(workspace, 200)
    } catch {
      return c.json({ error: 'Workspace not found' }, 404)
    }
  },

  async update(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    const body = await c.req.json()
    const result = updateWorkspaceSchema.safeParse(body)
    if (!result.success) return c.json({ error: result.error.flatten() }, 400)
    try {
      const workspace = await workspaceService.updateWorkspace(workspaceId, result.data)
      return c.json(workspace, 200)
    } catch {
      return c.json({ error: 'Workspace not found' }, 404)
    }
  },

  async remove(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    try {
      await workspaceService.deleteWorkspace(workspaceId)
      return c.body(null, 204)
    } catch {
      return c.json({ error: 'Workspace not found' }, 404)
    }
  },

  async addMember(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    const body = await c.req.json()
    const result = inviteMemberSchema.safeParse(body)
    if (!result.success) return c.json({ error: result.error.flatten() }, 400)
    try {
      const member = await workspaceService.addMember(workspaceId, result.data.userId, result.data.role)
      return c.json(member, 201)
    } catch (e) {
      if (hasCode(e, 'CONFLICT')) return c.json({ error: 'User is already a member' }, 409)
      throw e
    }
  },

  async updateMemberRole(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    const userId = c.req.param('userId')!
    const body = await c.req.json()
    const result = updateMemberRoleSchema.safeParse(body)
    if (!result.success) return c.json({ error: result.error.flatten() }, 400)
    try {
      const member = await workspaceService.updateMemberRole(workspaceId, userId, result.data.role)
      return c.json(member, 200)
    } catch (e) {
      if (hasCode(e, 'FORBIDDEN')) return c.json({ error: 'Cannot change role of workspace owner' }, 403)
      throw e
    }
  },

  async removeMember(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    const userId = c.req.param('userId')!
    try {
      await workspaceService.removeMember(workspaceId, userId)
      return c.body(null, 204)
    } catch (e) {
      if (hasCode(e, 'FORBIDDEN')) return c.json({ error: 'Cannot remove workspace owner' }, 403)
      throw e
    }
  },
}
