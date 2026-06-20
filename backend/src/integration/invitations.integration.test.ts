import { describe, it, expect, vi } from 'vitest'

vi.mock('../lib/hibp.js', () => ({ isPasswordPwned: vi.fn(async () => false) }))

import { app } from '../app.js'
import { prisma } from '../lib/prisma.js'

async function register(
  email: string,
  name: string = email,
): Promise<{ token: string; userId: string }> {
  const res = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, email, password: 'a-strong-passphrase-123' }),
  })
  const body = (await res.json()) as { accessToken: string; user: { id: string } }
  return { token: body.accessToken, userId: body.user.id }
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

async function createWorkspace(token: string): Promise<string> {
  const ws = (await (
    await authed('/api/workspaces', token, { method: 'POST', body: { name: 'Workspace' } })
  ).json()) as { id: string }
  return ws.id
}

function invite(token: string, wsId: string, identifier: string, role = 'EDITOR') {
  return authed(`/api/workspaces/${wsId}/invitations`, token, {
    method: 'POST',
    body: { identifier, role },
  })
}

describe('invitations (§12)', () => {
  it('lets an invited user accept and become a member', async () => {
    const owner = await register('owner@ex.com')
    const wsId = await createWorkspace(owner.token)

    const inv = await invite(owner.token, wsId, 'invitee@ex.com', 'EDITOR')
    expect(inv.status).toBe(201)
    const { token: inviteToken } = (await inv.json()) as { token: string }
    expect(inviteToken).toBeTruthy()

    const invitee = await register('invitee@ex.com')
    const accept = await authed(`/api/invitations/${inviteToken}/accept`, invitee.token, {
      method: 'POST',
    })
    expect(accept.status).toBe(201)

    // The invitee is now a member and can read the workspace.
    const ws = await authed(`/api/workspaces/${wsId}`, invitee.token)
    expect(ws.status).toBe(200)
  })

  it('rejects acceptance when the email does not match (403)', async () => {
    const owner = await register('owner2@ex.com')
    const wsId = await createWorkspace(owner.token)
    const inv = await invite(owner.token, wsId, 'someone@ex.com', 'VIEWER')
    const { token: inviteToken } = (await inv.json()) as { token: string }

    const other = await register('other@ex.com')
    const accept = await authed(`/api/invitations/${inviteToken}/accept`, other.token, {
      method: 'POST',
    })
    expect(accept.status).toBe(403)
  })

  it('returns 404 for an unknown token', async () => {
    const user = await register('u@ex.com')
    const accept = await authed('/api/invitations/does-not-exist/accept', user.token, {
      method: 'POST',
    })
    expect(accept.status).toBe(404)
  })

  it('returns 410 for an expired invitation', async () => {
    const owner = await register('owner3@ex.com')
    const wsId = await createWorkspace(owner.token)
    const inv = await invite(owner.token, wsId, 'late@ex.com', 'EDITOR')
    const { id, token: inviteToken } = (await inv.json()) as { id: string; token: string }

    await prisma.invitation.update({
      where: { id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    })

    const invitee = await register('late@ex.com')
    const accept = await authed(`/api/invitations/${inviteToken}/accept`, invitee.token, {
      method: 'POST',
    })
    expect(accept.status).toBe(410)
  })

  it('lets an OWNER invite by username (pseudo), then the named user can accept', async () => {
    const owner = await register('owner-u@ex.com', 'owner-u')
    const wsId = await createWorkspace(owner.token)
    const invitee = await register('bob@ex.com', 'bob')

    // Invite by username, not email — resolved to the account's email server-side.
    const inv = await invite(owner.token, wsId, 'bob', 'EDITOR')
    expect(inv.status).toBe(201)
    const { token: inviteToken } = (await inv.json()) as { token: string }

    const accept = await authed(`/api/invitations/${inviteToken}/accept`, invitee.token, {
      method: 'POST',
    })
    expect(accept.status).toBe(201)
  })

  it('returns 404 when inviting an unknown username', async () => {
    const owner = await register('owner-u2@ex.com', 'owner-u2')
    const wsId = await createWorkspace(owner.token)
    const inv = await invite(owner.token, wsId, 'no-such-pseudo', 'EDITOR')
    expect(inv.status).toBe(404)
  })

  it('exposes pending invitation metadata via public GET (no auth)', async () => {
    const owner = await register('owner-peek@ex.com')
    const wsId = await createWorkspace(owner.token)
    const inv = await invite(owner.token, wsId, 'peek-invitee@ex.com', 'VIEWER')
    const { token: inviteToken } = (await inv.json()) as { token: string }

    // No Authorization header — the 32-byte token is itself the credential.
    const res = await app.request(`/api/invitations/${inviteToken}`)
    expect(res.status).toBe(200)
    const meta = (await res.json()) as Record<string, unknown>
    expect(meta.email).toBe('peek-invitee@ex.com')
    expect(meta.role).toBe('VIEWER')
    expect(meta.workspaceName).toBe('Workspace')
    // Must not echo the token back to the public.
    expect(meta).not.toHaveProperty('token')
  })

  it('returns 404 metadata for a revoked invitation', async () => {
    const owner = await register('owner-peek2@ex.com')
    const wsId = await createWorkspace(owner.token)
    const inv = await invite(owner.token, wsId, 'peek2@ex.com', 'EDITOR')
    const { id, token: inviteToken } = (await inv.json()) as { id: string; token: string }

    await authed(`/api/workspaces/${wsId}/invitations/${id}`, owner.token, { method: 'DELETE' })

    const res = await app.request(`/api/invitations/${inviteToken}`)
    expect(res.status).toBe(404)
  })

  it('returns 404 metadata for an unknown token', async () => {
    const res = await app.request('/api/invitations/nope-not-a-real-token')
    expect(res.status).toBe(404)
  })
})
