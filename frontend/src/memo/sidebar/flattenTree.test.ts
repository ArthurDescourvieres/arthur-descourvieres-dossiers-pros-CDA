import { describe, expect, it } from 'vitest'
import { buildFolderTree } from './buildFolderTree'
import { flattenTree, type FlatNote } from './flattenTree'
import type { Folder } from '../../lib/types'

const f = (id: string, parentId: string | null): Folder => ({
  id,
  name: id,
  workspaceId: 'w',
  parentId,
  deletedAt: null,
  createdAt: '',
  updatedAt: '',
})

const note = (id: string): FlatNote => ({ id, title: id })

describe('flattenTree', () => {
  const roots = buildFolderTree([f('a', null), f('b', 'a'), f('c', null)])

  it('n’expose que les racines quand rien n’est déplié', () => {
    const rows = flattenTree({
      roots,
      expanded: new Set(),
      notesByFolder: new Map(),
      pendingFolders: new Set(),
      creating: null,
    })
    expect(rows.map((r) => r.key)).toEqual(['f:a', 'f:c'])
  })

  it('insère sous-dossiers puis notes sous un dossier déplié', () => {
    const rows = flattenTree({
      roots,
      expanded: new Set(['a']),
      notesByFolder: new Map([['a', [note('n1'), note('n2')]]]),
      pendingFolders: new Set(),
      creating: null,
    })
    // a (ouvert) -> b (sous-dossier) -> n1, n2 (notes de a) -> c
    expect(rows.map((r) => r.key)).toEqual(['f:a', 'f:b', 'n:n1', 'n:n2', 'f:c'])
    expect(rows[1]).toMatchObject({ kind: 'folder', depth: 1 })
    expect(rows[2]).toMatchObject({ kind: 'note', depth: 1 })
  })

  it('insère la ligne de création juste sous le dossier ciblé', () => {
    const rows = flattenTree({
      roots,
      expanded: new Set(['a']),
      notesByFolder: new Map([['a', []]]),
      pendingFolders: new Set(),
      creating: { parentId: 'a', kind: 'note' },
    })
    expect(rows.map((r) => r.key)).toEqual(['f:a', 'c:a', 'f:b', 'f:c'])
  })

  it('affiche « … » tant que les notes chargent, « Vide » si dossier vraiment vide', () => {
    const pending = flattenTree({
      roots: buildFolderTree([f('a', null)]),
      expanded: new Set(['a']),
      notesByFolder: new Map(),
      pendingFolders: new Set(['a']),
      creating: null,
    })
    expect(pending.map((r) => r.key)).toEqual(['f:a', 'l:a'])

    const empty = flattenTree({
      roots: buildFolderTree([f('a', null)]),
      expanded: new Set(['a']),
      notesByFolder: new Map([['a', []]]),
      pendingFolders: new Set(),
      creating: null,
    })
    expect(empty.map((r) => r.key)).toEqual(['f:a', 'e:a'])
  })
})
