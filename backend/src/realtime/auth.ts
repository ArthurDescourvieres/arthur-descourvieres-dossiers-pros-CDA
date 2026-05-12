import { verify } from 'hono/jwt'
import type { Server, Socket } from 'socket.io'

const JWT_SECRET = process.env.JWT_SECRET ?? 'secret'

export type RealtimeSocketData = {
  userId: string
}

export function attachAuth(io: Server) {
  io.use(async (socket, next) => {
    try {
      const raw = socket.handshake.auth?.token
      if (typeof raw !== 'string' || raw.length === 0) {
        return next(new Error('UNAUTHENTICATED'))
      }
      const payload = (await verify(raw, JWT_SECRET, 'HS256')) as { sub?: string }
      if (typeof payload.sub !== 'string') {
        return next(new Error('UNAUTHENTICATED'))
      }
      ;(socket.data as RealtimeSocketData).userId = payload.sub
      next()
    } catch {
      next(new Error('UNAUTHENTICATED'))
    }
  })
}

export function getUserId(socket: Socket): string {
  return (socket.data as RealtimeSocketData).userId
}
