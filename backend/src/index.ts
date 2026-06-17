import { serve } from '@hono/node-server'
import { Server as IOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import type { Server as HttpServer } from 'node:http'
import { app } from './app.js'
import { redis } from './lib/redis.js'
import { logger } from './lib/logger.js'
import { registerRealtime } from './realtime/index.js'
import { startPurgeScheduler } from './jobs/purge-scheduler.js'
import { CORS_ORIGINS } from './lib/env.js'

const httpServer = serve({ fetch: app.fetch, port: 3000 }, () => {
  logger.info({ port: 3000 }, 'Server running on http://localhost:3000')
}) as unknown as HttpServer

const io = new IOServer(httpServer, {
  cors: { origin: CORS_ORIGINS, credentials: true },
})

const pubClient = redis.duplicate()
const subClient = redis.duplicate()
io.adapter(createAdapter(pubClient, subClient))

registerRealtime(io)

// Planificateur de purge RGPD des comptes désactivés (activé via PURGE_SCHEDULER=on).
startPurgeScheduler()
