import { Hono } from 'hono'
import type { AuthVariables } from '../middlewares/auth.js'
import { authMiddleware } from '../middlewares/auth.js'
import { authController } from '../controllers/auth.controller.js'

const authRouter = new Hono<{ Variables: AuthVariables }>()

authRouter.post('/register', authController.register)
authRouter.post('/login', authController.login)
authRouter.get('/me', authMiddleware, authController.me)

export { authRouter }
