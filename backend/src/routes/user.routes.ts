import { Hono } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { authMiddleware } from '../middlewares/auth.js'
import { userController } from '../controllers/user.controller.js'

// Monté sur /me — actions RGPD sur le compte courant.
const meRouter = new Hono<AppEnv>()

meRouter.get('/export', authMiddleware, userController.exportMe)
meRouter.delete('/', authMiddleware, userController.deleteMe)

export { meRouter }
