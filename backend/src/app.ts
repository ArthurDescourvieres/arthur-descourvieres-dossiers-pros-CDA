import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { corsMiddleware, securityHeaders } from './middlewares/security.js'
import { router } from './routes/index.js'

export const app = new Hono()

// Middleware order (§7.1): logging -> CORS allow-list -> security headers -> routes.
app.use('*', logger())
app.use('*', corsMiddleware)
app.use('*', securityHeaders)

app.route('/api', router)
