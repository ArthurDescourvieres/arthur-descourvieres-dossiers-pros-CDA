import { describe, expect, it } from 'vitest'
import { ancestorFolderIds, buildFolderTree } from './buildFolderTree'
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

describe('buildFolderTree', () => {
  it('imbrique les enfants sous leur parent et conserve les racines dans l’ordre', () => {
    const tree = buildFolderTree([f('a', null), f('b', 'a'), f('c', null), f('d', 'b')])
    expect(tree.map((n) => n.folder.id)).toEqual(['a', 'c'])
    expect(tree[0].children.map((n) => n.folder.id)).toEqual(['b'])
    expect(tree[0].children[0].children.map((n) => n.folder.id)).toEqual(['d'])
  })

  it('traite un orphelin (parent absent du lot) comme une racine', () => {
    const tree = buildFolderTree([f('x', 'ghost')])
    expect(tree.map((n) => n.folder.id)).toEqual(['x'])
  })
})

describe('ancestorFolderIds', () => {
  it('liste les ancêtres du plus proche à la racine', () => {
    const folders = [f('a', null), f('b', 'a'), f('d', 'b')]
    expect(ancestorFolderIds(folders, 'd')).toEqual(['b', 'a'])
  })

  it('renvoie un tableau vide sans cible', () => {
    expect(ancestorFolderIds([f('a', null)], null)).toEqual([])
  })

  it('ne boucle pas sur des données cycliques', () => {
    const folders = [f('a', 'b'), f('b', 'a')]
    expect(ancestorFolderIds(folders, 'a')).toEqual(['b'])
  })
})
