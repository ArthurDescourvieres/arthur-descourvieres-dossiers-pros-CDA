import bcrypt from 'bcryptjs'
import { sign } from 'hono/jwt'
import { prisma } from '../lib/prisma.js'
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js'

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

async function generateToken(userId: string): Promise<string> {
  return sign(
    { sub: userId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
    process.env.JWT_SECRET ?? 'secret',
    'HS256',
  )
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

    const token = await generateToken(user.id)
    return { token, user: sanitizeUser(user) }
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

    const token = await generateToken(user.id)
    return { token, user: sanitizeUser(user) }
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    return sanitizeUser(user)
  },
}
