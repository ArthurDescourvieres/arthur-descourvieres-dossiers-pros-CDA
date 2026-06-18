import { useState, type CSSProperties } from 'react'
import { useDeletedNotes, useRestoreNote } from '../hooks/useTrash'

// Collapsible trash panel (EDITOR+). Lists soft-deleted notes of the workspace
// and restores them. Fetches only once opened.
export function TrashSection({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false)
  const trash = useDeletedNotes(workspaceId, open)
  const restore = useRestoreNote(workspaceId)
  const notes = trash.data ?? []

  const onRestore = async (id: string) => {
    try {
      await restore.mutateAsync(id)
    } catch {
      window.alert('La restauration a échoué.')
    }
  }

  return (
    <section style={sectionStyle}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={headerButtonStyle}>
        <span style={headerLabelStyle}>Corbeille</span>
        <span style={chevronStyle}>{open ? '▾' : '▸'}</span>
      </button>

      {open &&
        (trash.isPending ? (
          <div style={loadingStyle}>…</div>
        ) : notes.length === 0 ? (
          <div style={emptyStyle}>Corbeille vide</div>
        ) : (
          <ul style={listStyle}>
            {notes.map((n) => {
              const busy = restore.isPending && restore.variables === n.id
              return (
                <li key={n.id} style={rowStyle}>
                  <span style={titleStyle}>{n.title || '(sans titre)'}</span>
                  <button
                    type="button"
                    onClick={() => onRestore(n.id)}
                    disabled={busy}
                    title="Restaurer la note"
                    style={restoreButtonStyle}
                  >
                    Restaurer
                  </button>
                </li>
              )
            })}
          </ul>
        ))}
    </section>
  )
}

const sectionStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const headerButtonStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  padding: 0,
}
const headerLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1,
  opacity: 0.5,
}
const chevronStyle: CSSProperties = { fontSize: 10, opacity: 0.5 }
const listStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}
const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
  padding: '4px 6px',
  borderRadius: 4,
}
const titleStyle: CSSProperties = {
  fontSize: 12.5,
  opacity: 0.7,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}
const restoreButtonStyle: CSSProperties = {
  background: 'var(--color-accent-soft)',
  border: '1px solid var(--color-accent-border)',
  color: 'inherit',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 11,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}
const loadingStyle: CSSProperties = { opacity: 0.4, fontSize: 12 }
const emptyStyle: CSSProperties = { opacity: 0.4, fontSize: 12, padding: '2px 6px' }
