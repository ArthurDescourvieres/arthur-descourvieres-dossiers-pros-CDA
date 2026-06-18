import type { ReactNode } from 'react'
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
    <div className="min-h-screen overflow-y-auto bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <div className="mx-auto max-w-[760px]">
        <Link to="/" className="text-[13px] text-[var(--color-accent)] no-underline">
          ← Retour à l’accueil
        </Link>
        <h1 className="mb-1 mt-5 text-[30px] leading-[1.2]">{title}</h1>
        <p className="mb-7 text-[12.5px] opacity-50">Dernière mise à jour : {updatedAt}</p>
        <div>{children}</div>
        <footer className="mt-12 flex flex-wrap items-center gap-4 border-t border-[var(--color-line)] pt-5 text-[13px]">
          <Link to="/mentions-legales" className="text-[var(--color-accent)] no-underline">
            Mentions légales
          </Link>
          <Link to="/confidentialite" className="text-[var(--color-accent)] no-underline">
            Politique de confidentialité
          </Link>
          <span className="opacity-50">© 2026 Memo</span>
        </footer>
      </div>
    </div>
  )
}

export function LegalH2({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 mt-7 text-lg">{children}</h2>
}

export function LegalP({ children }: { children: ReactNode }) {
  return <p className="mb-[10px] text-[14.5px] leading-[1.7] opacity-85">{children}</p>
}
