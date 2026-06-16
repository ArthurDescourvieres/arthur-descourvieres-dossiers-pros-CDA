/**
 * Read-through Redis cache (§ perf — observabilité).
 *
 * Used for the hot, read-heavy `GET /api/workspaces/:id` endpoint. Values are
 * stored as JSON under `cache:workspace:<id>` with a short TTL, and explicitly
 * invalidated on every write to the workspace or its membership so a stale read
 * never outlives a change by more than one request. Global hit/miss counters
 * back the cache-effectiveness metric reported in the dossier.
 */
import { redis } from './redis.js'

export const WORKSPACE_CACHE_TTL = 60 // seconds

const HIT_KEY = 'cache:hits'
const MISS_KEY = 'cache:misses'

export function workspaceCacheKey(id: string): string {
  return `cache:workspace:${id}`
}

export type CachedResult = { json: string; hit: boolean }

/**
 * Returns the cached JSON for `key` when present (and counts a hit), otherwise
 * runs `produce`, stores its JSON for `ttlSeconds` and counts a miss. Errors
 * thrown by `produce` propagate and are never cached (e.g. a 404 stays fresh).
 */
export async function cachedJson(
  key: string,
  ttlSeconds: number,
  produce: () => Promise<unknown>,
): Promise<CachedResult> {
  const cached = await redis.get(key)
  if (cached !== null) {
    await redis.incr(HIT_KEY)
    return { json: cached, hit: true }
  }

  const value = await produce()
  const json = JSON.stringify(value)
  await redis.set(key, json, 'EX', ttlSeconds)
  await redis.incr(MISS_KEY)
  return { json, hit: false }
}

export async function invalidate(key: string): Promise<void> {
  await redis.del(key)
}

export async function invalidateWorkspaceCache(workspaceId: string): Promise<void> {
  await invalidate(workspaceCacheKey(workspaceId))
}

/** Hit/miss totals since the Redis instance last started. */
export async function cacheStats(): Promise<{ hits: number; misses: number; ratio: number }> {
  const [hits, misses] = await redis.mget(HIT_KEY, MISS_KEY)
  const h = Number(hits ?? 0)
  const m = Number(misses ?? 0)
  const total = h + m
  return { hits: h, misses: m, ratio: total === 0 ? 0 : h / total }
}
