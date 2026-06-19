import { useState } from 'react'
import type { DragEvent } from 'react'
import { TrashButton } from './TrashButton'
import { useTrashDrop } from '../hooks/useTrash'
import { getDragItem, hasDragItem } from './sidebar/dragItem'
import { useDialog } from './dialog/DialogProvider'

/**
 * Bouton corbeille de la sidebar, doublé d'une zone de dépôt : on peut y glisser
 * un dossier ou une note depuis l'arbre. Le clic ouvre toujours la corbeille
 * (onOpen) ; un dépôt met l'élément en corbeille sans confirmation. Tout est
 * restaurable : la note revient seule, le dossier emporte tout son sous-arbre
 * (sous-dossiers + notes) et le ramène à la restauration.
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
  const dialog = useDialog()
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
    try {
      // Note comme dossier partent en corbeille (soft-delete, restaurable) :
      // pas de confirmation. Le dossier emporte tout son sous-arbre.
      if (item.kind === 'folder') {
        await deleteFolder.mutateAsync(item.id)
      } else {
        await deleteNote.mutateAsync(item.id)
      }
    } catch {
      void dialog.alert({ message: 'La suppression a échoué.', variant: 'danger' })
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
