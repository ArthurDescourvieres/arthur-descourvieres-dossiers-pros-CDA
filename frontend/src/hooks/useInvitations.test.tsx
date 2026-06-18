import { renderHook, waitFor, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ApiError, setAccessToken } from '../lib/api'
import { useInvitations, useCreateInvitation, useAcceptInvitation } from './useInvitations'

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

describe('useInvitations hooks', () => {
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

  it('does not fetch pending invitations until a workspace is selected', () => {
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useInvitations(null), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lists pending invitations for the selected workspace', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 'i1', email: 'a@b.co', role: 'EDITOR' }]))
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useInvitations('w1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchMock.mock.calls[0][0]).toBe('/api/workspaces/w1/invitations')
    expect(result.current.data).toEqual([{ id: 'i1', email: 'a@b.co', role: 'EDITOR' }])
  })

  it('creates an invitation and invalidates the invitation list', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'i2', email: 'c@d.co', role: 'VIEWER' }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useCreateInvitation('w1'), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ email: 'c@d.co', role: 'VIEWER' })
    })

    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/workspaces/w1/invitations')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ email: 'c@d.co', role: 'VIEWER' }))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['invitations', 'w1'] })
  })

  it('refreshes the workspace list after an invite is accepted', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ workspaceId: 'w9', role: 'EDITOR' }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useAcceptInvitation(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('token-123')
    })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/invitations/token-123/accept')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['workspaces'] })
  })

  it('rejects with a 403 ApiError when a non-owner tries to invite', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'FORBIDDEN' }, 403))
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useCreateInvitation('w1'), { wrapper })
    const err = await result.current
      .mutateAsync({ email: 'x@y.co', role: 'EDITOR' })
      .catch((e) => e)

    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(403)
  })
})
