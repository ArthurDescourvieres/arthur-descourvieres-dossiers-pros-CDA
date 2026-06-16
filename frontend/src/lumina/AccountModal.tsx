import { useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/auth/AuthContext'
import { useExportAccount, useDeleteAccount } from '../hooks/useAccount'

/**
 * Écran « Mon compte » : porte les deux droits RGPD démontrables côté UI —
 * portabilité (export JSON) et effacement (suppression du compte). Modale
 * autonome rendue en portail (le système Modal de LuminaContext n'est pas monté).
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

  return createPortal(
    <div
      style={backdropStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div style={boxStyle} role="dialog" aria-modal="true" aria-label="Mon compte">
        <header style={headerStyle}>
          <h2 style={titleStyle}>Mon compte</h2>
          <button type="button" onClick={onClose} style={closeButtonStyle} aria-label="Fermer">
            ×
          </button>
        </header>

        {user && (
          <div style={userBoxStyle}>
            <div style={{ fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: 13, opacity: 0.6 }}>{user.email}</div>
          </div>
        )}

        <section>
          <h3 style={h3Style}>Mes données</h3>
          <p style={textStyle}>
            Téléchargez l’ensemble de vos données au format JSON (droit à la portabilité).
          </p>
          <button
            type="button"
            style={primaryButtonStyle}
            onClick={handleExport}
            disabled={exportAccount.isPending}
          >
            {exportAccount.isPending ? 'Export…' : 'Exporter mes données'}
          </button>
        </section>

        <section style={dangerZoneStyle}>
          <h3 style={{ ...h3Style, color: 'var(--color-danger)' }}>Supprimer mon compte</h3>
          <p style={textStyle}>
            Votre compte sera immédiatement désactivé, puis définitivement supprimé après 30 jours.
            Cette action est irréversible.
          </p>
          {confirming ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                style={dangerButtonStyle}
                onClick={handleDelete}
                disabled={deleteAccount.isPending}
              >
                {deleteAccount.isPending ? 'Suppression…' : 'Confirmer la suppression'}
              </button>
              <button type="button" style={ghostButtonStyle} onClick={() => setConfirming(false)}>
                Annuler
              </button>
            </div>
          ) : (
            <button
              type="button"
              style={dangerOutlineButtonStyle}
              onClick={() => setConfirming(true)}
            >
              Supprimer mon compte
            </button>
          )}
        </section>

        {error && <div style={errorStyle}>{error}</div>}

        <footer style={footerStyle}>
          <Link to="/mentions-legales" style={linkStyle} onClick={onClose}>
            Mentions légales
          </Link>
          <Link to="/confidentialite" style={linkStyle} onClick={onClose}>
            Politique de confidentialité
          </Link>
        </footer>
      </div>
    </div>,
    document.body,
  )
}

const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'oklch(0 0 0 / 0.5)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 9000,
  padding: 24,
}
const boxStyle: CSSProperties = {
  width: 'min(480px, calc(100vw - 48px))',
  background: 'var(--color-surface-strong)',
  border: '1px solid var(--color-line-strong)',
  borderRadius: 16,
  padding: 22,
  color: 'var(--color-text)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
}
const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}
const titleStyle: CSSProperties = { fontSize: 18, margin: 0 }
const closeButtonStyle: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--color-line-strong)',
  color: 'inherit',
  borderRadius: 6,
  width: 28,
  height: 28,
  fontSize: 18,
  lineHeight: 1,
  cursor: 'pointer',
}
const userBoxStyle: CSSProperties = {
  padding: 12,
  borderRadius: 8,
  background: 'var(--color-overlay)',
}
const h3Style: CSSProperties = { fontSize: 14, margin: '0 0 4px' }
const textStyle: CSSProperties = {
  fontSize: 13,
  opacity: 0.75,
  lineHeight: 1.6,
  margin: '0 0 10px',
}
const primaryButtonStyle: CSSProperties = {
  background: 'var(--color-accent)',
  color: 'var(--color-on-accent)',
  border: 'none',
  borderRadius: 6,
  padding: '8px 14px',
  fontSize: 13,
  cursor: 'pointer',
}
const dangerZoneStyle: CSSProperties = {
  borderTop: '1px solid var(--color-line)',
  paddingTop: 16,
}
const dangerButtonStyle: CSSProperties = {
  background: 'var(--color-danger)',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  padding: '8px 14px',
  fontSize: 13,
  cursor: 'pointer',
}
const dangerOutlineButtonStyle: CSSProperties = {
  background: 'transparent',
  color: 'var(--color-danger)',
  border: '1px solid var(--color-danger)',
  borderRadius: 6,
  padding: '8px 14px',
  fontSize: 13,
  cursor: 'pointer',
}
const ghostButtonStyle: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--color-line-strong)',
  color: 'inherit',
  borderRadius: 6,
  padding: '8px 14px',
  fontSize: 13,
  cursor: 'pointer',
}
const errorStyle: CSSProperties = { fontSize: 12.5, color: 'var(--color-danger)' }
const footerStyle: CSSProperties = {
  display: 'flex',
  gap: 16,
  flexWrap: 'wrap',
  borderTop: '1px solid var(--color-line)',
  paddingTop: 14,
  fontSize: 12.5,
}
const linkStyle: CSSProperties = { color: 'var(--color-accent)', textDecoration: 'none' }
