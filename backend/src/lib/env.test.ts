import { describe, it, expect } from 'vitest'
import { requireEnv, JWT_SECRET } from './env'

describe('requireEnv (fail-fast config §5.1)', () => {
  it('returns the value when the variable is set', () => {
    expect(requireEnv('FOO', { FOO: 'bar' })).toBe('bar')
  })

  it('throws when the variable is missing', () => {
    expect(() => requireEnv('FOO', {})).toThrow(/Missing required environment variable: FOO/)
  })

  it('throws when the variable is an empty string', () => {
    expect(() => requireEnv('FOO', { FOO: '' })).toThrow(/FOO/)
  })

  it('resolves JWT_SECRET at module load (injected by the test env)', () => {
    expect(JWT_SECRET).toBeTruthy()
  })
})
