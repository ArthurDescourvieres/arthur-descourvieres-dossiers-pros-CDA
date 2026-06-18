// Logique de thème clair/sombre — volontairement sans React pour rester testable
// isolément. L'infrastructure CSS vit dans memo/styles/tokens.css : `:root` porte
// le thème sombre (défaut) et `:root[data-theme='light']` l'override clair.

export type Theme = 'light' | 'dark'

/** Doit rester synchronisé avec le script anti-flash de index.html. */
export const THEME_STORAGE_KEY = 'memo-theme'

/** Préférence clair/sombre de l'OS ; retombe sur le sombre si indisponible. */
export function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Choix mémorisé par l'utilisateur, ou null s'il n'a jamais tranché. */
export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

/** Mémorise le choix explicite (ignore silencieusement si le stockage est bloqué). */
export function setStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* mode privé / quota : le thème reste appliqué en mémoire pour la session */
  }
}

/** Thème à appliquer au démarrage : choix mémorisé sinon préférence système. */
export function resolveInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

/** Thème actuellement appliqué sur <html> (posé par le script anti-flash). */
export function getActiveTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

/**
 * Applique le thème sur <html>. Avec `animate`, ajoute brièvement la classe
 * `theme-transition` (définie dans tokens.css) pour fondre les couleurs.
 */
export function applyTheme(theme: Theme, animate = false): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (animate) {
    root.classList.add('theme-transition')
    window.setTimeout(() => root.classList.remove('theme-transition'), 520)
  }
  root.dataset.theme = theme
}
