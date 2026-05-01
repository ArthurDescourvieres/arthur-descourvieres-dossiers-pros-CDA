import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth/AuthContext'
import {
  useCreateFolder,
  useCreateNote,
  useCreateWorkspace,
  useFolders,
  useNote,
  useNotesInFolder,
  useWorkspaces,
} from '../hooks/useWorkspaces'
import { useNoteAutosave, type AutosaveStatus } from '../hooks/useNoteAutosave'
import { useSearch, type SearchHit } from '../hooks/useSearch'
import { TiptapEditor } from './TiptapEditor'
import { AttachmentsPanel } from './AttachmentsPanel'

export function WorkspaceShell() {
  const auth = useAuth()
  const user = auth.status === 'authenticated' ? auth.user : null

  const workspaces = useWorkspaces()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  // Auto-pick first workspace once loaded.
  useEffect(() => {
    if (!selectedWorkspaceId && workspaces.data && workspaces.data.length > 0) {
      setSelectedWorkspaceId(workspaces.data[0].id)
    }
  }, [workspaces.data, selectedWorkspaceId])

  const folders = useFolders(selectedWorkspaceId)

  // Auto-pick first folder.
  useEffect(() => {
    setSelectedFolderId(null)
    setSelectedNoteId(null)
  }, [selectedWorkspaceId])

  useEffect(() => {
    if (!selectedFolderId && folders.data && folders.data.length > 0) {
      setSelectedFolderId(folders.data[0].id)
    }
  }, [folders.data, selectedFolderId])

  const notes = useNotesInFolder(selectedWorkspaceId, selectedFolderId)

  useEffect(() => {
    setSelectedNoteId(null)
  }, [selectedFolderId])

  useEffect(() => {
    if (!selectedNoteId && notes.data && notes.data.length > 0) {
      setSelectedNoteId(notes.data[0].id)
    }
  }, [notes.data, selectedNoteId])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        background: '#0b0b0f',
        color: '#f5f5f5',
      }}
    >
      <aside
        style={{
          borderRight: '1px solid rgba(255,255,255,0.08)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflow: 'auto',
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Lumina</strong>
          <button
            type="button"
            onClick={auth.logout}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'inherit',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Déconnexion
          </button>
        </header>

        {user && (
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            {user.name} · {user.email}
          </div>
        )}

        {selectedWorkspaceId && (
          <SearchBox
            workspaceId={selectedWorkspaceId}
            onPick={(hit) => {
              setSelectedFolderId(hit.folderId)
              setSelectedNoteId(hit.id)
            }}
          />
        )}

        <WorkspaceSection
          workspaces={workspaces.data ?? []}
          selectedId={selectedWorkspaceId}
          onSelect={setSelectedWorkspaceId}
          isLoading={workspaces.isPending}
        />

        {selectedWorkspaceId && (
          <FolderSection
            workspaceId={selectedWorkspaceId}
            folders={folders.data ?? []}
            selectedId={selectedFolderId}
            onSelect={setSelectedFolderId}
            isLoading={folders.isPending}
          />
        )}

        {selectedFolderId && (
          <NoteSection
            workspaceId={selectedWorkspaceId}
            folderId={selectedFolderId}
            notes={notes.data ?? []}
            selectedId={selectedNoteId}
            onSelect={setSelectedNoteId}
            isLoading={notes.isPending}
          />
        )}
      </aside>

      <main style={{ padding: 32, overflow: 'auto' }}>
        {selectedNoteId ? (
          <NoteEditor noteId={selectedNoteId} />
        ) : (
          <div style={{ opacity: 0.5, fontSize: 14, marginTop: 80, textAlign: 'center' }}>
            Sélectionnez ou créez une note pour commencer.
          </div>
        )}
      </main>
    </div>
  )
}

