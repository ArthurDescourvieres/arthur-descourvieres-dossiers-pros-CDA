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
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        width: '100%',
        border: 'none',
        textAlign: 'left',
        padding: '9px 14px',
        fontSize: 13,
        cursor: 'pointer',
        color: danger ? 'var(--color-danger, #c0392b)' : 'inherit',
        background: hovered ? 'var(--color-line)' : 'transparent',
        transition: 'background 0.12s',
      }}
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
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label="Profil"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text)',
          opacity: 0.75,
        }}
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
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 160,
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-line-strong)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            zIndex: 200,
            overflow: 'hidden',
          }}
        >
          <MenuItem
            onClick={() => {
              setOpen(false)
              onSettings()
            }}
          >
            Paramètres
          </MenuItem>
          <div style={{ height: 1, background: 'var(--color-line)' }} />
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
