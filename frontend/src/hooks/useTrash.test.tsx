import { renderHook, waitFor, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { setAccessToken } from '../lib/api'
import { useDeletedNotes, useRestoreNote } from './useTrash'

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

describe('useTrash hooks', () => {
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

  it('stays idle until the trash panel asks for the data (enabled=false)', () => {
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useDeletedNotes('w1', false), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('unwraps the paginated trash envelope once enabled', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [{ id: 'n1', title: 'Gone' }], total: 1 }))
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useDeletedNotes('w1', true), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchMock.mock.calls[0][0]).toBe('/api/workspaces/w1/trash')
    expect(result.current.data).toEqual([{ id: 'n1', title: 'Gone' }])
  })

  it('restores a note and invalidates both the trash and the note lists', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'n1', title: 'Back' }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useRestoreNote('w1'), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('n1')
    })

    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/notes/n1/restore')
    expect(init.method).toBe('PATCH')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['trash', 'w1'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['notes'] })
  })
})
