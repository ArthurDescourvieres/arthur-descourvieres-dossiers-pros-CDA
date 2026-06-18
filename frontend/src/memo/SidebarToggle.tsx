import { MemoIcon } from './MemoIcon'

/** Bouton de repli, posé dans l'en-tête de la sidebar (sidebar ouverte). */
export function SidebarToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Réduire le panneau"
      title="Réduire le panneau"
      className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[var(--r-sm)] border border-[var(--color-line-strong)] bg-transparent p-0 text-inherit"
    >
      <MemoIcon name="panel-left" size={16} />
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
      className={`absolute left-[14px] top-[14px] z-20 grid h-9 w-9 place-items-center rounded-[var(--r-md)] border border-[var(--color-line-strong)] bg-[var(--color-surface-strong)] p-0 text-[var(--color-text)] shadow-[0_2px_10px_var(--color-shadow)] backdrop-blur-[8px] transition-[opacity,transform] duration-[250ms] ease-[var(--ease-out-expo)] ${
        visible
          ? 'pointer-events-auto translate-x-0 opacity-100'
          : 'pointer-events-none -translate-x-[8px] opacity-0'
      }`}
    >
      <MemoIcon name="panel-left" size={18} />
    </button>
  )
}
