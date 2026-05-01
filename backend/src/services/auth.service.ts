import bcrypt from 'bcryptjs'
import { sign, verify } from 'hono/jwt'
import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'secret'
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

async function generateTokens(userId: string) {
  const now = Math.floor(Date.now() / 1000)
  const accessToken = await sign({ sub: userId, exp: now + ACCESS_TTL }, JWT_SECRET, 'HS256')
  const refreshToken = await sign({ sub: userId, exp: now + REFRESH_TTL }, JWT_SECRET, 'HS256')
  return { accessToken, refreshToken }
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) {
      throw Object.assign(new Error('Email already in use'), { code: 'CONFLICT' })
    }

    const hashed = await bcrypt.hash(input.password, 10)
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, password: hashed },
    })

    const tokens = await generateTokens(user.id)
    return { ...tokens, user: sanitizeUser(user) }
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'UNAUTHORIZED' })
    }

    const valid = await bcrypt.compare(input.password, user.password)
    if (!valid) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'UNAUTHORIZED' })
    }

    const tokens = await generateTokens(user.id)
    return { ...tokens, user: sanitizeUser(user) }
  },

  async refresh(refreshToken: string) {
    let payload: { sub: string; exp: number }
    try {
      payload = (await verify(refreshToken, JWT_SECRET, 'HS256')) as typeof payload
    } catch {
      throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' })
    }

    const blacklisted = await redis.get(`bl:${refreshToken}`)
    if (blacklisted) {
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
