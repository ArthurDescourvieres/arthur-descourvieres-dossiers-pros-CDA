import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export type MenuItem = { label: string; onClick: () => void; danger?: boolean }

/**
 * Petit menu contextuel positionné au point (x, y), ouvert vers le haut
 * (-translate-y-full) car ancré sur la barre de workspaces en bas de sidebar.
 * Se ferme au clic extérieur, à Escape ou au resize.
 */
export function WorkspaceContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}) {
  useEffect(() => {
    const close = () => onClose()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed z-[9500] min-w-[160px] -translate-y-full overflow-hidden rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface-1)] py-1 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
      role="menu"
    >
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          role="menuitem"
          onClick={() => {
            onClose()
            it.onClick()
          }}
          className={`block w-full cursor-pointer border-none bg-transparent px-3.5 py-2 text-left text-[13px] transition-colors duration-[120ms] hover:bg-[var(--color-line)] ${
            it.danger ? 'text-[var(--color-danger)]' : 'text-inherit'
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>,
    document.body,
  )
}
