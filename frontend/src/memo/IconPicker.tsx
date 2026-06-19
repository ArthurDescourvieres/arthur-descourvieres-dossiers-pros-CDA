import { useEffect, useMemo, useRef, useState } from 'react'
import { iconNames } from 'lucide-react/dynamic'
import { useVirtualizer } from '@tanstack/react-virtual'
import { WorkspaceIcon } from './WorkspaceIcon'

// Grille virtualisée : on affiche TOUTES les icônes (~1900) mais seules les
// rangées visibles sont montées dans le DOM. Comme chaque cellule monte un
// DynamicIcon (un import dynamique), la virtualisation borne le nombre d'imports
// déclenchés à un instant donné à ce qui est à l'écran — c'est ça, le lazy-load.
const COLS = 6
const CELL_PX = 36 // h-9
const GAP_PX = 6 // gap-1.5
const ROW_PX = CELL_PX + GAP_PX

// L'item null représente la cellule « Aucune » (rond neutre), placée en tête.
type Item = string | null

export function IconPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (name: string | null) => void
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const matches = useMemo(
    () => (q ? (iconNames as string[]).filter((n) => n.includes(q)) : (iconNames as string[])),
    [q],
  )
  const items = useMemo<Item[]>(() => [null, ...matches], [matches])
  const rowCount = Math.ceil(items.length / COLS)

  const scrollRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_PX,
    overscan: 4,
  })

  // Remonter en haut quand la recherche change : la liste rétrécit, rester
  // scrollé en bas afficherait du vide.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [q])

  const cellClass = (selected: boolean) =>
    `grid h-9 w-9 place-items-center rounded-lg border transition-colors ${
      selected
        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
        : 'border-[var(--color-line-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-strong)]'
    }`

  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher une icône…"
        aria-label="Rechercher une icône"
        className="rounded-md border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-inherit outline-none"
      />

      <div ref={scrollRef} className="max-h-[210px] overflow-y-auto pr-1">
        <div style={{ position: 'relative', width: '100%', height: rowVirtualizer.getTotalSize() }}>
          {rowVirtualizer.getVirtualItems().map((vi) => {
            const start = vi.index * COLS
            const rowItems = items.slice(start, start + COLS)
            return (
              <div
                key={vi.key}
                className="grid grid-cols-6 gap-1.5"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${vi.start}px)`,
                }}
              >
                {rowItems.map((n) =>
                  n === null ? (
                    <button
                      key="none"
                      type="button"
                      onClick={() => onChange(null)}
                      title="Aucune (rond neutre)"
                      aria-label="Aucune icône"
                      aria-pressed={value === null}
                      className={cellClass(value === null)}
                    >
                      <WorkspaceIcon name={null} size={18} />
                    </button>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onChange(n)}
                      title={n}
                      aria-label={n}
                      aria-pressed={value === n}
                      className={cellClass(value === n)}
                    >
                      <WorkspaceIcon name={n} size={18} />
                    </button>
                  ),
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-[11px] opacity-50">
        {matches.length} icône{matches.length > 1 ? 's' : ''}
      </div>
    </div>
  )
}
