import { useState } from 'react'
import { useCreateFolder, useDeleteFolder, useUpdateFolder } from '../../hooks/useWorkspaces'
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

export function FolderSection({
  workspaceId,
  folders,
  selectedId,
  onSelect,
  isLoading,
  canEdit,
}: {
  workspaceId: string
  folders: { id: string; name: string }[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  isLoading: boolean
  canEdit: boolean
}) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const create = useCreateFolder(workspaceId)
  const update = useUpdateFolder(workspaceId)
  const del = useDeleteFolder(workspaceId)

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
    if (!window.confirm(`Supprimer le dossier « ${label} » et toutes ses notes ?`)) return
    try {
      await del.mutateAsync(id)
      if (id === selectedId) onSelect(null)
    } catch {
      window.alert('La suppression a échoué.')
    }
  }

  return (
    <section className={sectionClass}>
      <SectionHeader title="Dossiers" onAdd={() => setCreating((v) => !v)} />
      {creating && (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!name.trim()) return
            const folder = await create.mutateAsync({ name: name.trim() })
            onSelect(folder.id)
            setName('')
            setCreating(false)
          }}
          className="flex gap-1"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du dossier"
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
      ) : folders.length === 0 ? (
        <div className={emptyClass}>Aucun dossier</div>
      ) : (
        <ul className={listClass} aria-label="Dossiers">
          {folders.map((f) => (
            <li key={f.id} className={rowClass}>
              {editingId === f.id ? (
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
                    onClick={() => onSelect(f.id)}
                    aria-current={f.id === selectedId ? true : undefined}
                    className={`${listItemClass} w-auto flex-1 ${
                      f.id === selectedId ? 'bg-[var(--color-accent-soft)]' : 'bg-transparent'
                    }`}
                  >
                    {f.name}
                  </button>
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(f.id, f.name)}
                        title="Renommer le dossier"
                        className={rowActionClass}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(f.id, f.name)}
                        title="Supprimer le dossier"
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
