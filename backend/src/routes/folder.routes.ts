import { Hono } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requireRole, WorkspaceRole } from '../middlewares/rbac.js'
import { folderController } from '../controllers/folder.controller.js'

// Mounted at /workspaces — paths here are relative to that prefix
const folderRouter = new Hono<AppEnv>()

folderRouter.get(
  '/:workspaceId/folders',
  authMiddleware,
  requireRole(WorkspaceRole.VIEWER),
  folderController.getByWorkspace,
)
folderRouter.get(
  '/:workspaceId/trash/folders',
  authMiddleware,
  requireRole(WorkspaceRole.EDITOR),
  folderController.listTrash,
)
folderRouter.post(
  '/:workspaceId/folders',
  authMiddleware,
  requireRole(WorkspaceRole.EDITOR),
  folderController.create,
)
folderRouter.patch(
  '/:workspaceId/folders/:folderId/move',
  authMiddleware,
  requireRole(WorkspaceRole.EDITOR),
  folderController.move,
)
folderRouter.patch(
  '/:workspaceId/folders/:folderId/restore',
  authMiddleware,
  requireRole(WorkspaceRole.EDITOR),
  folderController.restore,
)
folderRouter.patch(
  '/:workspaceId/folders/:folderId',
  authMiddleware,
  requireRole(WorkspaceRole.EDITOR),
  folderController.update,
)
folderRouter.delete(
  '/:workspaceId/folders/:folderId',
  authMiddleware,
  requireRole(WorkspaceRole.EDITOR),
  folderController.remove,
)

export { folderRouter }
