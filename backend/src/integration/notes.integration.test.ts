import { describe, it, expect, vi } from 'vitest'

vi.mock('../lib/hibp.js', () => ({ isPasswordPwned: vi.fn(async () => false) }))

import { app } from '../app.js'

async function register(email: string): Promise<string> {
  const res = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: email, email, password: 'a-strong-passphrase-123' }),
  })
  const body = (await res.json()) as { accessToken: string }
  return body.accessToken
}

function authed(path: string, token: string, init: { method?: string; body?: unknown } = {}) {
  return app.request(path, {
    method: init.method ?? 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
}

async function seedNote(token: string): Promise<{ noteId: string }> {
  const ws = (await (
    await authed('/api/workspaces', token, { method: 'POST', body: { name: 'Workspace' } })
  ).json()) as { id: string }
  const folder = (await (
    await authed(`/api/workspaces/${ws.id}/folders`, token, { method: 'POST', body: { name: 'Folder' } })
  ).json()) as { id: string }
  const note = (await (
    await authed(`/api/workspaces/${ws.id}/folders/${folder.id}/notes`, token, {
      method: 'POST',
      body: { title: 'original', content: { type: 'doc', content: [] }, folderId: folder.id },
    })
  ).json()) as { id: string }
  return { noteId: note.id }
}

describe('notes integration (RBAC + uploads)', () => {
  it('rejects a PATCH from a non-member with 403, leaving the note unchanged (T-NOTE-01)', async () => {
    const owner = await register('owner@example.com')
    const { noteId } = await seedNote(owner)

    const outsider = await register('outsider@example.com')
    const patch = await authed(`/api/notes/${noteId}`, outsider, {
      method: 'PATCH',
      body: { title: 'hacked' },
    })
    expect(patch.status).toBe(403)

    const after = (await (await authed(`/api/notes/${noteId}`, owner)).json()) as { title: string }
    expect(after.title).toBe('original')
  })

  it('rejects an .exe renamed .png on magic bytes with 415 and persists nothing (T-UP-01)', async () => {
    const owner = await register('up@example.com')
    const { noteId } = await seedNote(owner)

    const fd = new FormData()
    // PE/DOS "MZ" header — a real executable, not the declared image/png.
    const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00])
    fd.append('file', new File([exeBytes], 'evil.png', { type: 'image/png' }))

    const res = await app.request(`/api/notes/${noteId}/attachments`, {
      method: 'POST',
      headers: { authorization: `Bearer ${owner}` },
      body: fd,
    })
    expect(res.status).toBe(415)

    const list = (await (await authed(`/api/notes/${noteId}/attachments`, owner)).json()) as unknown[]
    expect(list).toHaveLength(0)
  })
})
