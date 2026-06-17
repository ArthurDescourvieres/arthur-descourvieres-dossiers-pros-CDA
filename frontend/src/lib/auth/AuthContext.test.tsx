import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { setAccessToken, getAccessToken } from '../api'

const USER = { id: 'u1', email: 'a@b.co', name: 'Alice', createdAt: '', updatedAt: '' }

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

let fetchMock: ReturnType<typeof vi.fn>

describe('AuthContext', () => {
  beforeEach(() => {
    setAccessToken(null)
    // Default: silent refresh fails → guest boot. Tests override per scenario.
    fetchMock = vi.fn(() => Promise.resolve(jsonResponse({}, 401)))
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    setAccessToken(null)
  })

  it('falls back to guest when there is no token and refresh fails', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('guest'))
    expect(getAccessToken()).toBeNull()
  })

  it('boots authenticated via silent refresh then /me', async () => {
    fetchMock.mockImplementation((url: unknown) => {
      const u = String(url)
      if (u.includes('/api/auth/refresh'))
        return Promise.resolve(jsonResponse({ accessToken: 't1' }))
      if (u.includes('/api/auth/me')) return Promise.resolve(jsonResponse({ user: USER }))
      return Promise.resolve(jsonResponse({}, 404))
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('authenticated'))

    const state = result.current
    if (state.status === 'authenticated') expect(state.user.email).toBe('a@b.co')
    expect(getAccessToken()).toBe('t1')
  })

  it('login stores the token and switches to authenticated', async () => {
    fetchMock.mockImplementation((url: unknown) => {
      const u = String(url)
      if (u.includes('/api/auth/login'))
        return Promise.resolve(jsonResponse({ accessToken: 't2', user: USER }))
      return Promise.resolve(jsonResponse({}, 401)) // boot refresh → guest
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('guest'))

    await act(async () => {
      await result.current.login('a@b.co', 'pw')
    })

    expect(result.current.status).toBe('authenticated')
    expect(getAccessToken()).toBe('t2')
  })

  it('logout clears the token and returns to guest', async () => {
    let logoutCalled = false
    fetchMock.mockImplementation((url: unknown) => {
      const u = String(url)
      if (u.includes('/api/auth/refresh'))
        return Promise.resolve(jsonResponse({ accessToken: 't1' }))
      if (u.includes('/api/auth/me')) return Promise.resolve(jsonResponse({ user: USER }))
      if (u.includes('/api/auth/logout')) {
        logoutCalled = true
        return Promise.resolve(jsonResponse({}, 200))
      }
      return Promise.resolve(jsonResponse({}, 404))
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('authenticated'))

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.status).toBe('guest')
    expect(getAccessToken()).toBeNull()
    expect(logoutCalled).toBe(true)
  })
})
