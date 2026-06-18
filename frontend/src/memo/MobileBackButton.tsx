import { MemoIcon } from './MemoIcon'

/**
 * Bouton rond de retour, posé en haut à gauche de l'éditeur en vue mobile.
 * Ramène de la note ouverte vers le menu (liste workspaces / dossiers / notes).
 */
export function MobileBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Retour à la liste"
      title="Retour"
      style={{
        position: 'absolute',
        top: 14,
        left: 14,
        zIndex: 20,
        display: 'grid',
        placeItems: 'center',
        width: 40,
        height: 40,
        padding: 0,
        background: 'var(--color-surface-strong)',
        border: '1px solid var(--color-line-strong)',
        borderRadius: '50%',
        color: 'var(--color-text)',
        cursor: 'pointer',
        boxShadow: '0 2px 10px var(--color-shadow)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <MemoIcon name="arrow-left" size={18} />
    </button>
  )
}
