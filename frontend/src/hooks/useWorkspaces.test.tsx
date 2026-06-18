import { renderHook, waitFor, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ApiError, setAccessToken } from '../lib/api'
import {
  useWorkspaces,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
  useFolders,
  useCreateFolder,
  useDeleteFolder,
  useNotesInFolder,
  useCreateNote,
  useNote,
  useUpdateNote,
  useDeleteNote,
} from './useWorkspaces'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// A fresh QueryClient per test, retries off so failures surface immediately.
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

  it('unwraps the paginated workspace envelope into a plain array', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ items: [{ id: 'w1', name: 'A', role: 'OWNER' }], total: 1 }),
    )
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useWorkspaces(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([{ id: 'w1', name: 'A', role: 'OWNER' }])
  })

  it('surfaces an ApiError when the workspace list request fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'BOOM' }, 500))
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useWorkspaces(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).status).toBe(500)
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

  it('renames a workspace via PATCH and invalidates the list', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'w1', name: 'Renamed' }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateWorkspace(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ id: 'w1', name: 'Renamed' })
    })

    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/workspaces/w1')
    expect(init.method).toBe('PATCH')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['workspaces'] })
  })

  it('deletes a workspace via DELETE and invalidates the list', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteWorkspace(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('w1')
    })

    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/workspaces/w1')
    expect(init.method).toBe('DELETE')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['workspaces'] })
  })

  it('does not fetch folders while no workspace is selected (enabled guard)', () => {
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useFolders(null), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lists folders of the selected workspace', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 'f1', name: 'Docs' }]))
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useFolders('w1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchMock.mock.calls[0][0]).toBe('/api/workspaces/w1/folders')
    expect(result.current.data).toEqual([{ id: 'f1', name: 'Docs' }])
  })

  it('creates a folder and invalidates the folder tree', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'f2', name: 'Sub' }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useCreateFolder('w1'), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ name: 'Sub', parentId: 'f1' })
    })

    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/workspaces/w1/folders')
    expect(init.body).toBe(JSON.stringify({ name: 'Sub', parentId: 'f1' }))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['folders', 'w1'] })
  })

  it('deletes a folder and invalidates the folder tree', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteFolder('w1'), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('f1')
    })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/workspaces/w1/folders/f1')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['folders', 'w1'] })
  })

  it('requires both workspace and folder ids before fetching notes', () => {
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useNotesInFolder('w1', null), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('unwraps the paginated note envelope for a folder', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [{ id: 'n1', title: 'Note' }], total: 1 }))
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useNotesInFolder('w1', 'f1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchMock.mock.calls[0][0]).toBe('/api/workspaces/w1/folders/f1/notes')
    expect(result.current.data).toEqual([{ id: 'n1', title: 'Note' }])
  })

  it('creates a note carrying its folderId in the payload', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'n2', title: 'New' }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useCreateNote('w1', 'f1'), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ title: 'New' })
    })

    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/workspaces/w1/folders/f1/notes')
    expect(init.body).toBe(JSON.stringify({ title: 'New', folderId: 'f1' }))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['notes', 'w1', 'f1'] })
  })

  it('reads a single note by id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'n1', title: 'Note' }))
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useNote('n1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchMock.mock.calls[0][0]).toBe('/api/notes/n1')
  })

  it('updates a note, primes its cache and invalidates note lists', async () => {
    const updated = { id: 'n1', title: 'Edited' }
    fetchMock.mockResolvedValue(jsonResponse(updated))
    const { qc, wrapper } = makeWrapper()
    const setData = vi.spyOn(qc, 'setQueryData')
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateNote('n1'), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ title: 'Edited' })
    })

    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/notes/n1')
    expect(init.method).toBe('PATCH')
    expect(setData).toHaveBeenCalledWith(['note', 'n1'], updated)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['notes'] })
  })

  it('deletes a note and invalidates both the folder list and the trash', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteNote('w1', 'f1'), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('n1')
    })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/notes/n1')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['notes', 'w1', 'f1'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['trash', 'w1'] })
  })
})
