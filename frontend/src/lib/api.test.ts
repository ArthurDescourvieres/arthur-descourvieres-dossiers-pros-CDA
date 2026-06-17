import { describe, it, expect, beforeEach } from 'vitest'
import { setAccessToken, getAccessToken } from './api'

describe('access token storage (§5.1 — memory only)', () => {
  beforeEach(() => {
    setAccessToken(null)
    sessionStorage.clear()
    localStorage.clear()
  })

  it('keeps the access token in memory and never writes web storage', () => {
    setAccessToken('jwt-abc')

    expect(getAccessToken()).toBe('jwt-abc')
    expect(sessionStorage.length).toBe(0)
    expect(localStorage.length).toBe(0)
  })

  it('clears the in-memory token when set to null', () => {
    setAccessToken('jwt-abc')
    setAccessToken(null)

    expect(getAccessToken()).toBeNull()
  })
})
