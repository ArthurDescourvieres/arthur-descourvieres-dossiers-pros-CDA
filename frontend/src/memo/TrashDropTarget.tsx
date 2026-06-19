import { useState } from 'react'
import type { DragEvent } from 'react'
import { TrashButton } from './TrashButton'
import { useTrashDrop } from '../hooks/useTrash'
import { getDragItem, hasDragItem } from './sidebar/dragItem'

/**
 * Bouton corbeille de la sidebar, doublé d'une zone de dépôt : on peut y glisser
 * un dossier ou une note depuis l'arbre. Le clic ouvre toujours la corbeille
 * (onOpen) ; un dépôt déclenche une confirmation puis la suppression. Note =
 * mise en corbeille (restaurable) ; dossier = suppression définitive avec son
 * contenu (la corbeille ne stocke que des notes).
 */
export function TrashDropTarget({
  workspaceId,
  onOpen,
  className,
}: {
  workspaceId: string
  onOpen: () => void
  className?: string
}) {
  const [over, setOver] = useState(false)
  const { deleteFolder, deleteNote } = useTrashDrop(workspaceId)

  const allowDrop = (e: DragEvent) => {
    if (!hasDragItem(e)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const onDrop = async (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const item = getDragItem(e)
    if (!item) return
    const label = item.name || 'sans titre'
    try {
      if (item.kind === 'folder') {
        if (
          !window.confirm(
            `Supprimer le dossier « ${label} » et tout son contenu ? Cette action est définitive.`,
          )
        )
          return
        await deleteFolder.mutateAsync(item.id)
      } else {
        if (!window.confirm(`Mettre la note « ${label} » à la corbeille ?`)) return
        await deleteNote.mutateAsync(item.id)
      }
    } catch {
      window.alert('La suppression a échoué.')
    }
  }

  return (
    <TrashButton
      onClick={onOpen}
      className={className}
      dropActive={over}
      onDragOver={allowDrop}
      onDragEnter={(e) => {
        if (hasDragItem(e)) setOver(true)
      }}
      onDragLeave={(e) => {
        // Ignore les passages sur les enfants (le SVG) : ne ferme que si le
        // curseur quitte réellement le bouton.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false)
      }}
      onDrop={onDrop}
    />
  )
}
