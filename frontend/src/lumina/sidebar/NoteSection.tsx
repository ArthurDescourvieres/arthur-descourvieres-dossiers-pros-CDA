import { useState } from 'react'
import { useCreateNote, useDeleteNote } from '../../hooks/useWorkspaces'
import {
  SectionHeader,
  sectionStyle,
  listStyle,
  listItemStyle,
  rowStyle,
  rowActionStyle,
  smallInputStyle,
  smallButtonStyle,
  loadingStyle,
  emptyStyle,
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
    <section style={sectionStyle}>
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
          style={{ display: 'flex', gap: 4 }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la note"
            style={smallInputStyle}
            autoFocus
          />
          <button type="submit" style={smallButtonStyle} disabled={create.isPending}>
            +
          </button>
        </form>
      )}
      {isLoading ? (
        <div style={loadingStyle}>…</div>
      ) : notes.length === 0 ? (
        <div style={emptyStyle}>Aucune note</div>
      ) : (
        <ul style={listStyle} aria-label="Notes">
          {notes.map((n) => (
            <li key={n.id} style={rowStyle}>
              <button
                type="button"
                onClick={() => onSelect(n.id)}
                aria-current={n.id === selectedId ? true : undefined}
                style={{
                  ...listItemStyle,
                  flex: 1,
                  width: 'auto',
                  background: n.id === selectedId ? 'var(--color-accent-soft)' : 'transparent',
                }}
              >
                {n.title || '(sans titre)'}
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onDelete(n.id, n.title)}
                  title="Supprimer la note"
                  style={rowActionStyle}
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
