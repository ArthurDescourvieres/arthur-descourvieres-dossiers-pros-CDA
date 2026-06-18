import { useEffect, useState } from 'react'

/** Breakpoint en dessous duquel on bascule sur la navigation mobile (un volet à la fois). */
const MOBILE_QUERY = '(max-width: 768px)'

function readMatch(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(MOBILE_QUERY).matches
}

/** Vrai tant que la fenêtre est en dessous du breakpoint mobile. Se met à jour au resize. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(readMatch)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    // Synchronise au montage au cas où la fenêtre aurait changé avant l'abonnement.
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
