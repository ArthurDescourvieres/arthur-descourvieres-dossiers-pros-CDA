import type { Context } from 'hono'
import type { AppEnv } from '../types/hono.js'
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  transferOwnershipSchema,
} from '../schemas/workspace.schema.js'
import { parsePagination } from '../lib/pagination.js'
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
      if (hasCode(e, 'CONFLICT')) return c.json({ error: 'Ce nom est déjà utilisé.' }, 409)
      throw e
    }
  },

  async getMyWorkspaces(c: C) {
    const userId = (c.get('jwtPayload') as { sub: string }).sub
    const workspaces = await workspaceService.getWorkspacesByUser(userId, parsePagination(c))
    return c.json(workspaces, 200)
  },

  async getById(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    try {
      // Served read-through from Redis (cache:workspace:<id>); X-Cache exposes
      // whether this request was a hit, for the k6 cache-tenue scenario.
      const { json, hit } = await workspaceService.getWorkspaceJsonById(workspaceId)
      return c.body(json, 200, {
        'Content-Type': 'application/json',
        'X-Cache': hit ? 'HIT' : 'MISS',
      })
    } catch {
      return c.json({ error: 'Accès refusé.' }, 403)
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
      return c.json({ error: 'Accès refusé.' }, 403)
    }
  },

  async remove(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    try {
      await workspaceService.deleteWorkspace(workspaceId)
      return c.body(null, 204)
    } catch {
      return c.json({ error: 'Accès refusé.' }, 403)
    }
  },

  async addMember(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    const body = await c.req.json()
    const result = inviteMemberSchema.safeParse(body)
    if (!result.success) return c.json({ error: result.error.flatten() }, 400)
    try {
      const member = await workspaceService.addMember(
        workspaceId,
        result.data.userId,
        result.data.role,
      )
      return c.json(member, 201)
    } catch (e) {
      if (hasCode(e, 'CONFLICT')) return c.json({ error: 'Cet utilisateur est déjà membre.' }, 409)
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
      if (hasCode(e, 'FORBIDDEN'))
        return c.json({ error: 'Impossible de modifier le rôle du propriétaire.' }, 403)
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
      if (hasCode(e, 'CANNOT_REMOVE_OWNER'))
        return c.json(
          { error: 'Impossible de retirer le propriétaire.', code: 'CANNOT_REMOVE_OWNER' },
          403,
        )
      throw e
    }
  },

  async transferOwnership(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    const body = await c.req.json()
    const result = transferOwnershipSchema.safeParse(body)
    if (!result.success) return c.json({ error: result.error.flatten() }, 400)
    try {
      const member = await workspaceService.transferOwnership(workspaceId, result.data.newOwnerId)
      return c.json(member, 200)
    } catch (e) {
      if (hasCode(e, 'INVALID_TARGET'))
        return c.json({ error: 'Cet utilisateur est déjà propriétaire.' }, 400)
      if (hasCode(e, 'NOT_A_MEMBER'))
        return c.json({ error: 'Le nouveau propriétaire doit être membre du workspace.' }, 400)
      return c.json({ error: 'Accès refusé.' }, 403)
    }
  },
}
