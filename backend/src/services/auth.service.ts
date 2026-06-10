import { sign, verify } from 'hono/jwt'
import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'
import { JWT_SECRET } from '../lib/env.js'
import { hashPassword, verifyPassword, needsRehash } from '../lib/password.js'
import { isPasswordPwned } from '../lib/hibp.js'
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js'
const ACCESS_TTL = 60 * 15          // 15 minutes
const REFRESH_TTL = 60 * 60 * 24 * 7 // 7 days

type SafeUser = {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

function sanitizeUser(user: SafeUser & { password: string }): SafeUser {
  const { password: _pw, ...safe } = user
  void _pw
  return safe
}

async function generateTokens(userId: string, tokenVersion: number) {
  const now = Math.floor(Date.now() / 1000)
  const accessToken = await sign({ sub: userId, exp: now + ACCESS_TTL }, JWT_SECRET, 'HS256')
  const refreshToken = await sign(
    { sub: userId, tokenVersion, exp: now + REFRESH_TTL },
    JWT_SECRET,
    'HS256',
  )
  return { accessToken, refreshToken }
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) {
      throw Object.assign(new Error('Email already in use'), { code: 'CONFLICT' })
    }

    // Reject passwords known to be compromised (HIBP k-anonymity, §5.3).
    if (await isPasswordPwned(input.password)) {
      throw Object.assign(new Error('Password found in a known data breach'), { code: 'PWNED' })
    }

    const hashed = await hashPassword(input.password)
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, password: hashed },
    })

    const tokens = await generateTokens(user.id, user.tokenVersion)
    return { ...tokens, user: sanitizeUser(user) }
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'UNAUTHORIZED' })
    }

    const valid = await verifyPassword(user.password, input.password)
    if (!valid) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'UNAUTHORIZED' })
    }

    // Transparently upgrade legacy bcrypt hashes to argon2id on login (§5.2).
    if (needsRehash(user.password)) {
      const upgraded = await hashPassword(input.password)
      await prisma.user.update({ where: { id: user.id }, data: { password: upgraded } })
    }

    const tokens = await generateTokens(user.id, user.tokenVersion)
    return { ...tokens, user: sanitizeUser(user) }
  },

  async refresh(refreshToken: string) {
    let payload: { sub: string; tokenVersion?: number; exp: number }
    try {
      payload = (await verify(refreshToken, JWT_SECRET, 'HS256')) as typeof payload
    } catch {
      throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' })
    }

    const blacklisted = await redis.get(`bl:${refreshToken}`)
    if (blacklisted) {
      throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' })
    }

    // Global invalidation (§5.5): the token's version must still match the
    // user's current tokenVersion, otherwise all their sessions were revoked.
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' })
    }

    const now = Math.floor(Date.now() / 1000)
    const accessToken = await sign({ sub: payload.sub, exp: now + ACCESS_TTL }, JWT_SECRET, 'HS256')
    return { accessToken }
  },

  async logout(refreshToken: string) {
    let payload: { sub: string; exp: number }
    try {
      payload = (await verify(refreshToken, JWT_SECRET, 'HS256')) as typeof payload
    } catch {
      return // token already invalid, nothing to blacklist
    }

    const now = Math.floor(Date.now() / 1000)
    const ttl = payload.exp - now
    if (ttl > 0) {
      await redis.setex(`bl:${refreshToken}`, ttl, '1')
    }
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    return sanitizeUser(user)
  },
}
