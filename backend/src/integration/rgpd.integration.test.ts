import { describe, it, expect, vi } from 'vitest'

vi.mock('../lib/hibp.js', () => ({ isPasswordPwned: vi.fn(async () => false) }))

import { app } from '../app.js'
import { purgeService } from '../services/purge.service.js'

const PASSWORD = 'a-strong-passphrase-123'

async function registerFull(
  email: string,
): Promise<{ token: string; userId: string; cookie: string }> {
  const res = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: email, email, password: PASSWORD }),
  })
  const body = (await res.json()) as { accessToken: string; user: { id: string } }
  const list =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : ([res.headers.get('set-cookie')].filter(Boolean) as string[])
  const cookie = (list.find((c) => c.startsWith('refreshToken=')) ?? '').split(';')[0]!
  return { token: body.accessToken, userId: body.user.id, cookie }
}

// IP dédiée par test pour ne pas partager le compteur de rate-limit du login.
function login(email: string, ip: string) {
  return app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email, password: PASSWORD }),
  })
}

describe('RGPD — droit à l’effacement (T-RGPD-01)', () => {
  it('désactive le compte, révoque les sessions et refuse la reconnexion', async () => {
    const user = await registerFull('rgpd-delete@example.com')

    // Le refresh fonctionne tant que le compte est actif.
    const before = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: user.cookie },
    })
    expect(before.status).toBe(200)

    // DELETE /api/me : désactivation + grâce 30 j + révocation des sessions.
    const del = await app.request('/api/me', {
      method: 'DELETE',
      headers: { authorization: `Bearer ${user.token}`, cookie: user.cookie },
    })
    expect(del.status).toBe(204)

    // Le refresh courant est désormais refusé (tokenVersion bumpée + blacklist).
    const after = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: user.cookie },
    })
    expect(after.status).toBe(401)

    // Login refusé (403 DEACTIVATED) même avec le bon mot de passe.
    const relog = await login('rgpd-delete@example.com', '198.51.100.10')
    expect(relog.status).toBe(403)
    const body = (await relog.json()) as { code?: string }
    expect(body.code).toBe('DEACTIVATED')
  })

  it('exporte l’ensemble des données du compte en JSON (portabilité)', async () => {
    const user = await registerFull('rgpd-export@example.com')

    const res = await app.request('/api/me/export', {
      headers: { authorization: `Bearer ${user.token}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { user: { email: string }; workspaces: unknown[] }
    expect(body.user.email).toBe('rgpd-export@example.com')
    expect(Array.isArray(body.workspaces)).toBe(true)
  })

  it('purge définitivement un compte désactivé depuis plus de 30 jours', async () => {
    const user = await registerFull('rgpd-purge@example.com')
    // Workspace dont l'utilisateur est seul membre → supprimé à la purge.
    await app.request('/api/workspaces', {
      method: 'POST',
      headers: { authorization: `Bearer ${user.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Purge WS' }),
    })

    const del = await app.request('/api/me', {
      method: 'DELETE',
      headers: { authorization: `Bearer ${user.token}`, cookie: user.cookie },
    })
    expect(del.status).toBe(204)

    // 31 jours dans le futur → le compte devient éligible à la purge.
    const future = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)
    const result = await purgeService.purgeDeactivatedAccounts(future)
    expect(result.purged).toBeGreaterThanOrEqual(1)

    // Compte effacé : le login renvoie 401 (compte inconnu), pas 403 (désactivé).
    const relog = await login('rgpd-purge@example.com', '198.51.100.11')
    expect(relog.status).toBe(401)
  })
})
