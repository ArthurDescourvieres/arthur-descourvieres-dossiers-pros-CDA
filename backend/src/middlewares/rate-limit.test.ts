import { describe, it, expect, vi } from 'vitest'

const { incr, expire, ttl } = vi.hoisted(() => {
  let counter = 0
  return {
    incr: vi.fn(async () => ++counter),
    expire: vi.fn(async () => 1),
    ttl: vi.fn(async () => 60),
  }
})

vi.mock('../lib/redis.js', () => ({ redis: { incr, expire, ttl } }))

import { Hono } from 'hono'
import { rateLimit } from './rate-limit'

describe('rateLimit (§5.6)', () => {
  it('allows up to the limit then returns 429, setting the window TTL once', async () => {
    const app = new Hono()
    app.post('/x', rateLimit({ keyPrefix: 'test', limit: 5, windowSec: 60 }), (c) =>
      c.json({ ok: true }),
    )

    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      const res = await app.request('/x', { method: 'POST' })
      statuses.push(res.status)
    }

    expect(statuses).toEqual([200, 200, 200, 200, 200, 429])
    expect(expire).toHaveBeenCalledTimes(1) // only on the first request (count === 1)
  })
})
