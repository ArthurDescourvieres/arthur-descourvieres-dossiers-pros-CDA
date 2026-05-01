import { Hono } from 'hono'
import { authRouter } from './auth.routes.js'
import { workspaceRouter } from './workspace.routes.js'
import { folderRouter } from './folder.routes.js'
import { noteWorkspaceRouter, noteRouter } from './note.routes.js'

export const router = new Hono()

router.get('/health', (c) => c.json({ status: 'ok' }))
router.route('/auth', authRouter)
router.route('/workspaces', workspaceRouter)
router.route('/workspaces', folderRouter)
router.route('/workspaces', noteWorkspaceRouter)
router.route('/notes', noteRouter)
