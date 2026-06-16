import { Hono } from 'hono'
import { authRouter } from './auth.routes.js'
import { workspaceRouter } from './workspace.routes.js'
import { folderRouter } from './folder.routes.js'
import { noteWorkspaceRouter, noteRouter } from './note.routes.js'
import { noteAttachmentsRouter, attachmentRouter } from './attachment.routes.js'
import { searchRouter } from './search.routes.js'
import { workspaceInvitationRouter, invitationRouter } from './invitation.routes.js'
import { meRouter } from './user.routes.js'

export const router = new Hono()

router.get('/health', (c) => c.json({ status: 'ok' }))
router.route('/auth', authRouter)
router.route('/workspaces', workspaceRouter)
router.route('/workspaces', folderRouter)
router.route('/workspaces', noteWorkspaceRouter)
router.route('/workspaces', searchRouter)
router.route('/workspaces', workspaceInvitationRouter)
router.route('/notes', noteRouter)
router.route('/notes', noteAttachmentsRouter)
router.route('/attachments', attachmentRouter)
router.route('/invitations', invitationRouter)
router.route('/me', meRouter)
