import { Hono } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { authMiddleware } from '../middlewares/auth.js'
import {
  requireRole,
  resolveWorkspaceFromNote,
  resolveWorkspaceFromAttachment,
  WorkspaceRole,
} from '../middlewares/rbac.js'
import { attachmentController } from '../controllers/attachment.controller.js'

// Mounted at /notes — list & upload nested under a note.
export const noteAttachmentsRouter = new Hono<AppEnv>()

noteAttachmentsRouter.get(
  '/:noteId/attachments',
  authMiddleware,
  resolveWorkspaceFromNote,
  requireRole(WorkspaceRole.VIEWER),
  attachmentController.list,
)

noteAttachmentsRouter.post(
  '/:noteId/attachments',
  authMiddleware,
  resolveWorkspaceFromNote,
  requireRole(WorkspaceRole.EDITOR),
  attachmentController.upload,
)

// Mounted at /attachments — operations on a single attachment.
export const attachmentRouter = new Hono<AppEnv>()

attachmentRouter.get(
  '/:id/file',
  authMiddleware,
  resolveWorkspaceFromAttachment,
  requireRole(WorkspaceRole.VIEWER),
  attachmentController.serveFile,
)

attachmentRouter.delete(
  '/:id',
  authMiddleware,
  resolveWorkspaceFromAttachment,
  requireRole(WorkspaceRole.VIEWER), // uploader can also delete; finer check inside controller
  attachmentController.remove,
)
