import { jwt } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'
import type { MiddlewareHandler } from 'hono'

export type AuthVariables = JwtVariables

export const authMiddleware: MiddlewareHandler = jwt({
  secret: process.env.JWT_SECRET ?? 'secret',
})
