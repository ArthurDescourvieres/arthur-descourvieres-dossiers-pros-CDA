import { renderHook, waitFor, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ApiError, setAccessToken } from '../lib/api'
import { useWorkspaces, useCreateWorkspace, useFolders } from './useWorkspaces'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// A fresh QueryClient per test, with retries off so failures surface immediately
// instead of being retried behind the scenes.
function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
  return { qc, wrapper }
}

let fetchMock: ReturnType<typeof vi.fn>

describe('useWorkspaces hooks', () => {
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

  it('unwraps the paginated envelope into a plain array', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ items: [{ id: 'w1', name: 'A', role: 'OWNER' }], total: 1 }),
    )
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useWorkspaces(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([{ id: 'w1', name: 'A', role: 'OWNER' }])
  })

  it('does not fetch folders while no workspace is selected (enabled guard)', () => {
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useFolders(null), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('creates a workspace and invalidates the list cache', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'w2', name: 'New', role: 'OWNER' }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useCreateWorkspace(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ name: 'New' })
    })

    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/workspaces')
    expect(init.method).toBe('POST')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['workspaces'] })
  })

  it('surfaces an ApiError when the list request fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'BOOM' }, 500))
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useWorkspaces(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).status).toBe(500)
  })
})
