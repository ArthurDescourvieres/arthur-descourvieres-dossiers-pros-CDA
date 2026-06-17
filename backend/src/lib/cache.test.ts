import { describe, it, expect, vi, beforeEach } from 'vitest'

const { get, set, incr, del, mget } = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  incr: vi.fn(),
  del: vi.fn(),
  mget: vi.fn(),
}))

vi.mock('../lib/redis.js', () => ({ redis: { get, set, incr, del, mget } }))

import { cachedJson, invalidateWorkspaceCache, workspaceCacheKey, cacheStats } from './cache.js'

beforeEach(() => {
  get.mockReset()
  set.mockReset()
  incr.mockReset()
  del.mockReset()
  mget.mockReset()
})

describe('cachedJson', () => {
  it('returns the cached JSON and counts a hit when the key is present', async () => {
    get.mockResolvedValue('{"a":1}')
    const produce = vi.fn()

    const result = await cachedJson('k', 60, produce)

    expect(result).toEqual({ json: '{"a":1}', hit: true })
    expect(produce).not.toHaveBeenCalled()
    expect(incr).toHaveBeenCalledWith('cache:hits')
    expect(set).not.toHaveBeenCalled()
  })

  it('produces, stores with TTL and counts a miss when the key is absent', async () => {
    get.mockResolvedValue(null)
    const produce = vi.fn(async () => ({ a: 1 }))

    const result = await cachedJson('k', 60, produce)

    expect(produce).toHaveBeenCalledOnce()
    expect(set).toHaveBeenCalledWith('k', '{"a":1}', 'EX', 60)
    expect(incr).toHaveBeenCalledWith('cache:misses')
    expect(result).toEqual({ json: '{"a":1}', hit: false })
  })

  it('never caches when the producer throws (e.g. a 404 stays fresh)', async () => {
    get.mockResolvedValue(null)

    await expect(
      cachedJson('k', 60, async () => {
        throw new Error('not found')
      }),
    ).rejects.toThrow('not found')

    expect(set).not.toHaveBeenCalled()
    expect(incr).not.toHaveBeenCalled()
  })
})

describe('invalidateWorkspaceCache', () => {
  it('deletes the cache:workspace:<id> key', async () => {
    await invalidateWorkspaceCache('ws1')
    expect(workspaceCacheKey('ws1')).toBe('cache:workspace:ws1')
    expect(del).toHaveBeenCalledWith('cache:workspace:ws1')
  })
})

describe('cacheStats', () => {
  it('computes the hit ratio from the counters', async () => {
    mget.mockResolvedValue(['3', '1'])
    expect(await cacheStats()).toEqual({ hits: 3, misses: 1, ratio: 0.75 })
  })

  it('returns ratio 0 when nothing has been recorded', async () => {
    mget.mockResolvedValue([null, null])
    expect(await cacheStats()).toEqual({ hits: 0, misses: 0, ratio: 0 })
  })
})
