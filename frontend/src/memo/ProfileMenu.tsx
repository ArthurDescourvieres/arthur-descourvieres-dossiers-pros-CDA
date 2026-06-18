import { useEffect, useRef, useState } from 'react'

interface Props {
  onSettings: () => void
  onLogout: () => void
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

export function ProfileMenu({ onSettings, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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
        aria-label="Profil"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center p-1 rounded-full bg-transparent border-none cursor-pointer opacity-75 text-[var(--color-text)]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
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
