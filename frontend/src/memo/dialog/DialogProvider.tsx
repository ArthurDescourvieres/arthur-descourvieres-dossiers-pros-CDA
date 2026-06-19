import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ConfirmDialog, type DialogVariant } from './ConfirmDialog'

type ConfirmOptions = {
  title?: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: DialogVariant
}

type AlertOptions = {
  title?: string
  message: ReactNode
  confirmLabel?: string
  variant?: DialogVariant
}

type DialogApi = {
  /** Confirmation modale : résout `true` si l'utilisateur valide, sinon `false`. */
  confirm: (options: ConfirmOptions) => Promise<boolean>
  /** Alerte modale (un seul bouton) : résout quand l'utilisateur ferme. */
  alert: (options: AlertOptions) => Promise<void>
}

type ActiveDialog = {
  mode: 'confirm' | 'alert'
  title?: string
  message: ReactNode
  confirmLabel: string
  cancelLabel: string
  variant: DialogVariant
  resolve: (value: boolean) => void
}

const DialogContext = createContext<DialogApi | null>(null)

/**
 * Fournit `confirm()` / `alert()` promisifiés à toute l'app, en remplacement des
 * window.confirm / window.alert natifs. Une seule boîte est affichée à la fois ;
 * une nouvelle demande annule proprement la précédente (résout `false`).
 */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveDialog | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setActive((prev) => {
          prev?.resolve(false)
          return {
            mode: 'confirm',
            title: options.title,
            message: options.message,
            confirmLabel: options.confirmLabel ?? 'Confirmer',
            cancelLabel: options.cancelLabel ?? 'Annuler',
            variant: options.variant ?? 'default',
            resolve,
          }
        })
      }),
    [],
  )

  const alert = useCallback(
    (options: AlertOptions) =>
      new Promise<void>((resolve) => {
        setActive((prev) => {
          prev?.resolve(false)
          return {
            mode: 'alert',
            title: options.title,
            message: options.message,
            confirmLabel: options.confirmLabel ?? 'OK',
            cancelLabel: '',
            variant: options.variant ?? 'default',
            resolve: () => resolve(),
          }
        })
      }),
    [],
  )

  const close = useCallback((value: boolean) => {
    setActive((curr) => {
      curr?.resolve(value)
      return null
    })
  }, [])

  const api = useMemo<DialogApi>(() => ({ confirm, alert }), [confirm, alert])

  return (
    <DialogContext.Provider value={api}>
      {children}
      {active && (
        <ConfirmDialog
          mode={active.mode}
          title={active.title}
          message={active.message}
          confirmLabel={active.confirmLabel}
          cancelLabel={active.cancelLabel}
          variant={active.variant}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      )}
    </DialogContext.Provider>
  )
}

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog doit être utilisé dans un <DialogProvider>')
  return ctx
}
