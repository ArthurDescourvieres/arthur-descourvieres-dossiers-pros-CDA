import { createPortal } from 'react-dom'
import {
  useDeletedFolders,
  useDeletedNotes,
  useRestoreFolder,
  useRestoreNote,
} from '../hooks/useTrash'
import { useDialog } from './dialog/DialogProvider'

/** Une section de la corbeille (Dossiers ou Notes) avec son bouton de restauration. */
function TrashSection({
  title,
  items,
  onRestore,
  pendingId,
  restoreTitle,
}: {
  title: string
  items: { id: string; label: string }[]
  onRestore: (id: string) => void
  pendingId: string | null
  restoreTitle: string
}) {
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="m-0 text-[11px] font-medium uppercase tracking-wide opacity-50">{title}</h3>
      <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
        {items.map((item) => {
          const busy = pendingId === item.id
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-md bg-[var(--color-overlay)] px-2 py-1.5"
            >
              <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] opacity-80">
                {item.label}
              </span>
              <button
                type="button"
                onClick={() => onRestore(item.id)}
                disabled={busy}
                title={restoreTitle}
                className="shrink-0 cursor-pointer whitespace-nowrap rounded-md border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-2 py-1 text-[11px] text-inherit disabled:opacity-50"
              >
                {busy ? 'Restauration…' : 'Restaurer'}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/**
 * Corbeille du workspace (EDITOR+) : liste les dossiers et les notes supprimés
 * (soft-delete) et permet de les restaurer. Restaurer un dossier ramène tout son
 * sous-arbre. Rendue en modale (portail), ouverte depuis le menu profil. Les
 * fetchs n'ont lieu que tant que la modale est montée.
 */
export function TrashModal({ workspaceId, onClose }: { workspaceId: string; onClose: () => void }) {
  const folders = useDeletedFolders(workspaceId, true)
  const notes = useDeletedNotes(workspaceId, true)
  const restoreFolder = useRestoreFolder(workspaceId)
  const restoreNote = useRestoreNote(workspaceId)
  const dialog = useDialog()

  const deletedFolders = folders.data ?? []
  const deletedNotes = notes.data ?? []
  const loading = folders.isPending || notes.isPending
  const empty = deletedFolders.length === 0 && deletedNotes.length === 0

  const restore = async (run: () => Promise<unknown>) => {
    try {
      await run()
    } catch {
      void dialog.alert({ message: 'La restauration a échoué.', variant: 'danger' })
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
        className="flex flex-col gap-4 w-[min(480px,calc(100vw-48px))] max-h-[calc(100vh-48px)] overflow-y-auto rounded-2xl border border-[var(--color-line-strong)] p-[22px] bg-[var(--color-surface-2)] text-[var(--color-text)] shadow-[0_16px_48px_var(--color-shadow)]"
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

        {loading ? (
          <div className="opacity-40 text-sm">…</div>
        ) : empty ? (
          <div className="opacity-50 text-[13px]">Corbeille vide</div>
        ) : (
          <div className="flex flex-col gap-4">
            <TrashSection
              title="Dossiers"
              items={deletedFolders.map((f) => ({ id: f.id, label: f.name || '(sans nom)' }))}
              onRestore={(id) => restore(() => restoreFolder.mutateAsync(id))}
              pendingId={restoreFolder.isPending ? (restoreFolder.variables ?? null) : null}
              restoreTitle="Restaurer le dossier et son contenu"
            />
            <TrashSection
              title="Notes"
              items={deletedNotes.map((n) => ({ id: n.id, label: n.title || '(sans titre)' }))}
              onRestore={(id) => restore(() => restoreNote.mutateAsync(id))}
              pendingId={restoreNote.isPending ? (restoreNote.variables ?? null) : null}
              restoreTitle="Restaurer la note"
            />
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
