import { Hono } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requireRole, resolveWorkspaceFromNote, WorkspaceRole } from '../middlewares/rbac.js'
import { noteController } from '../controllers/note.controller.js'

// Mounted at /workspaces — collection routes nested under workspace/folder
export const noteWorkspaceRouter = new Hono<AppEnv>()

noteWorkspaceRouter.get(
  '/:workspaceId/folders/:folderId/notes',
  authMiddleware,
  requireRole(WorkspaceRole.VIEWER),
  noteController.getByFolder,
)
noteWorkspaceRouter.post(
  '/:workspaceId/folders/:folderId/notes',
  authMiddleware,
  requireRole(WorkspaceRole.EDITOR),
  noteController.create,
)
noteWorkspaceRouter.get(
  '/:workspaceId/trash',
  authMiddleware,
  requireRole(WorkspaceRole.EDITOR),
  noteController.listTrash,
)

// Mounted at /notes — individual note routes (workspace resolved from note)
export const noteRouter = new Hono<AppEnv>()

noteRouter.get(
  '/:noteId',
  authMiddleware,
  resolveWorkspaceFromNote,
  requireRole(WorkspaceRole.VIEWER),
  noteController.getById,
)
noteRouter.patch(
  '/:noteId/restore',
  authMiddleware,
  resolveWorkspaceFromNote,
  requireRole(WorkspaceRole.EDITOR),
  noteController.restore,
)
noteRouter.patch(
  '/:noteId/move',
  authMiddleware,
  resolveWorkspaceFromNote,
  requireRole(WorkspaceRole.EDITOR),
  noteController.move,
)
noteRouter.patch(
  '/:noteId',
  authMiddleware,
  resolveWorkspaceFromNote,
  requireRole(WorkspaceRole.EDITOR),
  noteController.update,
)
noteRouter.delete(
  '/:noteId',
  authMiddleware,
  resolveWorkspaceFromNote,
  requireRole(WorkspaceRole.EDITOR),
  noteController.softDelete,
)
