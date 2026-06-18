import { renderHook, waitFor, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ApiError, setAccessToken } from '../lib/api'
import { useWorkspaceDetail, useUpdateMemberRole, useRemoveMember } from './useMembers'

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

let fetchMock: ReturnType<typeof vi.fn>

describe('useMembers hooks', () => {
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

  it('does not fetch workspace detail until a workspace is selected', () => {
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useWorkspaceDetail(null), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('loads the workspace detail with its members', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 'w1', members: [{ userId: 'u1', role: 'OWNER' }] }),
    )
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useWorkspaceDetail('w1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchMock.mock.calls[0][0]).toBe('/api/workspaces/w1')
  })

  it("changes a member's role and invalidates the workspace detail", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ userId: 'u2', role: 'EDITOR' }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateMemberRole('w1'), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ userId: 'u2', role: 'EDITOR' })
    })

    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/workspaces/w1/members/u2')
    expect(init.method).toBe('PATCH')
    expect(init.body).toBe(JSON.stringify({ role: 'EDITOR' }))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['workspace', 'w1'] })
  })

  it('removes a member and invalidates the workspace detail', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useRemoveMember('w1'), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('u2')
    })

    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/workspaces/w1/members/u2')
    expect(init.method).toBe('DELETE')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['workspace', 'w1'] })
  })

  it('rejects with a 403 ApiError when a non-owner changes a role', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'FORBIDDEN' }, 403))
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useUpdateMemberRole('w1'), { wrapper })
    const err = await result.current.mutateAsync({ userId: 'u2', role: 'VIEWER' }).catch((e) => e)

    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(403)
  })
})
