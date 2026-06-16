import type { Context, MiddlewareHandler } from 'hono'
import { redis } from '../lib/redis.js'

type RateLimitOptions = {
  keyPrefix: string
  limit: number
  windowSec: number
}

function clientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return c.req.header('x-real-ip') ?? 'unknown'
}

/**
 * Fixed-window rate limiter backed by Redis (§5.6 / §7.1). Counts requests per
 * client IP under `rl:<prefix>:<ip>`; once the limit is exceeded within the
 * window it responds 429 with a Retry-After header until the window expires.
 *
 * The client IP comes from X-Forwarded-For, which Caddy sets in production.
 */
export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    const key = `rl:${opts.keyPrefix}:${clientIp(c)}`
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, opts.windowSec)
    if (count > opts.limit) {
      const ttl = await redis.ttl(key)
      c.header('Retry-After', String(ttl > 0 ? ttl : opts.windowSec))
      return c.json({ error: 'Too many requests' }, 429)
    }
    return next()
  }
}

// Anti-brute-force on login: 5 attempts / minute / IP (§5.6, T-AUTH-02).
export const loginRateLimit = rateLimit({ keyPrefix: 'login', limit: 5, windowSec: 60 })

// Throttle attachment uploads: 20 / minute / IP — limite l'abus du stockage (§7.3).
export const uploadRateLimit = rateLimit({ keyPrefix: 'upload', limit: 20, windowSec: 60 })
