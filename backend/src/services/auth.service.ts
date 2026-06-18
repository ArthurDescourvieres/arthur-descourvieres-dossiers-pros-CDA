import { sign, verify } from 'hono/jwt'
import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'
import { JWT_SECRET } from '../lib/env.js'
import { hashPassword, verifyPassword, needsRehash } from '../lib/password.js'
import { isPasswordPwned } from '../lib/hibp.js'
import { securityLog } from '../lib/logger.js'
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js'
const ACCESS_TTL = 60 * 15 // 15 minutes
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

    const existingName = await prisma.user.findUnique({ where: { name: input.name } })
    if (existingName) {
      throw Object.assign(new Error('Name already in use'), { code: 'NAME_CONFLICT' })
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
    const isEmail = input.identifier.includes('@')
    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: input.identifier } })
      : await prisma.user.findUnique({ where: { name: input.identifier } })
    if (!user) {
      securityLog('login_failed', { identifier: input.identifier, reason: 'unknown_user' })
      throw Object.assign(new Error('Invalid credentials'), { code: 'UNAUTHORIZED' })
    }

    const valid = await verifyPassword(user.password, input.password)
    if (!valid) {
      securityLog('login_failed', { identifier: input.identifier, reason: 'bad_password' })
      throw Object.assign(new Error('Invalid credentials'), { code: 'UNAUTHORIZED' })
    }

    // Un compte désactivé (suppression RGPD en cours, période de grâce 30 j) ne
    // peut plus se reconnecter (§ RGPD — droit à l'effacement).
    if (user.deactivatedAt) {
      securityLog('login_deactivated', { userId: user.id })
      throw Object.assign(new Error('Account deactivated'), { code: 'DEACTIVATED' })
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
      // Bad signature / expired / malformed — includes tokens signed with a
      // foreign key (§10).
      securityLog('refresh_invalid')
      throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' })
    }

    const blacklisted = await redis.get(`bl:${refreshToken}`)
    if (blacklisted) {
      securityLog('refresh_blacklisted', { userId: payload.sub })
      throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' })
    }

    // Global invalidation (§5.5): the token's version must still match the
    // user's current tokenVersion, otherwise all their sessions were revoked.
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || user.tokenVersion !== payload.tokenVersion || user.deactivatedAt) {
      securityLog('refresh_version_mismatch', { userId: payload.sub })
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
