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
      className="absolute left-[14px] top-[14px] z-20 grid h-10 w-10 place-items-center rounded-full border border-[var(--color-line-strong)] bg-[var(--color-surface-strong)] p-0 text-[var(--color-text)] shadow-[0_2px_10px_var(--color-shadow)] backdrop-blur-[8px]"
    >
      <MemoIcon name="arrow-left" size={18} />
    </button>
  )
}
