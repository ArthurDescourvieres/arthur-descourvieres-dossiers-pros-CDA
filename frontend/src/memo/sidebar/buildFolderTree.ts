import type { Folder } from '../../lib/types'

export type FolderTreeNode = {
  folder: Folder
  children: FolderTreeNode[]
}

/**
 * Construit l'arbre des dossiers à partir de la liste plate renvoyée par l'API
 * (chaque dossier porte son `parentId`). Les racines sont les dossiers sans
 * parent — ou dont le parent n'appartient pas au lot, traités comme racines par
 * sécurité. L'ordre d'origine (createdAt asc côté API) est préservé à chaque
 * niveau puisqu'on parcourt la liste dans l'ordre.
 */
export function buildFolderTree(folders: Folder[]): FolderTreeNode[] {
  const byId = new Map<string, FolderTreeNode>()
  for (const folder of folders) byId.set(folder.id, { folder, children: [] })

  const roots: FolderTreeNode[] = []
  for (const folder of folders) {
    const node = byId.get(folder.id)!
    const parent = folder.parentId ? byId.get(folder.parentId) : null
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

/**
 * Renvoie les ids des dossiers ancêtres d'un dossier cible, du plus proche à la
 * racine. Sert à déplier le chemin menant à une note trouvée par la recherche.
 * Protégé contre les cycles éventuels par un ensemble de visités.
 */
export function ancestorFolderIds(folders: Folder[], folderId: string | null): string[] {
  if (!folderId) return []
  const byId = new Map(folders.map((f) => [f.id, f]))
  const ids: string[] = []
  const visited = new Set<string>([folderId])
  let current = byId.get(folderId)
  while (current?.parentId && !visited.has(current.parentId)) {
    visited.add(current.parentId)
    ids.push(current.parentId)
    current = byId.get(current.parentId)
  }
  return ids
}
