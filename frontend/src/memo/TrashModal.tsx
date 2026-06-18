import { createPortal } from 'react-dom'
import { useDeletedNotes, useRestoreNote } from '../hooks/useTrash'

/**
 * Corbeille du workspace (EDITOR+) : liste les notes supprimées (soft-delete)
 * et permet de les restaurer. Rendue en modale (portail), ouverte depuis le
 * menu profil. Le fetch n'a lieu que tant que la modale est montée.
 */
export function TrashModal({ workspaceId, onClose }: { workspaceId: string; onClose: () => void }) {
  const trash = useDeletedNotes(workspaceId, true)
  const restore = useRestoreNote(workspaceId)
  const notes = trash.data ?? []

  const onRestore = async (id: string) => {
    try {
      await restore.mutateAsync(id)
    } catch {
      window.alert('La restauration a échoué.')
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 grid place-items-center z-[9000] p-6 bg-[oklch(0_0_0_/_0.5)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="flex flex-col gap-4 w-[min(480px,calc(100vw-48px))] max-h-[calc(100vh-48px)] overflow-y-auto rounded-2xl border border-[var(--color-line-strong)] p-[22px] bg-[var(--color-surface-strong)] text-[var(--color-text)]"
        role="dialog"
        aria-modal="true"
        aria-label="Corbeille"
      >
        <header className="flex items-center justify-between">
          <h2 className="text-lg m-0">Corbeille</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 text-lg leading-none cursor-pointer rounded-md border border-[var(--color-line-strong)] bg-transparent text-inherit"
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        {trash.isPending ? (
          <div className="opacity-40 text-sm">…</div>
        ) : notes.length === 0 ? (
          <div className="opacity-50 text-[13px]">Corbeille vide</div>
        ) : (
          <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
            {notes.map((n) => {
              const busy = restore.isPending && restore.variables === n.id
              return (
                <li
                  key={n.id}
                  className="flex items-center justify-between gap-2 rounded-md bg-[var(--color-overlay)] px-2 py-1.5"
                >
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] opacity-80">
                    {n.title || '(sans titre)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRestore(n.id)}
                    disabled={busy}
                    title="Restaurer la note"
                    className="shrink-0 cursor-pointer whitespace-nowrap rounded-md border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-2 py-1 text-[11px] text-inherit disabled:opacity-50"
                  >
                    {busy ? 'Restauration…' : 'Restaurer'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  )
}
