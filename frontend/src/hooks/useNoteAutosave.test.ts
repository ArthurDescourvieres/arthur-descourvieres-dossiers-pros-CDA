import { renderHook, act, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// useUpdateNote pulls in React Query; mock it so the hook is tested in isolation
// against a stable mutateAsync spy. vi.hoisted keeps the spy reachable from the
// hoisted vi.mock factory.
const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }))
vi.mock('./useWorkspaces', () => ({
  useUpdateNote: () => ({ mutateAsync }),
}))

import { useNoteAutosave } from './useNoteAutosave'

describe('useNoteAutosave', () => {
  beforeEach(() => {
    mutateAsync.mockReset()
    mutateAsync.mockResolvedValue(undefined)
    vi.useFakeTimers()
  })
  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('starts idle', () => {
    const { result } = renderHook(() => useNoteAutosave('n1'))
    expect(result.current.status).toBe('idle')
  })

  it('debounces a scheduled save then resolves to "saved"', async () => {
    const { result } = renderHook(() => useNoteAutosave('n1'))

    act(() => result.current.schedule({ title: 'Hello' }))
    expect(result.current.status).toBe('pending')
    expect(mutateAsync).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(mutateAsync).toHaveBeenCalledTimes(1)
    expect(mutateAsync).toHaveBeenCalledWith({ title: 'Hello' })
    expect(result.current.status).toBe('saved')
  })

  it('merges successive patches into a single payload', async () => {
    const { result } = renderHook(() => useNoteAutosave('n1'))

    act(() => result.current.schedule({ title: 'A' }))
    act(() => result.current.schedule({ content: { type: 'doc' } as never }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(mutateAsync).toHaveBeenCalledTimes(1)
    expect(mutateAsync).toHaveBeenCalledWith({ title: 'A', content: { type: 'doc' } })
  })

  it('flush() saves immediately without waiting for the debounce', async () => {
    const { result } = renderHook(() => useNoteAutosave('n1'))

    act(() => result.current.schedule({ title: 'Now' }))
    await act(async () => {
      await result.current.flush()
    })

    expect(mutateAsync).toHaveBeenCalledWith({ title: 'Now' })
    expect(result.current.status).toBe('saved')
  })

  it('reports "error" when the mutation rejects', async () => {
    mutateAsync.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useNoteAutosave('n1'))

    act(() => result.current.schedule({ title: 'X' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.status).toBe('error')
  })

  it('never saves when noteId is null', async () => {
    const { result } = renderHook(() => useNoteAutosave(null))

    act(() => result.current.schedule({ title: 'X' }))
    await act(async () => {
      await result.current.flush()
    })

    expect(mutateAsync).not.toHaveBeenCalled()
  })
})
