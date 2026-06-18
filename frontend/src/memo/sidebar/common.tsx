import type { CSSProperties } from 'react'

// Shared header + styles for the sidebar sections (Workspaces, Dossiers,
// Notes). Extracted from WorkspaceShell so each section lives in its own file.
export function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 }}>
        {title}
      </span>
      <button
        type="button"
        onClick={onAdd}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          opacity: 0.6,
          fontSize: 14,
          cursor: 'pointer',
        }}
        title={`Ajouter ${title.toLowerCase()}`}
      >
        +
      </button>
    </div>
  )
}

export const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

export const listStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

export const listItemStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  padding: '6px 8px',
  borderRadius: 4,
  fontSize: 13,
  cursor: 'pointer',
}

// Row wrapper for an item that carries a trailing action (rename/delete).
export const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
}

export const rowActionStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  opacity: 0.4,
  fontSize: 14,
  lineHeight: 1,
  cursor: 'pointer',
  padding: '4px 6px',
  borderRadius: 4,
  flexShrink: 0,
}

export const smallInputStyle: CSSProperties = {
  flex: 1,
  background: 'var(--color-surface-strong)',
  border: '1px solid var(--color-line-strong)',
  borderRadius: 4,
  color: 'inherit',
  padding: '4px 6px',
  fontSize: 12,
}

export const smallButtonStyle: CSSProperties = {
  background: 'var(--color-accent)',
  color: 'var(--color-on-accent)',
  border: 'none',
  borderRadius: 4,
  padding: '0 8px',
  fontSize: 14,
  cursor: 'pointer',
}

export const loadingStyle: CSSProperties = { opacity: 0.4, fontSize: 12 }
export const emptyStyle: CSSProperties = { opacity: 0.4, fontSize: 12, padding: '4px 8px' }
