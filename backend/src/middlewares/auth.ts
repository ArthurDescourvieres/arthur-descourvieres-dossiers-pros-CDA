import { jwt } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'
import type { MiddlewareHandler } from 'hono'
import { JWT_SECRET } from '../lib/env.js'

export type AuthVariables = JwtVariables

export const authMiddleware: MiddlewareHandler = jwt({
  secret: JWT_SECRET,
  alg: 'HS256',
})
