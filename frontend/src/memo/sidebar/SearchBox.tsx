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
    <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher dans le workspace…"
        style={{
          background: 'var(--color-surface-strong)',
          border: '1px solid var(--color-line-strong)',
          borderRadius: 4,
          color: 'inherit',
          padding: '6px 8px',
          fontSize: 12,
        }}
      />
      {showResults && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-surface-strong)',
            borderRadius: 4,
            padding: 4,
            maxHeight: 240,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {search.isPending ? (
            <div style={{ opacity: 0.4, fontSize: 11, padding: 6 }}>Recherche…</div>
          ) : !search.data || search.data.hits.length === 0 ? (
            <div style={{ opacity: 0.4, fontSize: 11, padding: 6 }}>Aucun résultat</div>
          ) : (
            search.data.hits.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => {
                  onPick(hit)
                  setQuery('')
                }}
                style={{
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  padding: '4px 6px',
                  borderRadius: 3,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 500 }}>{hit.title || '(sans titre)'}</span>
                {hit.snippet && (
                  <span
                    style={{ fontSize: 11, opacity: 0.5 }}
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
  // The original << / >> become &lt;&lt; / &gt;&gt; — restore as <mark>
  return escaped
    .replace(/&lt;&lt;/g, '<mark style="background: var(--color-accent-border); color: inherit;">')
    .replace(/&gt;&gt;/g, '</mark>')
}
