import { useState } from 'react'
import { useSearch, type SearchHit } from '../../hooks/useSearch'
import { sanitizeHtml } from '../../lib/sanitizeHtml'

export function SearchBox({
  workspaceId,
  onPick,
}: {
  workspaceId: string
  onPick: (hit: SearchHit) => void
}) {
  const [query, setQuery] = useState('')
  const search = useSearch(workspaceId, query)
  const showResults = query.trim().length > 0

  return (
    <section className="flex flex-col gap-1.5">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher dans le workspace…"
        className="rounded border border-[var(--color-line-strong)] bg-[var(--color-surface-strong)] px-2 py-1.5 text-xs text-inherit"
      />
      {showResults && (
        <div className="flex max-h-60 flex-col gap-0.5 overflow-auto rounded border border-[var(--color-surface-strong)] bg-[var(--color-surface)] p-1">
          {search.isPending ? (
            <div className="p-1.5 text-[11px] opacity-40">Recherche…</div>
          ) : !search.data || search.data.hits.length === 0 ? (
            <div className="p-1.5 text-[11px] opacity-40">Aucun résultat</div>
          ) : (
            search.data.hits.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => {
                  onPick(hit)
                  setQuery('')
                }}
                className="flex cursor-pointer flex-col gap-0.5 rounded-[3px] border-none bg-transparent px-1.5 py-1 text-left text-inherit"
              >
                <span className="text-xs font-medium">{hit.title || '(sans titre)'}</span>
                {hit.snippet && (
                  <span
                    className="search-snippet text-[11px] opacity-50"
                    // The server returns << / >> markers around matches.
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(highlightSnippet(hit.snippet)),
                    }}
                  />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </section>
  )
}

function highlightSnippet(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  // The original << / >> become &lt;&lt; / &gt;&gt; — restore as a bare <mark>.
  // Styling lives in CSS (.search-snippet mark); emitting no inline style keeps
  // the markup intact through sanitizeHtml, which strips style/class as an XSS
  // and CSS-exfiltration guard.
  return escaped.replace(/&lt;&lt;/g, '<mark>').replace(/&gt;&gt;/g, '</mark>')
}
