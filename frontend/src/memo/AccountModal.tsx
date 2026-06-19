import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/auth/AuthContext'
import { useExportAccount, useDeleteAccount } from '../hooks/useAccount'

/**
 * Écran « Mon compte » : porte les deux droits RGPD démontrables côté UI —
 * portabilité (export JSON) et effacement (suppression du compte). Modale
 * autonome rendue en portail (le système Modal de MemoContext n'est pas monté).
 */
export function AccountModal({ onClose }: { onClose: () => void }) {
  const auth = useAuth()
  const user = auth.status === 'authenticated' ? auth.user : null
  const qc = useQueryClient()
  const exportAccount = useExportAccount()
  const deleteAccount = useDeleteAccount()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setError(null)
    try {
      await exportAccount.mutateAsync()
    } catch {
      setError('L’export a échoué. Réessayez.')
    }
  }

  const handleDelete = async () => {
    setError(null)
    try {
      await deleteAccount.mutateAsync()
      qc.clear()
      await auth.logout() // repasse l'app en mode visiteur (retour à l'accueil)
    } catch {
      setError('La suppression a échoué. Réessayez.')
    }
  }

  const buttonBase = 'rounded-md px-3.5 py-2 text-[13px] cursor-pointer'
  const h3Base = 'text-sm mt-0 mb-1'

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
        aria-label="Mon compte"
      >
        <header className="flex items-center justify-between">
          <h2 className="text-lg m-0">Mon compte</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 text-lg leading-none cursor-pointer rounded-md border border-[var(--color-line-strong)] bg-transparent text-inherit"
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        {user && (
          <div className="p-3 rounded-lg bg-[var(--color-overlay)]">
            <div className="font-semibold">{user.name}</div>
            <div className="text-[13px] opacity-60">{user.email}</div>
          </div>
        )}

        <section>
          <h3 className={h3Base}>Mes données</h3>
          <p className="text-[13px] opacity-75 leading-[1.6] mt-0 mb-2.5">
            Téléchargez l’ensemble de vos données au format JSON (droit à la portabilité).
          </p>
          <button
            type="button"
            className={`${buttonBase} border-none bg-[var(--color-accent)] text-[var(--color-on-accent)]`}
            onClick={handleExport}
            disabled={exportAccount.isPending}
          >
            {exportAccount.isPending ? 'Export…' : 'Exporter mes données'}
          </button>
        </section>

        <section className="border-t border-[var(--color-line)] pt-4">
          <h3 className={`${h3Base} text-[var(--color-danger)]`}>Supprimer mon compte</h3>
          <p className="text-[13px] opacity-75 leading-[1.6] mt-0 mb-2.5">
            Votre compte sera immédiatement désactivé, puis définitivement supprimé après 30 jours.
            Cette action est irréversible.
          </p>
          {confirming ? (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                className={`${buttonBase} border-none bg-[var(--color-danger)] text-white`}
                onClick={handleDelete}
                disabled={deleteAccount.isPending}
              >
                {deleteAccount.isPending ? 'Suppression…' : 'Confirmer la suppression'}
              </button>
              <button
                type="button"
                className={`${buttonBase} bg-transparent border border-[var(--color-line-strong)] text-inherit`}
                onClick={() => setConfirming(false)}
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`${buttonBase} bg-transparent border border-[var(--color-danger)] text-[var(--color-danger)]`}
              onClick={() => setConfirming(true)}
            >
              Supprimer mon compte
            </button>
          )}
        </section>

        {error && <div className="text-[12.5px] text-[var(--color-danger)]">{error}</div>}

        <footer className="flex gap-4 flex-wrap border-t border-[var(--color-line)] pt-3.5 text-[12.5px]">
          <Link
            to="/mentions-legales"
            className="no-underline text-[var(--color-accent)]"
            onClick={onClose}
          >
            Mentions légales
          </Link>
          <Link
            to="/confidentialite"
            className="no-underline text-[var(--color-accent)]"
            onClick={onClose}
          >
            Politique de confidentialité
          </Link>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
