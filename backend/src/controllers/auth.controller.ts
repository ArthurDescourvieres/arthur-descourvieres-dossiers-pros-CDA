import type { Context } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import type { AppEnv } from '../types/hono.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
import { authService } from '../services/auth.service.js'

type AuthContext = Context<AppEnv>

const REFRESH_COOKIE = 'refreshToken'
const REFRESH_TTL = 60 * 60 * 24 * 7

function hasCode(e: unknown, code: string): boolean {
  return e instanceof Error && (e as Error & { code?: string }).code === code
}

function setRefreshCookie(c: Context, token: string) {
  setCookie(c, REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: REFRESH_TTL,
    path: '/',
  })
}

export const authController = {
  async register(c: Context) {
    const body = await c.req.json()
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return c.json({ error: result.error.flatten() }, 400)
    }

    try {
      const { accessToken, refreshToken, user } = await authService.register(result.data)
      setRefreshCookie(c, refreshToken)
      return c.json({ accessToken, user }, 201)
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
      const { accessToken, refreshToken, user } = await authService.login(result.data)
      setRefreshCookie(c, refreshToken)
      return c.json({ accessToken, user }, 200)
    } catch (e) {
      if (hasCode(e, 'UNAUTHORIZED')) return c.json({ error: 'Unauthorized' }, 401)
      throw e
    }
  },

  async refresh(c: Context) {
    const token = getCookie(c, REFRESH_COOKIE)
    if (!token) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const { accessToken } = await authService.refresh(token)
      return c.json({ accessToken }, 200)
    } catch (e) {
      if (hasCode(e, 'UNAUTHORIZED')) return c.json({ error: 'Unauthorized' }, 401)
      throw e
    }
  },

  async logout(c: Context) {
    const token = getCookie(c, REFRESH_COOKIE)
    if (token) {
      await authService.logout(token)
    }
    deleteCookie(c, REFRESH_COOKIE, { path: '/' })
    return c.json({ message: 'Logged out' }, 200)
  },

  async me(c: AuthContext) {
    const payload = c.get('jwtPayload')
    const userId = payload.sub as string
    const user = await authService.getMe(userId)
    return c.json({ user }, 200)
  },
}
