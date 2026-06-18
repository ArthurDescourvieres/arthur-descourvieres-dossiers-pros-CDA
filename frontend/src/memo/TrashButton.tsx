import { useState } from 'react'
import type { DragEvent } from 'react'

interface Props {
  onClick: () => void
  className?: string
  /** Vrai quand un élément glissé survole le bouton : couvercle ouvert + halo. */
  dropActive?: boolean
  onDragOver?: (e: DragEvent) => void
  onDragEnter?: (e: DragEvent) => void
  onDragLeave?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
}

export function TrashButton({
  onClick,
  className,
  dropActive = false,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
}: Props) {
  const [hover, setHover] = useState(false)
  // Le couvercle s'ouvre au survol souris ET quand on glisse un élément dessus.
  const lidOpen = hover || dropActive

  return (
    <button
      type="button"
      aria-label="Corbeille"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex items-center justify-center rounded bg-transparent border-none cursor-pointer text-[var(--color-text)] opacity-60 hover:opacity-100 transition-opacity duration-[120ms] ${
        dropActive ? 'ring-2 ring-[var(--color-accent)]' : ''
      } ${className ?? 'p-1'}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ overflow: 'visible' }}
      >
        {/* Bord supérieur du corps — toujours à y=6, visible quand le couvercle s'ouvre */}
        <line x1="3" y1="6" x2="21" y2="6" />

        {/* Couvercle : barre + poignée — pivotent ensemble depuis le coin bas-gauche (3,6) */}
        <g
          style={{
            transformBox: 'fill-box',
            transformOrigin: '0% 100%',
            transform: lidOpen ? 'rotate(-45deg)' : 'rotate(0deg)',
            transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M8 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </g>

        {/* Corps de la poubelle (sans poignée) */}
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />

        {/* Traits intérieurs */}
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </button>
  )
}
