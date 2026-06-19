import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ApiError } from '../lib/api'
import { useCreateWorkspace, useUpdateWorkspace } from '../hooks/useWorkspaces'
import { IconPicker } from './IconPicker'
import { WorkspaceIcon } from './WorkspaceIcon'

type EditTarget = { id: string; name: string; icon: string | null }

/**
 * Modale unique de création / édition d'un workspace : nom + choix d'icône.
 * En création on sélectionne le nouveau workspace via onCreated ; en édition on
 * envoie name + icon (icon = null réinitialise au rond blanc par défaut).
 */
export function WorkspaceFormModal({
  mode,
  workspace,
  onClose,
  onCreated,
}: {
  mode: 'create' | 'edit'
  workspace?: EditTarget
  onClose: () => void
  onCreated?: (id: string) => void
}) {
  const [name, setName] = useState(workspace?.name ?? '')
  const [icon, setIcon] = useState<string | null>(workspace?.icon ?? null)
  const [error, setError] = useState<string | null>(null)
  const create = useCreateWorkspace()
  const update = useUpdateWorkspace()

  const busy = create.isPending || update.isPending
  const trimmed = name.trim()
  const valid = trimmed.length >= 3 && trimmed.length <= 50

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid || busy) return
    setError(null)
    try {
      if (mode === 'create') {
        const ws = await create.mutateAsync({ name: trimmed, icon: icon ?? undefined })
        onCreated?.(ws.id)
      } else if (workspace) {
        await update.mutateAsync({ id: workspace.id, name: trimmed, icon })
      }
      onClose()
    } catch (err) {
      setError(formError(err))
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 grid place-items-center z-[9000] p-6 bg-[oklch(0_0_0_/_0.5)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={submit}
        className="flex flex-col gap-4 w-[min(440px,calc(100vw-48px))] max-h-[calc(100vh-48px)] overflow-y-auto rounded-2xl border border-[var(--color-line-strong)] p-[22px] bg-[var(--color-surface-2)] text-[var(--color-text)] shadow-[0_16px_48px_var(--color-shadow)]"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'create' ? 'Nouveau workspace' : 'Modifier le workspace'}
      >
        <header className="flex items-center justify-between">
          <h2 className="m-0 text-lg">
            {mode === 'create' ? 'Nouveau workspace' : 'Modifier le workspace'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-7 h-7 text-lg leading-none cursor-pointer rounded-md border border-[var(--color-line-strong)] bg-transparent text-inherit"
          >
            ×
          </button>
        </header>

        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface)]">
            <WorkspaceIcon name={icon} size={22} />
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du workspace"
            autoFocus
            maxLength={50}
            className="flex-1 rounded-md border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-inherit outline-none"
          />
        </div>

        <IconPicker value={icon} onChange={setIcon} />

        {error && <div className="text-[11.5px] text-[var(--color-danger)]">{error}</div>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-[var(--color-line-strong)] bg-transparent px-3 py-1.5 text-[13px] text-inherit"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!valid || busy}
            className="cursor-pointer rounded-md border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-3 py-1.5 text-[13px] text-inherit disabled:opacity-50"
          >
            {busy ? '…' : mode === 'create' ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

function formError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return 'Ce nom est déjà utilisé.'
    if (err.status === 400) return 'Nom ou icône invalide.'
  }
  return "L'opération a échoué."
}
