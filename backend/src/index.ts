import { serve } from '@hono/node-server'
import { Server as IOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import type { Server as HttpServer } from 'node:http'
import { app } from './app.js'
import { redis } from './lib/redis.js'
import { registerRealtime } from './realtime/index.js'

const httpServer = serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server running on http://localhost:3000')
}) as unknown as HttpServer

const io = new IOServer(httpServer, {
  cors: { origin: '*', credentials: true },
})

const pubClient = redis.duplicate()
const subClient = redis.duplicate()
io.adapter(createAdapter(pubClient, subClient))

registerRealtime(io)
