import { io, Socket } from 'socket.io-client'
import { getAccessToken } from './api'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (socket) return socket
  socket = io('/', {
    autoConnect: true,
    auth: (cb) => {
      cb({ token: getAccessToken() ?? '' })
    },
    // Vite proxy in dev forwards both HTTP and WS at the same origin.
    transports: ['websocket', 'polling'],
  })
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
