import { describe, it, expect, vi, beforeEach } from 'vitest'

const { findUniqueNote, findUniqueAttachment } = vi.hoisted(() => ({
  findUniqueNote: vi.fn(),
  findUniqueAttachment: vi.fn(),
}))

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    note: { findUnique: findUniqueNote },
    attachment: { findUnique: findUniqueAttachment },
  },
}))

import { Hono } from 'hono'
import type { AppEnv } from '../types/hono.js'
import { resolveWorkspaceFromNote, resolveWorkspaceFromAttachment } from './rbac'

beforeEach(() => {
  findUniqueNote.mockReset()
  findUniqueAttachment.mockReset()
})

describe('resolveWorkspaceFromNote (anti-enumeration §6.3)', () => {
  it('returns a standardized 403 (not 404) when the note does not exist', async () => {
    findUniqueNote.mockResolvedValue(null)
    const app = new Hono<AppEnv>()
    app.get('/notes/:noteId', resolveWorkspaceFromNote, (c) => c.json({ ok: true }))

    const res = await app.request('/notes/missing')

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden' })
  })

  it('resolves the workspace and passes through when the note exists', async () => {
    findUniqueNote.mockResolvedValue({ folder: { workspaceId: 'ws-1' } })
    const app = new Hono<AppEnv>()
    app.get('/notes/:noteId', resolveWorkspaceFromNote, (c) =>
      c.json({ workspaceId: c.get('workspaceId') }),
    )

    const res = await app.request('/notes/n-1')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ workspaceId: 'ws-1' })
  })
})

describe('resolveWorkspaceFromAttachment (anti-enumeration §6.3)', () => {
  it('returns a standardized 403 (not 404) when the attachment does not exist', async () => {
    findUniqueAttachment.mockResolvedValue(null)
    const app = new Hono<AppEnv>()
    app.get('/attachments/:id', resolveWorkspaceFromAttachment, (c) => c.json({ ok: true }))

    const res = await app.request('/attachments/missing')

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden' })
  })
})
