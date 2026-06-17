import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { corsMiddleware, securityHeaders } from './security'

function makeApp() {
  const app = new Hono()
  app.use('*', corsMiddleware)
  app.use('*', securityHeaders)
  app.get('/ping', (c) => c.json({ ok: true }))
  return app
}

describe('security headers (§7.1)', () => {
  it('sets a strict CSP and the standard hardening headers', async () => {
    const res = await makeApp().request('/ping')

    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'")
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    expect(res.headers.get('referrer-policy')).toBe('no-referrer')
    expect(res.headers.get('strict-transport-security')).toContain('max-age=')
  })
})

describe('CORS allow-list (§7.1)', () => {
  it('reflects an allowed origin and allows credentials', async () => {
    const res = await makeApp().request('/ping', {
      headers: { Origin: 'http://localhost:5173' },
    })

    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
    expect(res.headers.get('access-control-allow-credentials')).toBe('true')
  })

  it('does not emit an allow-origin header for a non-listed origin', async () => {
    const res = await makeApp().request('/ping', {
      headers: { Origin: 'http://evil.example' },
    })

    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})
