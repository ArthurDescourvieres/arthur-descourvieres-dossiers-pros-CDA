import type { NavNode } from './types'

export const initialNavTree: NavNode[] = [
  { id: null, label: 'Inbox', icon: 'inbox', mapId: 'inbox' },
  { id: null, label: 'Today', icon: 'sun', badge: '3' },
  {
    id: 'private',
    label: 'Private',
    icon: 'folder-lock',
    expanded: true,
    children: [
      {
        id: 'field',
        label: 'Field notebook',
        icon: 'notebook-pen',
        expanded: true,
        starred: true,
        children: [
          {
            id: null,
            label: 'Atlas of the Longer Night',
            icon: 'moon',
            mapId: 'atlas',
            starred: true,
          },
          { id: null, label: 'On tide-clocks', icon: 'waves', mapId: 'tidecl' },
          {
            id: null,
            label: 'Letters to no one',
            icon: 'mail',
            mapId: 'letters',
          },
        ],
      },
      {
        id: null,
        label: 'A small garden of verbs',
        icon: 'leaf',
        mapId: 'garden',
      },
      {
        id: null,
        label: 'Index — things I keep losing',
        icon: 'book-marked',
        mapId: 'index',
      },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    icon: 'briefcase',
    expanded: false,
    children: [
      {
        id: null,
        label: 'Manuscript — Book Two',
        icon: 'book-open',
        mapId: 'manuscript',
        starred: true,
      },
    ],
  },
  { id: null, label: 'Archive', icon: 'archive' },
  { id: null, label: 'Trash', icon: 'trash-2' },
]

let _uidSeq = 1
export function ensureUids(list: NavNode[]): void {
  list.forEach((n) => {
    if (!n.uid) n.uid = 'n' + _uidSeq++
    if (Array.isArray(n.children)) ensureUids(n.children)
  })
}

export function findNodeByUid(
  list: NavNode[],
  uid: string,
): { node: NavNode; parent: NavNode[]; index: number } | null {
  for (const n of list) {
    if (n.uid === uid) return { node: n, parent: list, index: list.indexOf(n) }
    if (Array.isArray(n.children)) {
      const r = findNodeByUid(n.children, uid)
      if (r) return r
    }
  }
  return null
}

export function removeNodeByUid(list: NavNode[], uid: string): NavNode | null {
  const r = findNodeByUid(list, uid)
  if (r) r.parent.splice(r.index, 1)
  return r ? r.node : null
}

export function isDescendant(ancestor: NavNode, uid: string): boolean {
  if (ancestor.uid === uid) return true
  if (!Array.isArray(ancestor.children)) return false
  return ancestor.children.some((c) => isDescendant(c, uid))
}

export function clearUids(n: NavNode): void {
  delete n.uid
  if (Array.isArray(n.children)) n.children.forEach(clearUids)
}
