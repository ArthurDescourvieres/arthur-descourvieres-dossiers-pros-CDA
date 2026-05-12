import type { Context } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { searchService } from '../services/search.service.js'

type C = Context<AppEnv>

export const searchController = {
  async byWorkspace(c: C) {
    const workspaceId = c.req.param('workspaceId')!
    const q = c.req.query('q') ?? ''
    const hits = await searchService.searchInWorkspace(workspaceId, q)
    return c.json({ query: q, hits }, 200)
  },
}
