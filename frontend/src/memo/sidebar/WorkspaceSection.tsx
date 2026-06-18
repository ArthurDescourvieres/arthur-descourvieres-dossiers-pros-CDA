import { useState } from 'react'
import {
  useCreateWorkspace,
  useDeleteWorkspace,
  useUpdateWorkspace,
} from '../../hooks/useWorkspaces'
import type { WorkspaceRole } from '../../lib/types'
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
    <section className={sectionClass}>
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
          className="flex gap-1"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du workspace"
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
      ) : (
        <ul className={listClass} aria-label="Workspaces">
          {workspaces.map((ws) => (
            <li key={ws.id} className={rowClass}>
              {editingId === ws.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void commitEdit()
                  }}
                  className="flex flex-1"
                >
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => void commitEdit()}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className={smallInputClass}
                    autoFocus
                  />
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSelect(ws.id)}
                    aria-current={ws.id === selectedId ? true : undefined}
                    className={`${listItemClass} w-auto flex-1 ${
                      ws.id === selectedId ? 'bg-[var(--color-accent-soft)]' : 'bg-transparent'
                    }`}
                  >
                    {ws.name}
                  </button>
                  {ws.role === 'OWNER' && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(ws.id, ws.name)}
                        title="Renommer le workspace"
                        className={rowActionClass}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(ws.id, ws.name)}
                        title="Supprimer le workspace"
                        className={rowActionClass}
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
