import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

export type DialogVariant = 'default' | 'danger'

export type ConfirmDialogProps = {
  mode: 'confirm' | 'alert'
  title?: string
  message: ReactNode
  confirmLabel: string
  cancelLabel: string
  variant: DialogVariant
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Boîte de dialogue maison (confirmation ou alerte), rendue en portail au même
 * style que les modales de l'app. Remplace window.confirm / window.alert :
 * Échap ou clic sur le fond annule, le bouton d'action est auto-focus (Entrée
 * valide), et le focus précédent est restauré à la fermeture (a11y).
 */
export function ConfirmDialog({
  mode,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const isDanger = variant === 'danger'

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    confirmRef.current?.focus()
    return () => previous?.focus?.()
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] grid place-items-center bg-[oklch(0_0_0_/_0.5)] p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel()
      }}
    >
      <div
        role={mode === 'alert' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-label={title ?? (mode === 'alert' ? 'Information' : 'Confirmation')}
        className="flex w-[min(420px,calc(100vw-48px))] flex-col gap-4 rounded-2xl border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] p-[22px] text-[var(--color-text)] shadow-[0_16px_48px_var(--color-shadow)]"
        style={{ animation: 'blockEnter 220ms var(--ease-out-expo) both' }}
      >
        <div className="flex items-start gap-3">
          {isDanger && (
            <span
              className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--color-danger)]"
              style={{ background: 'color-mix(in oklab, var(--color-danger) 12%, transparent)' }}
            >
              <AlertTriangle size={18} />
            </span>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            {title && <h2 className="m-0 text-base font-semibold">{title}</h2>}
            <div className="text-[13px] leading-[1.55] text-[var(--color-text-dim)]">{message}</div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {mode === 'confirm' && (
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-md border border-[var(--color-line-strong)] bg-transparent px-3 py-1.5 text-[13px] text-inherit"
            >
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={
              isDanger
                ? 'cursor-pointer rounded-md border-none bg-[var(--color-danger)] px-3 py-1.5 text-[13px] text-white'
                : 'cursor-pointer rounded-md border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-3 py-1.5 text-[13px] text-inherit'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
