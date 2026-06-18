import { useMemo, useState } from 'react'
import { iconNames } from 'lucide-react/dynamic'
import { WorkspaceIcon } from './WorkspaceIcon'

// Chaque cellule monte un DynamicIcon (un import dynamique). On borne le nombre
// rendu pour ne pas déclencher des centaines d'imports d'un coup : la recherche
// sert à atteindre les icônes au-delà de cette limite.
const MAX_RESULTS = 60

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
  const shown = matches.slice(0, MAX_RESULTS)

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

      <div className="grid max-h-[200px] grid-cols-6 gap-1.5 overflow-y-auto pr-1">
        <button
          type="button"
          onClick={() => onChange(null)}
          title="Aucune (rond neutre)"
          aria-label="Aucune icône"
          className={cellClass(value === null)}
        >
          <WorkspaceIcon name={null} size={18} />
        </button>

        {shown.map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => onChange(n)}
            title={n}
            aria-label={n}
            aria-pressed={value === n}
            className={cellClass(value === n)}
          >
            <WorkspaceIcon name={n} size={18} />
          </button>
        ))}
      </div>

      <div className="text-[11px] opacity-50">
        {matches.length > MAX_RESULTS
          ? `${MAX_RESULTS} sur ${matches.length} icônes — affinez la recherche`
          : `${matches.length} icône${matches.length > 1 ? 's' : ''}`}
      </div>
    </div>
  )
}
