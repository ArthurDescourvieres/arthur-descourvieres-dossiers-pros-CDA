import { describe, it, expect, vi } from 'vitest'

// Registration calls the real HIBP API; stub it so the suite stays
// deterministic and offline (its own unit test covers the k-anonymity logic).
vi.mock('../lib/hibp.js', () => ({ isPasswordPwned: vi.fn(async () => false) }))

import { app } from '../app.js'
import { sign } from 'hono/jwt'

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

function extractRefreshCookie(res: Response): string {
  const list =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : ([res.headers.get('set-cookie')].filter(Boolean) as string[])
  const cookie = list.find((c) => c.startsWith('refreshToken='))
  return cookie ? cookie.split(';')[0]! : ''
}

describe('auth integration', () => {
  it('registers then logs in a user (argon2id round-trip through the real DB)', async () => {
    const creds = { name: 'Ada', email: 'ada@example.com', password: 'a-strong-passphrase-123' }

    const reg = await post('/api/auth/register', creds)
    expect(reg.status).toBe(201)
    const regBody = (await reg.json()) as { accessToken: string; user: { email: string } }
    expect(regBody.accessToken).toBeTruthy()
    expect(regBody.user.email).toBe('ada@example.com')

    const login = await post('/api/auth/login', {
      identifier: creds.email,
      password: creds.password,
    })
    expect(login.status).toBe(200)
  })

  it('rate-limits login to 5/min/IP — the 6th attempt is 429 (T-AUTH-02)', async () => {
    const attempt = () =>
      post(
        '/api/auth/login',
        { identifier: 'nobody@example.com', password: 'whatever-pass' },
        { 'x-forwarded-for': '203.0.113.7' },
      )

    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      statuses.push((await attempt()).status)
    }

    // First 5 are processed (401, unknown user); the 6th is throttled.
    expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true)
    expect(statuses[5]).toBe(429)
  })

  it('rejects a refresh with a blacklisted (logged-out) token — 401 (T-AUTH-03)', async () => {
    const reg = await post('/api/auth/register', {
      name: 'Bob',
      email: 'bob@example.com',
      password: 'another-strong-passphrase',
    })
    const cookie = extractRefreshCookie(reg)
    expect(cookie.startsWith('refreshToken=')).toBe(true)

    // Valid before logout.
    const before = await app.request('/api/auth/refresh', { method: 'POST', headers: { cookie } })
    expect(before.status).toBe(200)

    // Logout blacklists the refresh token.
    await app.request('/api/auth/logout', { method: 'POST', headers: { cookie } })

    // The same token is now refused.
    const after = await app.request('/api/auth/refresh', { method: 'POST', headers: { cookie } })
    expect(after.status).toBe(401)
  })

  it('rejects a JWT signed with a foreign key — 401 (T-AUTH-04)', async () => {
    const now = Math.floor(Date.now() / 1000)
    const foreign = await sign(
      { sub: 'attacker', exp: now + 900 },
      'a-different-secret-not-ours',
      'HS256',
    )

    const res = await app.request('/api/auth/me', {
      headers: { authorization: `Bearer ${foreign}` },
    })
    expect(res.status).toBe(401)
  })
})
