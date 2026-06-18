import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  THEME_STORAGE_KEY,
  applyTheme,
  getActiveTheme,
  getStoredTheme,
  getSystemTheme,
  resolveInitialTheme,
  setStoredTheme,
} from './theme'

// jsdom ne fournit pas matchMedia : on installe un stub contrôlable.
function stubMatchMedia(prefersDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: prefersDark,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  )
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persiste et relit un choix valide', () => {
    setStoredTheme('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(getStoredTheme()).toBe('light')
  })

  it('ignore une valeur stockée invalide', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'banana')
    expect(getStoredTheme()).toBeNull()
  })

  it('lit la préférence système via matchMedia', () => {
    stubMatchMedia(true)
    expect(getSystemTheme()).toBe('dark')
    stubMatchMedia(false)
    expect(getSystemTheme()).toBe('light')
  })

  it('retombe sur le sombre quand matchMedia est indisponible', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(getSystemTheme()).toBe('dark')
  })

  it('résout le choix mémorisé en priorité sur le système', () => {
    stubMatchMedia(false) // système clair
    setStoredTheme('dark')
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('résout la préférence système sans choix mémorisé', () => {
    stubMatchMedia(false)
    expect(resolveInitialTheme()).toBe('light')
  })

  it('applique le thème sur <html> et le relit', () => {
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(getActiveTheme()).toBe('light')

    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(getActiveTheme()).toBe('dark')
  })
})
