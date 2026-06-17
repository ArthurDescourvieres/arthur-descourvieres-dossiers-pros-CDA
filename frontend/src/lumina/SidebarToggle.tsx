import { LuminaIcon } from './LuminaIcon'

/** Bouton de repli, posé dans l'en-tête de la sidebar (sidebar ouverte). */
export function SidebarToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Réduire le panneau"
      title="Réduire le panneau"
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 30,
        height: 30,
        padding: 0,
        background: 'transparent',
        border: '1px solid var(--color-line-strong)',
        borderRadius: 'var(--r-sm)',
        color: 'inherit',
        cursor: 'pointer',
        flex: '0 0 auto',
      }}
    >
      <LuminaIcon name="panel-left" size={16} />
    </button>
  )
}

/** Bouton flottant de réouverture, visible uniquement quand la sidebar est repliée. */
export function SidebarOpenButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Afficher le panneau"
      title="Afficher le panneau"
      aria-hidden={!visible}
      style={{
        position: 'absolute',
        top: 14,
        left: 14,
        zIndex: 20,
        display: 'grid',
        placeItems: 'center',
        width: 36,
        height: 36,
        padding: 0,
        background: 'var(--color-surface-strong)',
        border: '1px solid var(--color-line-strong)',
        borderRadius: 'var(--r-md)',
        color: 'var(--color-text)',
        cursor: 'pointer',
        boxShadow: '0 2px 10px var(--color-shadow)',
        backdropFilter: 'blur(8px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-8px)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.25s var(--ease-out-expo), transform 0.25s var(--ease-out-expo)',
      }}
    >
      <LuminaIcon name="panel-left" size={18} />
    </button>
  )
}
