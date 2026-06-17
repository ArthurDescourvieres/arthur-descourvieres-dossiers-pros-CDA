import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { corsMiddleware, securityHeaders } from './middlewares/security.js'
import { logger, requestLogger } from './lib/logger.js'
import { router } from './routes/index.js'

export const app = new Hono()

// Middleware order (§7.1): structured logging -> CORS allow-list -> security
// headers -> routes. requestLogger replaces hono/logger (Pino, OWASP A09).
app.use('*', requestLogger)
app.use('*', corsMiddleware)
app.use('*', securityHeaders)

// Central error boundary: preserve framework HTTPExceptions (e.g. the JWT
// middleware's 401) but never leak an unhandled error's stack to the client —
// log it server-side and return a generic 500.
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  logger.error(
    { err: { message: err.message, stack: err.stack }, path: c.req.path, method: c.req.method },
    'unhandled error',
  )
  return c.json({ error: 'Internal Server Error' }, 500)
})

app.route('/api', router)
