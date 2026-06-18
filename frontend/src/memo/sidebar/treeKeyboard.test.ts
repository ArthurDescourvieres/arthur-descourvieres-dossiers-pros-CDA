import { describe, expect, it } from 'vitest'
import { resolveTreeKey } from './treeKeyboard'
import type { FlatRow } from './flattenTree'

// a (ouvert)
//   create:a
//   b (note de a, depth 1)
// c (fermé, depth 0)
const rows: FlatRow[] = [
  {
    kind: 'folder',
    key: 'f:a',
    id: 'a',
    folder: {} as never,
    depth: 0,
    parentId: null,
    isOpen: true,
  },
  { kind: 'create', key: 'c:a', parentId: 'a', createKind: 'note', depth: 1 },
  { kind: 'note', key: 'n:b', id: 'b', note: { id: 'b', title: 'b' }, depth: 1, parentId: 'a' },
  {
    kind: 'folder',
    key: 'f:c',
    id: 'c',
    folder: {} as never,
    depth: 0,
    parentId: null,
    isOpen: false,
  },
]

describe('resolveTreeKey', () => {
  it('saute les lignes non navigables (create) avec les flèches', () => {
    // depuis le dossier a (index 0), ArrowDown doit atterrir sur la note b (index 2)
    expect(resolveTreeKey('ArrowDown', rows, 0)).toEqual({ type: 'move', index: 2 })
  })

  it('ArrowLeft sur une note remonte au dossier parent', () => {
    expect(resolveTreeKey('ArrowLeft', rows, 2)).toEqual({ type: 'move', index: 0 })
  })

  it('ArrowRight ouvre un dossier fermé', () => {
    expect(resolveTreeKey('ArrowRight', rows, 3)).toEqual({ type: 'toggle', id: 'c', open: true })
  })

  it('ArrowLeft ferme un dossier ouvert', () => {
    expect(resolveTreeKey('ArrowLeft', rows, 0)).toEqual({ type: 'toggle', id: 'a', open: false })
  })

  it('Home / End vont au premier / dernier élément navigable', () => {
    expect(resolveTreeKey('Home', rows, 3)).toEqual({ type: 'move', index: 0 })
    expect(resolveTreeKey('End', rows, 0)).toEqual({ type: 'move', index: 3 })
  })

  it('Entrée active la ligne courante', () => {
    expect(resolveTreeKey('Enter', rows, 2)).toEqual({ type: 'activate', index: 2 })
  })
})
