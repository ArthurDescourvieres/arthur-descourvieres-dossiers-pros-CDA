/**
 * Offset/limit pagination for list endpoints (§ perf).
 *
 * Lists that can grow without bound (a folder's notes, a user's workspaces, the
 * trash) return a `{ items, total, limit, offset }` envelope instead of a bare
 * array, so a client never pulls the whole table in one request. Bounded-by-
 * design lists (the folder tree, a workspace's members) keep their shape but
 * carry a hard server-side cap.
 */
import { z } from 'zod'
import type { Context } from 'hono'

export const DEFAULT_LIMIT = 50
export const MAX_LIMIT = 100

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
})

export type Pagination = z.infer<typeof paginationQuerySchema>

export type Paginated<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}

/**
 * Parse `?limit` / `?offset`, clamped to safe bounds. An out-of-range or
 * malformed query falls back to the defaults rather than returning 400, so a
 * bad query parameter can never break a list endpoint.
 */
export function parsePagination(c: Context): Pagination {
  const parsed = paginationQuerySchema.safeParse({
    limit: c.req.query('limit'),
    offset: c.req.query('offset'),
  })
  return parsed.success ? parsed.data : { limit: DEFAULT_LIMIT, offset: 0 }
}

export function paginated<T>(items: T[], total: number, p: Pagination): Paginated<T> {
  return { items, total, limit: p.limit, offset: p.offset }
}
