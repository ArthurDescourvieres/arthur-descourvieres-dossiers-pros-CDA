import { useEffect, useMemo, useRef, useState } from 'react'
import { useNote } from '../../hooks/useWorkspaces'
import { useNoteAutosave, type AutosaveStatus } from '../../hooks/useNoteAutosave'
import { useNoteRealtime, type Presence } from '../../hooks/useNoteRealtime'
import { TiptapEditor } from '../TiptapEditor'
import { AttachmentsPanel } from '../AttachmentsPanel'
import type { TiptapDoc } from '../../lib/types'

export function NoteEditor({ noteId }: { noteId: string }) {
  const note = useNote(noteId)
  const autosave = useNoteAutosave(noteId)

  const initialContent = useMemo(() => note.data?.content ?? null, [note.data?.id])
  const initialTitle = note.data?.title ?? ''
  const [title, setTitle] = useState(initialTitle)
  const [remoteContent, setRemoteContent] = useState<TiptapDoc | null>(null)
  const isTypingRef = useRef(false)
  const typingTimeoutRef = useRef<number | null>(null)

  const markTyping = () => {
    isTypingRef.current = true
    if (typingTimeoutRef.current !== null) window.clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = window.setTimeout(() => {
      isTypingRef.current = false
    }, 1500)
  }

  const realtime = useNoteRealtime(noteId, {
    onRemoteLive: (u) => {
      // Skip if I'm currently typing — local edits take priority.
      if (isTypingRef.current) return
      if (u.title !== undefined) setTitle(u.title)
      if (u.content !== undefined) setRemoteContent(u.content)
    },
    onRemoteUpdate: (u) => {
      if (isTypingRef.current) return
      if (u.title !== undefined) setTitle(u.title)
      if (u.content !== undefined) setRemoteContent(u.content)
    },
  })

  useEffect(() => {
    setTitle(initialTitle)
    setRemoteContent(null)
    isTypingRef.current = false
    if (typingTimeoutRef.current !== null) window.clearTimeout(typingTimeoutRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.data?.id])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current !== null) window.clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  if (note.isPending) return <div style={{ opacity: 0.5 }}>Chargement…</div>
  if (note.isError)
    return <div style={{ color: 'var(--color-danger)' }}>Impossible de charger la note.</div>

  return (
    <article
      style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <header
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}
      >
        <input
          value={title}
          onChange={(e) => {
            markTyping()
            setTitle(e.target.value)
            autosave.schedule({ title: e.target.value })
            realtime.sendLive({ title: e.target.value })
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
        <PresenceAvatars presence={realtime.presence} />
        <SaveStatus status={autosave.status} onFlush={() => void autosave.flush()} />
      </header>

      <TiptapEditor
        key={noteId}
        noteId={noteId}
        initialContent={initialContent}
        remoteContent={remoteContent}
        onChange={(content) => {
          markTyping()
          autosave.schedule({ content })
          realtime.sendLive({ content })
        }}
      />

      <AttachmentsPanel noteId={noteId} />
    </article>
  )
}

function PresenceAvatars({ presence }: { presence: Presence[] }) {
  if (presence.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: -4 }}>
      {presence.slice(0, 5).map((p, i) => (
        <span
          key={p.socketId}
          title={p.name}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: colorForUser(p.userId),
            color: 'var(--color-on-accent)',
            display: 'inline-grid',
            placeItems: 'center',
            fontSize: 11,
            fontWeight: 600,
            border: '2px solid var(--color-bg)',
            marginLeft: i === 0 ? 0 : -8,
          }}
        >
          {initials(p.name)}
        </span>
      ))}
      {presence.length > 5 && (
        <span style={{ fontSize: 11, opacity: 0.6, alignSelf: 'center', marginLeft: 4 }}>
          +{presence.length - 5}
        </span>
      )}
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function colorForUser(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) & 0xfffffff
  const hue = hash % 360
  return `hsl(${hue}, 60%, 50%)`
}

function SaveStatus({ status, onFlush }: { status: AutosaveStatus; onFlush: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, opacity: 0.6, minWidth: 80, textAlign: 'right' }}>
        {labelFor(status)}
      </span>
      <button
        type="button"
        onClick={onFlush}
        style={{
          background: 'var(--color-accent-soft)',
          border: '1px solid var(--color-accent-border)',
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
