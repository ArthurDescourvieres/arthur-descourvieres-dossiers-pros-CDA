import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * Gabarit commun aux pages légales publiques (mentions légales, confidentialité).
 * Lisible, centré, sobre — réutilise les tokens de couleur du thème.
 */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string
  updatedAt: string
  children: ReactNode
}) {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <Link to="/" style={backLinkStyle}>
          ← Retour à l’accueil
        </Link>
        <h1 style={h1Style}>{title}</h1>
        <p style={updatedStyle}>Dernière mise à jour : {updatedAt}</p>
        <div>{children}</div>
        <footer style={footerStyle}>
          <Link to="/mentions-legales" style={footerLinkStyle}>
            Mentions légales
          </Link>
          <Link to="/confidentialite" style={footerLinkStyle}>
            Politique de confidentialité
          </Link>
          <span style={{ opacity: 0.5 }}>© 2026 Lumina</span>
        </footer>
      </div>
    </div>
  )
}

export function LegalH2({ children }: { children: ReactNode }) {
  return <h2 style={h2Style}>{children}</h2>
}

export function LegalP({ children }: { children: ReactNode }) {
  return <p style={pStyle}>{children}</p>
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  padding: '48px 24px',
  overflowY: 'auto',
}
const containerStyle: CSSProperties = { maxWidth: 760, margin: '0 auto' }
const backLinkStyle: CSSProperties = {
  color: 'var(--color-accent)',
  fontSize: 13,
  textDecoration: 'none',
}
const h1Style: CSSProperties = { fontSize: 30, margin: '20px 0 4px', lineHeight: 1.2 }
const updatedStyle: CSSProperties = { fontSize: 12.5, opacity: 0.5, margin: '0 0 28px' }
const h2Style: CSSProperties = { fontSize: 18, margin: '28px 0 8px' }
const pStyle: CSSProperties = { fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, margin: '0 0 10px' }
const footerStyle: CSSProperties = {
  display: 'flex',
  gap: 16,
  flexWrap: 'wrap',
  alignItems: 'center',
  marginTop: 48,
  paddingTop: 20,
  borderTop: '1px solid var(--color-line)',
  fontSize: 13,
}
const footerLinkStyle: CSSProperties = { color: 'var(--color-accent)', textDecoration: 'none' }
