import { useSyncExternalStore } from 'react'
import {
  type Theme,
  applyTheme,
  getActiveTheme,
  getStoredTheme,
  getSystemTheme,
  setStoredTheme,
} from '../lib/theme'

// Store externe minimal : le thème vit sur <html>, on en garde un miroir
// réactif pour que le switch du ProfileMenu reste synchronisé. La valeur
// initiale est celle déjà posée sur <html> par le script anti-flash.
const listeners = new Set<() => void>()
let current: Theme = getActiveTheme()

function emit(): void {
  for (const listener of listeners) listener()
}

function set(theme: Theme, persist: boolean): void {
  if (persist) setStoredTheme(theme)
  if (theme === current) return
  current = theme
  applyTheme(theme, true)
  emit()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): Theme {
  return current
}

// Tant que l'utilisateur n'a rien tranché, on suit les changements de
// préférence système (ex. bascule clair/sombre automatique de l'OS).
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener?.('change', () => {
    if (getStoredTheme()) return // choix explicite : on n'écrase pas
    set(getSystemTheme(), false)
  })
}

export interface UseThemeResult {
  theme: Theme
  isDark: boolean
  toggle: () => void
  setTheme: (theme: Theme) => void
}

/** Donne le thème courant et de quoi le basculer (mémorise le choix). */
export function useTheme(): UseThemeResult {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    theme,
    isDark: theme === 'dark',
    toggle: () => set(current === 'dark' ? 'light' : 'dark', true),
    setTheme: (next: Theme) => set(next, true),
  }
}
