import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'
import { hashPassword, verifyPassword, needsRehash } from './password'

describe('password hashing (argon2id)', () => {
  // T-AUTH-01 — hash then verify: true on the right password, false otherwise.
  it('hashes with argon2id and verifies correctly (T-AUTH-01)', async () => {
    const hash = await hashPassword('correct horse battery staple')

    expect(hash.startsWith('$argon2id$')).toBe(true)
    expect(await verifyPassword(hash, 'correct horse battery staple')).toBe(true)
    expect(await verifyPassword(hash, 'wrong password')).toBe(false)
  })

  it('returns false for a malformed hash instead of throwing', async () => {
    expect(await verifyPassword('not-a-real-hash', 'whatever')).toBe(false)
  })

  it('does not flag a fresh argon2id hash for rehashing', async () => {
    const hash = await hashPassword('another-strong-passphrase')
    expect(needsRehash(hash)).toBe(false)
  })
})

describe('legacy bcrypt migration (§5.2)', () => {
  it('verifies existing bcrypt hashes', async () => {
    const legacy = await bcrypt.hash('legacy-password', 10)

    expect(await verifyPassword(legacy, 'legacy-password')).toBe(true)
    expect(await verifyPassword(legacy, 'nope')).toBe(false)
  })

  it('flags bcrypt hashes for upgrade to argon2id', async () => {
    const legacy = await bcrypt.hash('legacy-password', 10)
    expect(needsRehash(legacy)).toBe(true)
  })
})
