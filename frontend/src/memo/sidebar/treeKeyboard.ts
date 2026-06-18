import type { FlatRow } from './flattenTree'

export type TreeKeyAction =
  | { type: 'move'; index: number }
  | { type: 'toggle'; id: string; open: boolean }
  | { type: 'activate'; index: number }

// Seules les lignes dossier/note sont des treeitems navigables ; les lignes
// « create » et « placeholder » sont sautées par les flèches.
const navigable = (r: FlatRow) => r.kind === 'folder' || r.kind === 'note'

function scan(rows: FlatRow[], from: number, dir: 1 | -1): number {
  let i = from + dir
  while (i >= 0 && i < rows.length && !navigable(rows[i])) i += dir
  return i >= 0 && i < rows.length ? i : from
}

/**
 * Résout une touche du pattern WAI-ARIA « tree » en action pure (déplacement
 * d'index / pli-dépli / activation), sans toucher au DOM ni au state. Le
 * composant applique ensuite l'action (scroll + focus de la ligne, toggle…).
 * Découpler ainsi rend la logique testable et compatible avec la virtualisation
 * (les lignes hors écran n'existent pas dans le DOM).
 */
export function resolveTreeKey(
  key: string,
  rows: FlatRow[],
  activeIndex: number,
): TreeKeyAction | null {
  if (rows.length === 0) return null
  const i = Math.min(Math.max(activeIndex, 0), rows.length - 1)
  const row = rows[i]

  switch (key) {
    case 'ArrowDown':
      return { type: 'move', index: scan(rows, i, 1) }
    case 'ArrowUp':
      return { type: 'move', index: scan(rows, i, -1) }
    case 'Home':
      return { type: 'move', index: scan(rows, -1, 1) }
    case 'End':
      return { type: 'move', index: scan(rows, rows.length, -1) }
    case 'ArrowRight':
      if (row.kind !== 'folder') return null
      if (!row.isOpen) return { type: 'toggle', id: row.id, open: true }
      return { type: 'move', index: scan(rows, i, 1) }
    case 'ArrowLeft':
      if (row.kind === 'folder' && row.isOpen) return { type: 'toggle', id: row.id, open: false }
      if (row.kind === 'folder' || row.kind === 'note') {
        if (row.parentId) {
          const p = rows.findIndex((r) => r.kind === 'folder' && r.id === row.parentId)
          if (p >= 0) return { type: 'move', index: p }
        }
      }
      return null
    case 'Enter':
    case ' ':
      return navigable(row) ? { type: 'activate', index: i } : null
    default:
      return null
  }
}
