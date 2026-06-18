import { useState } from 'react'
import {
  useCreateWorkspace,
  useDeleteWorkspace,
  useUpdateWorkspace,
} from '../../hooks/useWorkspaces'
import type { WorkspaceRole } from '../../lib/types'
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
} from './common'

export function WorkspaceSection({
  workspaces,
  selectedId,
  onSelect,
  isLoading,
}: {
  workspaces: { id: string; name: string; role: WorkspaceRole }[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  isLoading: boolean
}) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const create = useCreateWorkspace()
  const update = useUpdateWorkspace()
  const del = useDeleteWorkspace()

  const startEdit = (id: string, current: string) => {
    setEditingId(id)
    setEditName(current)
  }

  const commitEdit = async () => {
    if (!editingId) return
    const id = editingId
    const value = editName.trim()
    setEditingId(null)
    if (!value) return
    try {
      await update.mutateAsync({ id, name: value })
    } catch {
      window.alert('Le renommage a échoué.')
    }
  }

  const onDelete = async (id: string, label: string) => {
    if (
      !window.confirm(
        `Supprimer le workspace « ${label} » ? Tout son contenu (dossiers, notes, pièces jointes) sera définitivement perdu.`,
      )
    )
      return
    try {
      await del.mutateAsync(id)
      if (id === selectedId) onSelect(null)
    } catch {
      window.alert('La suppression a échoué.')
    }
  }

  return (
    <section style={sectionStyle}>
      <SectionHeader title="Workspaces" onAdd={() => setCreating((v) => !v)} />
      {creating && (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!name.trim()) return
            const ws = await create.mutateAsync({ name: name.trim() })
            onSelect(ws.id)
            setName('')
            setCreating(false)
          }}
          style={{ display: 'flex', gap: 4 }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du workspace"
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
      ) : (
        <ul style={listStyle} aria-label="Workspaces">
          {workspaces.map((ws) => (
            <li key={ws.id} style={rowStyle}>
              {editingId === ws.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void commitEdit()
                  }}
                  style={{ display: 'flex', flex: 1 }}
                >
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => void commitEdit()}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    style={smallInputStyle}
                    autoFocus
                  />
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSelect(ws.id)}
                    aria-current={ws.id === selectedId ? true : undefined}
                    style={{
                      ...listItemStyle,
                      flex: 1,
                      width: 'auto',
                      background: ws.id === selectedId ? 'var(--color-accent-soft)' : 'transparent',
                    }}
                  >
                    {ws.name}
                  </button>
                  {ws.role === 'OWNER' && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(ws.id, ws.name)}
                        title="Renommer le workspace"
                        style={rowActionStyle}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(ws.id, ws.name)}
                        title="Supprimer le workspace"
                        style={rowActionStyle}
                        disabled={del.isPending}
                      >
                        ×
                      </button>
                    </>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
