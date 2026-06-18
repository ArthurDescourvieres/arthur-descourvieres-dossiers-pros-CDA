import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { setAccessToken } from '../lib/api'
import { useDebouncedValue, useSearch } from './useSearch'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
  return { qc, wrapper }
}

describe('useDebouncedValue', () => {
  afterEach(cleanup)

  it('keeps the previous value until the delay elapses, then updates', async () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 50), {
      initialProps: { v: 'a' },
    })
    expect(result.current).toBe('a')

    rerender({ v: 'b' })
    expect(result.current).toBe('a')

    await waitFor(() => expect(result.current).toBe('b'))
  })
})

describe('useSearch', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setAccessToken('tok')
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    setAccessToken(null)
  })

  it('stays disabled while the query is empty', () => {
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useSearch('w1', '   '), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('queries the workspace search endpoint with the encoded term after debounce', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ query: 'a b', hits: [] }))
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useSearch('w1', 'a b'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 2000 })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/workspaces/w1/search?q=a%20b')
  })
})
