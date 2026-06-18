import { useEffect, useRef, type RefObject } from 'react'

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Pointer parallax. Writes `--px` / `--py` (range ~ -0.5..0.5) onto the
 * returned element so child layers can offset themselves with calc().
 * DOM is mutated directly (no re-render) and throttled with rAF.
 */
export function usePointerParallax<T extends HTMLElement>(): RefObject<T> {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) return
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        el.style.setProperty('--px', px.toFixed(3))
        el.style.setProperty('--py', py.toFixed(3))
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return ref
}

/**
 * Scroll parallax. Writes the scroll offset of the container into `--sy`
 * (unitless px) so descendants can drift at different speeds via calc().
 */
export function useScrollParallax<T extends HTMLElement>(): RefObject<T> {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        el.style.setProperty('--sy', String(el.scrollTop))
      })
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return ref
}

/**
 * Reveal-on-scroll. Adds `.is-visible` to every `[data-reveal]` descendant of
 * `rootRef` as it enters the viewport. Honours reduced-motion by revealing all
 * elements immediately.
 */
export function useRevealOnScroll(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (els.length === 0) return

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { root, rootMargin: '0px 0px -10% 0px', threshold: 0.15 },
    )

    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [rootRef])
}
