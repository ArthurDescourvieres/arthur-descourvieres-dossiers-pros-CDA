import { renderHook, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { setAccessToken } from '../lib/api'
import { useExportAccount, useDeleteAccount } from './useAccount'

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

describe('useAccount hooks (RGPD)', () => {
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

  it('downloads the account export as a json blob (right to portability)', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    fetchMock.mockResolvedValue(jsonResponse({ profile: { email: 'a@b.co' } }))
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useExportAccount(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/me/export')
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
    click.mockRestore()
  })

  it('deactivates the account via DELETE /api/me (right to erasure)', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useDeleteAccount(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync()
    })

    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/me')
    expect(init.method).toBe('DELETE')
  })
})
