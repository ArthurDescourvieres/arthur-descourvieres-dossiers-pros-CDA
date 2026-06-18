import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { api, ApiError, setAccessToken, getAccessToken } from './api'

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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('api() request client', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setAccessToken(null)
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessToken(null)
  })

  it('attaches the Bearer token and returns the parsed JSON body', async () => {
    setAccessToken('tok-1')
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'w1' }))

    const data = await api<{ id: string }>('/api/workspaces')

    expect(data).toEqual({ id: 'w1' })
    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/workspaces')
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer tok-1')
    expect(init.credentials).toBe('include')
  })

  it('serialises a json body with the application/json content-type', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await api('/api/workspaces', { method: 'POST', json: { name: 'Memo' } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ name: 'Memo' }))
    expect((init.headers as Headers).get('Content-Type')).toBe('application/json')
  })

  it('throws an ApiError carrying the status and payload on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'NAME_TAKEN' }, 409))

    const err = await api('/api/workspaces', { method: 'POST', json: {} }).catch((e) => e)

    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(409)
    expect((err as ApiError).payload).toEqual({ error: 'NAME_TAKEN' })
  })

  it('refreshes the token on 401 then replays the original request', async () => {
    setAccessToken('stale')
    fetchMock.mockImplementation((path: string, init?: RequestInit) => {
      const url = String(path)
      if (url.includes('/api/auth/refresh')) {
        return Promise.resolve(jsonResponse({ accessToken: 'fresh' }))
      }
      const auth = (init?.headers as Headers | undefined)?.get('Authorization')
      if (auth === 'Bearer fresh') return Promise.resolve(jsonResponse({ id: 'note-1' }))
      return Promise.resolve(jsonResponse({ error: 'EXPIRED' }, 401))
    })

    const data = await api<{ id: string }>('/api/notes/note-1')

    expect(data).toEqual({ id: 'note-1' })
    expect(getAccessToken()).toBe('fresh')
  })

  it('clears the token and surfaces the 401 when the silent refresh fails', async () => {
    setAccessToken('stale')
    fetchMock.mockImplementation((path: string) => {
      const url = String(path)
      if (url.includes('/api/auth/refresh')) return Promise.resolve(jsonResponse({}, 401))
      return Promise.resolve(jsonResponse({ error: 'EXPIRED' }, 401))
    })

    const err = await api('/api/notes/x').catch((e) => e)

    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(401)
    expect(getAccessToken()).toBeNull()
  })
})
