import { useEffect, useRef, useState, useCallback } from 'react'
import { getSocket } from '../lib/socket'
import type { TiptapDoc } from '../lib/types'

export type Presence = {
  socketId: string
  userId: string
  name: string
}

type RemoteUpdate = {
  noteId: string
  content?: TiptapDoc
  title?: string
  updatedAt?: string
  senderSocketId?: string
  senderUserId?: string
}

type Options = {
  onRemoteUpdate?: (u: RemoteUpdate) => void
  onRemoteLive?: (u: RemoteUpdate) => void
}

export function useNoteRealtime(noteId: string | null, opts: Options = {}) {
  const [presence, setPresence] = useState<Presence[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cbRef = useRef(opts.onRemoteUpdate)
  cbRef.current = opts.onRemoteUpdate
  const liveCbRef = useRef(opts.onRemoteLive)
  liveCbRef.current = opts.onRemoteLive

  useEffect(() => {
    if (!noteId) {
      setPresence([])
      return
    }
    const socket = getSocket()
    let cancelled = false

    setError(null)
    setPresence([])

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onConnectError = (err: Error) => setError(err.message)

    const onJoined = (p: Presence & { noteId: string }) => {
      if (p.noteId !== noteId) return
      setPresence((prev) =>
        prev.some((x) => x.socketId === p.socketId)
          ? prev
          : [...prev, { socketId: p.socketId, userId: p.userId, name: p.name }],
      )
    }
    const onLeft = (p: { noteId: string; socketId: string }) => {
      if (p.noteId !== noteId) return
      setPresence((prev) => prev.filter((x) => x.socketId !== p.socketId))
    }
    const onUpdate = (u: RemoteUpdate) => {
      if (u.noteId !== noteId) return
      cbRef.current?.(u)
    }
    const onLive = (u: RemoteUpdate) => {
      if (u.noteId !== noteId) return
      liveCbRef.current?.(u)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('presence:joined', onJoined)
    socket.on('presence:left', onLeft)
    socket.on('note:update', onUpdate)
    socket.on('note:live', onLive)

    if (socket.connected) onConnect()

    socket.emit('note:join', { noteId }, (res: { ok: boolean; presence?: Presence[]; error?: string }) => {
      if (cancelled) return
      if (!res?.ok) {
        setError(res?.error ?? 'JOIN_FAILED')
        return
      }
      setPresence(res.presence ?? [])
    })

    return () => {
      cancelled = true
      socket.emit('note:leave', { noteId })
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('presence:joined', onJoined)
      socket.off('presence:left', onLeft)
      socket.off('note:update', onUpdate)
      socket.off('note:live', onLive)
    }
  }, [noteId])

  const sendLive = useCallback(
    (patch: { content?: TiptapDoc; title?: string }) => {
      if (!noteId) return
      const socket = getSocket()
      socket.emit('note:live', { noteId, ...patch })
    },
    [noteId],
  )

  return { presence, connected, error, sendLive }
}
