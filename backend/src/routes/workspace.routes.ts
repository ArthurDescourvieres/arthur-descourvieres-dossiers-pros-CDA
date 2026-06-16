import { Hono } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requireRole, WorkspaceRole } from '../middlewares/rbac.js'
import { workspaceController } from '../controllers/workspace.controller.js'

const workspaceRouter = new Hono<AppEnv>()

workspaceRouter.post('/', authMiddleware, workspaceController.create)
workspaceRouter.get('/', authMiddleware, workspaceController.getMyWorkspaces)

workspaceRouter.get(
  '/:workspaceId',
  authMiddleware,
  requireRole(WorkspaceRole.VIEWER),
  workspaceController.getById,
)
workspaceRouter.patch(
  '/:workspaceId',
  authMiddleware,
  requireRole(WorkspaceRole.OWNER),
  workspaceController.update,
)
workspaceRouter.delete(
  '/:workspaceId',
  authMiddleware,
  requireRole(WorkspaceRole.OWNER),
  workspaceController.remove,
)

workspaceRouter.post(
  '/:workspaceId/transfer-ownership',
  authMiddleware,
  requireRole(WorkspaceRole.OWNER),
  workspaceController.transferOwnership,
)

workspaceRouter.post(
  '/:workspaceId/members',
  authMiddleware,
  requireRole(WorkspaceRole.OWNER),
  workspaceController.addMember,
)
workspaceRouter.patch(
  '/:workspaceId/members/:userId',
  authMiddleware,
  requireRole(WorkspaceRole.OWNER),
  workspaceController.updateMemberRole,
)
workspaceRouter.delete(
  '/:workspaceId/members/:userId',
  authMiddleware,
  requireRole(WorkspaceRole.OWNER),
  workspaceController.removeMember,
)

export { workspaceRouter }
