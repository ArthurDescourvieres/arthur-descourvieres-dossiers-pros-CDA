import { Hono } from 'hono'
import { authRouter } from './auth.routes.js'

export const router = new Hono()

router.get('/health', (c) => c.json({ status: 'ok' }))
router.route('/auth', authRouter)
