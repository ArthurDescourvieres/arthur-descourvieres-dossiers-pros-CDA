import { describe, it, expect, vi } from 'vitest'

vi.mock('../lib/hibp.js', () => ({ isPasswordPwned: vi.fn(async () => false) }))

import { app } from '../app.js'

async function registerFull(email: string): Promise<{ token: string; userId: string; cookie: string }> {
  const res = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: email, email, password: 'a-strong-passphrase-123' }),
  })
  const body = (await res.json()) as { accessToken: string; user: { id: string } }
  const list =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : ([res.headers.get('set-cookie')].filter(Boolean) as string[])
  const cookie = (list.find((c) => c.startsWith('refreshToken=')) ?? '').split(';')[0]!
  return { token: body.accessToken, userId: body.user.id, cookie }
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

describe('workspace ownership & membership', () => {
  it('stamps the creator as owner on workspace creation (ownerId)', async () => {
    const owner = await registerFull('owner3@example.com')
    const ws = (await (
      await authed('/api/workspaces', owner.token, { method: 'POST', body: { name: 'Owned WS' } })
    ).json()) as { id: string; ownerId: string }

    expect(ws.ownerId).toBe(owner.userId)
  })

  it('revokes a removed member’s sessions by bumping tokenVersion (§5.5)', async () => {
    const owner = await registerFull('owner2@example.com')
    const ws = (await (
      await authed('/api/workspaces', owner.token, { method: 'POST', body: { name: 'Team WS' } })
    ).json()) as { id: string }

    const member = await registerFull('member@example.com')
    const add = await authed(`/api/workspaces/${ws.id}/members`, owner.token, {
      method: 'POST',
      body: { userId: member.userId, role: 'EDITOR' },
    })
    expect(add.status).toBe(201)

    // The member can refresh while still a member.
    const before = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: member.cookie },
    })
    expect(before.status).toBe(200)

    const remove = await authed(`/api/workspaces/${ws.id}/members/${member.userId}`, owner.token, {
      method: 'DELETE',
    })
    expect(remove.status).toBe(204)

    // After removal, the member's old refresh token is rejected.
    const after = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: member.cookie },
    })
    expect(after.status).toBe(401)
  })
})
