import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { CORS_ORIGINS } from '../lib/env.js'

/**
 * CORS restricted to an explicit allow-list of origins (§7.1). With an array
 * origin, Hono reflects the request origin only when it is listed, and omits
 * the Access-Control-Allow-Origin header otherwise — no wildcard.
 */
export const corsMiddleware = cors({
  origin: CORS_ORIGINS,
  credentials: true,
})

/**
 * Security headers (Helmet-equivalent, §7.1). hono/secure-headers enables
 * nosniff / Referrer-Policy / HSTS / X-Frame-Options by default; the CSP is
 * NOT enabled by default, so we define a strict one explicitly. The API only
 * serves JSON and authenticated file streams, so `default-src 'none'` is a
 * safe, restrictive baseline.
 */
export const securityHeaders = secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'none'"],
    baseUri: ["'none'"],
    frameAncestors: ["'none'"],
  },
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
  xFrameOptions: 'DENY',
  referrerPolicy: 'no-referrer',
})
