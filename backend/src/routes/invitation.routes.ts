import { Hono } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requireRole, WorkspaceRole } from '../middlewares/rbac.js'
import { rateLimit } from '../middlewares/rate-limit.js'
import { invitationController } from '../controllers/invitation.controller.js'

// Rate limits for sharing/invitation routes (§7.1 / §7.4).
const createInviteLimit = rateLimit({ keyPrefix: 'invite-create', limit: 30, windowSec: 60 })
const acceptInviteLimit = rateLimit({ keyPrefix: 'invite-accept', limit: 10, windowSec: 60 })
const peekInviteLimit = rateLimit({ keyPrefix: 'invite-peek', limit: 60, windowSec: 60 })

// Mounted at /workspaces — OWNER manages invitations for their workspace.
export const workspaceInvitationRouter = new Hono<AppEnv>()

workspaceInvitationRouter.post(
  '/:workspaceId/invitations',
  authMiddleware,
  requireRole(WorkspaceRole.OWNER),
  createInviteLimit,
  invitationController.create,
)
workspaceInvitationRouter.get(
  '/:workspaceId/invitations',
  authMiddleware,
  requireRole(WorkspaceRole.OWNER),
  invitationController.list,
)
workspaceInvitationRouter.delete(
  '/:workspaceId/invitations/:invitationId',
  authMiddleware,
  requireRole(WorkspaceRole.OWNER),
  invitationController.revoke,
)

// Mounted at /invitations — the invited (authenticated) user accepts via token.
export const invitationRouter = new Hono<AppEnv>()

invitationRouter.post(
  '/:token/accept',
  authMiddleware,
  acceptInviteLimit,
  invitationController.accept,
)

// Public — no auth: the 32-byte token IS the credential. Lets the invite
// landing page show who/what the invite is for and prefill the signup email.
invitationRouter.get('/:token', peekInviteLimit, invitationController.peek)
