import { useEffect, useRef, useState } from 'react'
import { MemoLogo } from './MemoLogo'
import { useTheme } from '../hooks/useTheme'

interface Props {
  onSettings: () => void
  onTrash?: () => void
  onLogout: () => void
}

/**
 * Interrupteur accessible : piste bleue quand activé, grise quand désactivé,
 * pastille blanche qui glisse. Couleur de piste posée en `style` inline (valeur
 * conditionnelle selon l'état) — simple et indépendant de la compilation des
 * classes Tailwind arbitraires.
 */
function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      style={{ backgroundColor: checked ? 'var(--color-accent-hi)' : 'var(--color-surface-4)' }}
      className={`relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full border transition-colors duration-200 ${
        checked ? 'border-[var(--color-accent-hi)]' : 'border-[var(--color-line-strong)]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-transform duration-200 ${
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}

function MenuItem({
  onClick,
  danger,
  children,
}: {
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full border-none text-left px-3.5 py-[9px] text-[13px] cursor-pointer bg-transparent transition-colors duration-[120ms] hover:bg-[var(--color-line)] ${
        danger ? 'text-[var(--color-danger,#c0392b)]' : 'text-inherit'
      }`}
    >
      {children}
    </button>
  )
}

export function ProfileMenu({ onSettings, onTrash, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { isDark, toggle } = useTheme()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center p-1 rounded-[12px] bg-transparent border-none cursor-pointer opacity-90 transition duration-150 hover:opacity-100 hover:bg-[var(--color-line)]"
      >
        <MemoLogo size={28} />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 min-w-[160px] overflow-hidden rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface-1)] shadow-[0_4px_16px_rgba(0,0,0,0.15)] z-[200]">
          <MenuItem
            onClick={() => {
              setOpen(false)
              onSettings()
            }}
          >
            Paramètres
          </MenuItem>
          {onTrash && (
            <MenuItem
              onClick={() => {
                setOpen(false)
                onTrash()
              }}
            >
              Corbeille
            </MenuItem>
          )}
          <div className="flex w-full items-center justify-between gap-3 px-3.5 py-[9px] text-[13px]">
            <span>Thème sombre</span>
            <Switch checked={isDark} onChange={toggle} label="Activer le thème sombre" />
          </div>
          <div className="h-px bg-[var(--color-line)]" />
          <MenuItem
            danger
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
          >
            Déconnexion
          </MenuItem>
        </div>
      )}
    </div>
  )
}
