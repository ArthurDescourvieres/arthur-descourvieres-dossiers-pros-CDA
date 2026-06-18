import { useState } from 'react'
import { useCreateNote, useDeleteNote } from '../../hooks/useWorkspaces'
import {
  SectionHeader,
  sectionClass,
  listClass,
  listItemClass,
  rowClass,
  rowActionClass,
  smallInputClass,
  smallButtonClass,
  loadingClass,
  emptyClass,
} from './common'

export function NoteSection({
  workspaceId,
  folderId,
  notes,
  selectedId,
  onSelect,
  isLoading,
  canEdit,
}: {
  workspaceId: string | null
  folderId: string
  notes: { id: string; title: string }[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  isLoading: boolean
  canEdit: boolean
}) {
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const create = useCreateNote(workspaceId, folderId)
  const del = useDeleteNote(workspaceId, folderId)

  const onDelete = async (id: string, label: string) => {
    if (!window.confirm(`Supprimer la note « ${label || 'sans titre'} » ?`)) return
    try {
      await del.mutateAsync(id)
      if (id === selectedId) onSelect(null)
    } catch {
      window.alert('La suppression a échoué.')
    }
  }

  return (
    <section className={sectionClass}>
      <SectionHeader title="Notes" onAdd={() => setCreating((v) => !v)} />
      {creating && (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!title.trim()) return
            const note = await create.mutateAsync({ title: title.trim() })
            onSelect(note.id)
            setTitle('')
            setCreating(false)
          }}
          className="flex gap-1"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la note"
            className={smallInputClass}
            autoFocus
          />
          <button type="submit" className={smallButtonClass} disabled={create.isPending}>
            +
          </button>
        </form>
      )}
      {isLoading ? (
        <div className={loadingClass}>…</div>
      ) : notes.length === 0 ? (
        <div className={emptyClass}>Aucune note</div>
      ) : (
        <ul className={listClass} aria-label="Notes">
          {notes.map((n) => (
            <li key={n.id} className={rowClass}>
              <button
                type="button"
                onClick={() => onSelect(n.id)}
                aria-current={n.id === selectedId ? true : undefined}
                className={`${listItemClass} w-auto flex-1 ${
                  n.id === selectedId ? 'bg-[var(--color-accent-soft)]' : 'bg-transparent'
                }`}
              >
                {n.title || '(sans titre)'}
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onDelete(n.id, n.title)}
                  title="Supprimer la note"
                  className={rowActionClass}
                  disabled={del.isPending}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
