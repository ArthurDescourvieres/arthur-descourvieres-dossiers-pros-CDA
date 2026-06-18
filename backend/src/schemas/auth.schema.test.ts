import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema } from './auth.schema'

describe('register password policy (§5.3)', () => {
  it('rejects passwords shorter than 12 characters', () => {
    const result = registerSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'short-pass', // 10 chars
    })
    expect(result.success).toBe(false)
  })

  it('accepts a password of at least 12 characters', () => {
    const result = registerSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'a-sufficiently-long-passphrase',
    })
    expect(result.success).toBe(true)
  })
})

describe('login schema', () => {
  it('does not impose the 12-char minimum on login', () => {
    const result = loginSchema.safeParse({ identifier: 'ada@example.com', password: 'legacy' })
    expect(result.success).toBe(true)
  })
})
