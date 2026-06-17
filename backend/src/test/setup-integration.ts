import { beforeEach, afterAll } from 'vitest'
import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'

// Truncated in FK-safe order via CASCADE before every test, so each case is
// independent (§18.2). Redis is flushed too, resetting rate-limit counters.
const TABLES = [
  'Permission',
  'Invitation',
  'Attachment',
  'Note',
  'Folder',
  'WorkspaceMember',
  'Workspace',
  'User',
]

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`,
  )
  await redis.flushdb()
})

afterAll(async () => {
  await prisma.$disconnect()
  await redis.quit()
})
