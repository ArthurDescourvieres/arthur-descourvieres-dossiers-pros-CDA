import { describe, it, expect, vi } from 'vitest'

// Registration calls the real HIBP API; stub it so the suite stays
// deterministic and offline (its own unit test covers the k-anonymity logic).
vi.mock('../lib/hibp.js', () => ({ isPasswordPwned: vi.fn(async () => false) }))

import { app } from '../app.js'

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('auth integration', () => {
  it('registers then logs in a user (argon2id round-trip through the real DB)', async () => {
    const creds = { name: 'Ada', email: 'ada@example.com', password: 'a-strong-passphrase-123' }

    const reg = await post('/api/auth/register', creds)
    expect(reg.status).toBe(201)
    const regBody = (await reg.json()) as { accessToken: string; user: { email: string } }
    expect(regBody.accessToken).toBeTruthy()
    expect(regBody.user.email).toBe('ada@example.com')

    const login = await post('/api/auth/login', { email: creds.email, password: creds.password })
    expect(login.status).toBe(200)
  })

  it('rate-limits login to 5/min/IP — the 6th attempt is 429 (T-AUTH-02)', async () => {
    const attempt = () =>
      post(
        '/api/auth/login',
        { email: 'nobody@example.com', password: 'whatever-pass' },
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
})
