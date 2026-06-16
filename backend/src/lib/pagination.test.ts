import { describe, it, expect } from 'vitest'
import type { Context } from 'hono'
import { parsePagination, paginated, DEFAULT_LIMIT, MAX_LIMIT } from './pagination.js'

function ctx(query: Record<string, string | undefined>): Context {
  return { req: { query: (key: string) => query[key] } } as unknown as Context
}

describe('parsePagination', () => {
  it('defaults to limit=DEFAULT_LIMIT, offset=0 with no query params', () => {
    expect(parsePagination(ctx({}))).toEqual({ limit: DEFAULT_LIMIT, offset: 0 })
  })

  it('parses valid limit/offset', () => {
    expect(parsePagination(ctx({ limit: '10', offset: '20' }))).toEqual({ limit: 10, offset: 20 })
  })

  it('falls back to defaults on out-of-range or malformed values', () => {
    expect(parsePagination(ctx({ limit: '0' }))).toEqual({ limit: DEFAULT_LIMIT, offset: 0 })
    expect(parsePagination(ctx({ limit: String(MAX_LIMIT + 1) }))).toEqual({
      limit: DEFAULT_LIMIT,
      offset: 0,
    })
    expect(parsePagination(ctx({ offset: '-1' }))).toEqual({ limit: DEFAULT_LIMIT, offset: 0 })
    expect(parsePagination(ctx({ limit: 'abc' }))).toEqual({ limit: DEFAULT_LIMIT, offset: 0 })
  })
})

describe('paginated', () => {
  it('wraps items with the total count and the request window', () => {
    expect(paginated(['a', 'b'], 5, { limit: 2, offset: 0 })).toEqual({
      items: ['a', 'b'],
      total: 5,
      limit: 2,
      offset: 0,
    })
  })
})
