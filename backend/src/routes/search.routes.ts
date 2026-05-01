import { Hono } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requireRole, WorkspaceRole } from '../middlewares/rbac.js'
import { searchController } from '../controllers/search.controller.js'

// Mounted at /workspaces — search inside a workspace requires VIEWER.
export const searchRouter = new Hono<AppEnv>()

searchRouter.get(
  '/:workspaceId/search',
  authMiddleware,
  requireRole(WorkspaceRole.VIEWER),
  searchController.byWorkspace,
)
