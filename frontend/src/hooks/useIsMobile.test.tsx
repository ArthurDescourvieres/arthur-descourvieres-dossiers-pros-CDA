import { renderHook, act, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { useIsMobile } from './useIsMobile'

type ChangeListener = (e: { matches: boolean }) => void

// jsdom ships no matchMedia, so we install a controllable stub and expose an
// emit() to simulate the viewport crossing the breakpoint.
function stubMatchMedia(initial: boolean) {
  const listeners = new Set<ChangeListener>()
  const mql = {
    matches: initial,
    media: '(max-width: 768px)',
    addEventListener: (_type: string, cb: ChangeListener) => listeners.add(cb),
    removeEventListener: (_type: string, cb: ChangeListener) => listeners.delete(cb),
  }
  function emit(matches: boolean) {
    mql.matches = matches
    listeners.forEach((cb) => cb({ matches }))
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql as unknown as MediaQueryList),
  )
  return { emit }
}

describe('useIsMobile', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('reports mobile when the media query matches at mount', () => {
    stubMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('reports desktop when the media query does not match', () => {
    stubMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('updates when the viewport crosses the breakpoint', () => {
    const { emit } = stubMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => emit(true))
    expect(result.current).toBe(true)
  })

  it('falls back to desktop when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })
})
