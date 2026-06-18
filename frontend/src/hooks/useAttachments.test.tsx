import { renderHook, waitFor, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { setAccessToken } from '../lib/api'
import {
  useNoteAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  attachmentFileUrl,
} from './useAttachments'

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

describe('attachmentFileUrl', () => {
  it('builds the file route from an attachment id', () => {
    expect(attachmentFileUrl('a1')).toBe('/api/attachments/a1/file')
  })
})

describe('useAttachments hooks', () => {
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

  it('does not fetch attachments until a note is open', () => {
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useNoteAttachments(null), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lists the attachments of a note', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 'a1', filename: 'p.png' }]))
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useNoteAttachments('n1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchMock.mock.calls[0][0]).toBe('/api/notes/n1/attachments')
  })

  it('uploads a file as multipart form-data and invalidates the list', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'a2', filename: 'doc.pdf' }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useUploadAttachment('n1'), { wrapper })
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' })
    await act(async () => {
      await result.current.mutateAsync(file)
    })

    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/notes/n1/attachments')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
    expect((init.body as FormData).get('file')).toBe(file)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['attachments', 'n1'] })
  })

  it('deletes an attachment and invalidates the list', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { qc, wrapper } = makeWrapper()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteAttachment('n1'), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('a1')
    })

    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/attachments/a1')
    expect(init.method).toBe('DELETE')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['attachments', 'n1'] })
  })
})
