import type { Context } from 'hono'
import type { AuthVariables } from '../middlewares/auth.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
import { authService } from '../services/auth.service.js'

type AuthContext = Context<{ Variables: AuthVariables }>

function hasCode(e: unknown, code: string): boolean {
  return e instanceof Error && (e as Error & { code?: string }).code === code
}

export const authController = {
  async register(c: Context) {
    const body = await c.req.json()
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return c.json({ error: result.error.flatten() }, 400)
    }

    try {
      const data = await authService.register(result.data)
      return c.json(data, 201)
    } catch (e) {
      if (hasCode(e, 'CONFLICT')) return c.json({ error: 'Email already in use' }, 409)
      throw e
    }
  },

  async login(c: Context) {
    const body = await c.req.json()
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return c.json({ error: result.error.flatten() }, 400)
    }

    try {
      const data = await authService.login(result.data)
      return c.json(data, 200)
    } catch (e) {
      if (hasCode(e, 'UNAUTHORIZED')) return c.json({ error: 'Invalid credentials' }, 401)
      throw e
    }
  },

  async me(c: AuthContext) {
    const payload = c.get('jwtPayload')
    const userId = payload.sub as string
    const user = await authService.getMe(userId)
    return c.json({ user }, 200)
  },
}
