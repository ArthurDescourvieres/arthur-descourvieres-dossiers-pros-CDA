import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { router } from './routes/index.js'

export const app = new Hono()

app.use('*', logger())
app.use('*', cors())

app.route('/api', router)