function WorkspaceSection({
  workspaces,
  selectedId,
  onSelect,
  isLoading,
}: {
  workspaces: { id: string; name: string }[]
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading: boolean
}) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const create = useCreateWorkspace()

  return (
    <section style={sectionStyle}>
      <SectionHeader title="Workspaces" onAdd={() => setCreating((v) => !v)} />
      {creating && (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!name.trim()) return
            const ws = await create.mutateAsync({ name: name.trim() })
            onSelect(ws.id)
            setName('')
            setCreating(false)
          }}
          style={{ display: 'flex', gap: 4 }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du workspace"
            style={smallInputStyle}
            autoFocus
          />
          <button type="submit" style={smallButtonStyle} disabled={create.isPending}>
            +
          </button>
        </form>
      )}
      {isLoading ? (
        <div style={loadingStyle}>…</div>
      ) : (
        <ul style={listStyle}>
          {workspaces.map((ws) => (
            <li key={ws.id}>
              <button
                type="button"
                onClick={() => onSelect(ws.id)}
                style={{
                  ...listItemStyle,
                  background: ws.id === selectedId ? 'rgba(91, 140, 255, 0.18)' : 'transparent',
                }}
              >
                {ws.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FolderSection({
  workspaceId,
  folders,
  selectedId,
  onSelect,
  isLoading,
}: {
  workspaceId: string
  folders: { id: string; name: string }[]
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading: boolean
}) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const create = useCreateFolder(workspaceId)

  return (
    <section style={sectionStyle}>
      <SectionHeader title="Dossiers" onAdd={() => setCreating((v) => !v)} />
      {creating && (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!name.trim()) return
            const folder = await create.mutateAsync({ name: name.trim() })
            onSelect(folder.id)
            setName('')
            setCreating(false)
          }}
          style={{ display: 'flex', gap: 4 }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du dossier"
            style={smallInputStyle}
            autoFocus
          />
          <button type="submit" style={smallButtonStyle} disabled={create.isPending}>
            +
          </button>
        </form>
      )}
      {isLoading ? (
        <div style={loadingStyle}>…</div>
      ) : folders.length === 0 ? (
        <div style={emptyStyle}>Aucun dossier</div>
      ) : (
        <ul style={listStyle}>
          {folders.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => onSelect(f.id)}
                style={{
                  ...listItemStyle,
                  background: f.id === selectedId ? 'rgba(91, 140, 255, 0.18)' : 'transparent',
                }}
              >
                {f.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function NoteSection({
  workspaceId,
  folderId,
  notes,
  selectedId,
  onSelect,
  isLoading,
}: {
  workspaceId: string | null
  folderId: string
  notes: { id: string; title: string }[]
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading: boolean
}) {
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const create = useCreateNote(workspaceId, folderId)

  return (
    <section style={sectionStyle}>
      <SectionHeader title="Notes" onAdd={() => setCreating((v) => !v)} />
      {creating && (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!title.trim()) return
            const note = await create.mutateAsync({ title: title.trim() })
            onSelect(note.id)
            setTitle('')
            setCreating(false)
          }}
          style={{ display: 'flex', gap: 4 }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la note"
            style={smallInputStyle}
            autoFocus
          />
          <button type="submit" style={smallButtonStyle} disabled={create.isPending}>
            +
          </button>
        </form>
      )}
      {isLoading ? (
        <div style={loadingStyle}>…</div>
      ) : notes.length === 0 ? (
        <div style={emptyStyle}>Aucune note</div>
      ) : (
        <ul style={listStyle}>
          {notes.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onSelect(n.id)}
                style={{
                  ...listItemStyle,
                  background: n.id === selectedId ? 'rgba(91, 140, 255, 0.18)' : 'transparent',
                }}
              >
                {n.title || '(sans titre)'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function NoteEditor({ noteId }: { noteId: string }) {
  const note = useNote(noteId)
  const autosave = useNoteAutosave(noteId)

  const initialContent = useMemo(() => note.data?.content ?? null, [note.data?.id])
  const initialTitle = note.data?.title ?? ''
  const [title, setTitle] = useState(initialTitle)

  useEffect(() => {
    setTitle(initialTitle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.data?.id])

  if (note.isPending) return <div style={{ opacity: 0.5 }}>Chargement…</div>
  if (note.isError) return <div style={{ color: '#ff6b6b' }}>Impossible de charger la note.</div>

  return (
    <article style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            autosave.schedule({ title: e.target.value })
          }}
          placeholder="Titre"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            fontSize: 28,
            fontWeight: 700,
            outline: 'none',
            flex: 1,
          }}
        />
        <SaveStatus status={autosave.status} onFlush={() => void autosave.flush()} />
      </header>

      <TiptapEditor
        key={noteId}
        noteId={noteId}
        initialContent={initialContent}
        onChange={(content) => autosave.schedule({ content })}
      />

      <AttachmentsPanel noteId={noteId} />
    </article>
  )
}

function SaveStatus({
  status,
  onFlush,
}: {
  status: AutosaveStatus
  onFlush: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, opacity: 0.6, minWidth: 80, textAlign: 'right' }}>
        {labelFor(status)}
      </span>
      <button
        type="button"
        onClick={onFlush}
        style={{
          background: 'rgba(91, 140, 255, 0.18)',
          border: '1px solid rgba(91, 140, 255, 0.3)',
          color: 'inherit',
          padding: '6px 10px',
          fontSize: 12,
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        Enregistrer
      </button>
    </div>
  )
}

function labelFor(s: AutosaveStatus): string {
  switch (s) {
    case 'idle':
      return ''
    case 'pending':
      return 'Modifications…'
    case 'saving':
      return 'Sauvegarde…'
    case 'saved':
      return 'Enregistré'
    case 'error':
      return 'Erreur'
  }
}

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
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

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

const listItemStyle: React.CSSProperties = {
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

const smallInputStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 4,
  color: 'inherit',
  padding: '4px 6px',
  fontSize: 12,
  outline: 'none',
}

const smallButtonStyle: React.CSSProperties = {
  background: '#5b8cff',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '0 8px',
  fontSize: 14,
  cursor: 'pointer',
}

const loadingStyle: React.CSSProperties = { opacity: 0.4, fontSize: 12 }
const emptyStyle: React.CSSProperties = { opacity: 0.4, fontSize: 12, padding: '4px 8px' }

function SearchBox({
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
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 4,
          color: 'inherit',
          padding: '6px 8px',
          fontSize: 12,
          outline: 'none',
        }}
      />
      {showResults && (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
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
                <span style={{ fontSize: 12, fontWeight: 500 }}>
                  {hit.title || '(sans titre)'}
                </span>
                {hit.snippet && (
                  <span
                    style={{ fontSize: 11, opacity: 0.5 }}
                    // The server returns << / >> markers around matches.
                    dangerouslySetInnerHTML={{
                      __html: highlightSnippet(hit.snippet),
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
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // The original << / >> become &lt;&lt; / &gt;&gt; — restore as <mark>
  return escaped
    .replace(/&lt;&lt;/g, '<mark style="background: rgba(91,140,255,0.3); color: inherit;">')
    .replace(/&gt;&gt;/g, '</mark>')
}
