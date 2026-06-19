import type { ReactNode } from 'react'
import { MemoIcon } from '../MemoIcon'

type WindowFrameProps = {
  children: ReactNode
  /** Optional size/variant class (e.g. `lp-win-hero`). */
  className?: string
  /** Optional centered label shown in the title bar. */
  title?: string
}

/**
 * Cadre « fenêtre macOS » réutilisable : barre à trois pastilles + contenu.
 * Sert aussi bien au mock d'interface du hero qu'aux vidéos de démo au survol.
 */
export function WindowFrame({ children, className, title }: WindowFrameProps) {
  return (
    <div className={`lp-win${className ? ` ${className}` : ''}`}>
      <div className="lp-win-bar" aria-hidden>
        <span className="lp-win-dot lp-win-dot--r" />
        <span className="lp-win-dot lp-win-dot--y" />
        <span className="lp-win-dot lp-win-dot--g" />
        {title && <span className="lp-win-title">{title}</span>}
      </div>
      <div className="lp-win-body">{children}</div>
    </div>
  )
}

/**
 * Emplacement vidéo de démo : placeholder affiché tant que l'enregistrement
 * n'est pas prêt. On y branchera une <video> jouée au survol.
 */
export function VideoSlot({ label }: { label: string }) {
  return (
    <div className="lp-vslot">
      <span className="lp-vslot-play">
        <MemoIcon name="play" size={20} strokeWidth={1.6} />
      </span>
      <span className="lp-vslot-label">{label}</span>
      <span className="lp-vslot-hint">Survole pour lire</span>
    </div>
  )
}
