import type { Context } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { createInvitationSchema } from '../schemas/invitation.schema.js'
import { invitationService } from '../services/invitation.service.js'

type C = Context<AppEnv>

function hasCode(e: unknown, code: string): boolean {
  return e instanceof Error && (e as Error & { code?: string }).code === code
}

export const invitationController = {
  async create(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    const body = await c.req.json()
    const result = createInvitationSchema.safeParse(body)
    if (!result.success) return c.json({ error: result.error.flatten() }, 400)

    const invitedById = (c.get('jwtPayload') as { sub: string }).sub
    try {
      const invitation = await invitationService.createInvitation(
        workspaceId,
        result.data.identifier,
        result.data.role,
        invitedById,
      )
      return c.json(invitation, 201)
    } catch (e) {
      if (hasCode(e, 'USER_NOT_FOUND')) {
        return c.json({ error: 'Aucun utilisateur ne correspond à ce pseudo.' }, 404)
      }
      throw e
    }
  },

  async list(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    const invitations = await invitationService.listPending(workspaceId)
    return c.json(invitations, 200)
  },

  async revoke(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    const invitationId = c.req.param('invitationId')!
    try {
      await invitationService.revokeInvitation(workspaceId, invitationId)
      return c.body(null, 204)
    } catch (e) {
      if (hasCode(e, 'NOT_FOUND')) return c.json({ error: 'Invitation introuvable.' }, 404)
      throw e
    }
  },

  // Public: minimal invitation metadata so the invite landing page can show the
  // workspace/role and prefill the signup email. 404 hides anything not pending.
  async peek(c: C) {
    const token = c.req.param('token')!
    try {
      const meta = await invitationService.getInvitationByToken(token)
      return c.json(meta, 200)
    } catch (e) {
      if (hasCode(e, 'NOT_FOUND')) {
        return c.json({ error: 'Invitation introuvable ou expirée.' }, 404)
      }
      throw e
    }
  },

  async accept(c: C) {
    const token = c.req.param('token')!
    const userId = (c.get('jwtPayload') as { sub: string }).sub
    try {
      const result = await invitationService.acceptInvitation(token, userId)
      return c.json(result, 201)
    } catch (e) {
      if (hasCode(e, 'NOT_FOUND')) return c.json({ error: 'Invitation introuvable.' }, 404)
      if (hasCode(e, 'EXPIRED')) return c.json({ error: 'Invitation expirée.' }, 410)
      if (hasCode(e, 'CONFLICT')) return c.json({ error: 'Invitation déjà acceptée.' }, 409)
      if (hasCode(e, 'FORBIDDEN')) return c.json({ error: 'Accès refusé.' }, 403)
      throw e
    }
  },
}
