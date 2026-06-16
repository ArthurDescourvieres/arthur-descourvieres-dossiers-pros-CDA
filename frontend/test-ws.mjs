// Quick smoke test for the realtime endpoint.
// Run with: node frontend/test-ws.mjs
import { io as ioc } from './node_modules/socket.io-client/build/esm/index.js'

const API = 'http://localhost:3000'

async function http(path, opts = {}) {
  const res = await fetch(API + path, opts)
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
  return res.json()
}

async function register(suffix) {
  return http('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Tester ${suffix}`,
      email: `ws-${suffix}-${Date.now()}-${Math.random().toString(16).slice(2)}@test.local`,
      password: 'password123',
    }),
  })
}

async function authed(token, path, opts = {}) {
  return http(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  })
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const sock = ioc(API, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    })
    sock.on('connect', () => resolve(sock))
    sock.on('connect_error', (err) => reject(err))
  })
}

async function main() {
  console.log('--- registering two users')
  const a = await register('a')
  const b = await register('b')
  console.log('   a=', a.user.email)
  console.log('   b=', b.user.email)

  console.log('--- creating workspace + folder + note (owner: a)')
  const ws = await authed(a.accessToken, '/api/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name: 'WS Test' }),
  })
  // Add b as EDITOR
  await authed(a.accessToken, `/api/workspaces/${ws.id}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId: b.user.id, role: 'EDITOR' }),
  })
  const folder = await authed(a.accessToken, `/api/workspaces/${ws.id}/folders`, {
    method: 'POST',
    body: JSON.stringify({ name: 'Inbox' }),
  })
  const note = await authed(a.accessToken, `/api/workspaces/${ws.id}/folders/${folder.id}/notes`, {
    method: 'POST',
    body: JSON.stringify({ title: 'Shared', folderId: folder.id }),
  })
  console.log('   note=', note.id)

  console.log('--- bad token should reject:')
  try {
    await connect('invalid-token')
    console.log('   ❌ unexpected success')
  } catch (e) {
    console.log('   ✅ rejected:', e.message)
  }

  console.log('--- connecting both as valid users')
  const sa = await connect(a.accessToken)
  const sb = await connect(b.accessToken)
  console.log('   sa.id=', sa.id, ' sb.id=', sb.id)

  let bGotJoin = null
  let bGotLive = null
  let aGotJoin = null
  sb.on('presence:joined', (p) => (bGotJoin = p))
  sb.on('note:live', (u) => (bGotLive = u))
  sa.on('presence:joined', (p) => (aGotJoin = p))

  console.log('--- A joins note')
  await new Promise((res) => sa.emit('note:join', { noteId: note.id }, res))
  console.log('--- B joins note (A should see B)')
  const bJoinResp = await new Promise((res) => sb.emit('note:join', { noteId: note.id }, res))
  console.log('   B join ack:', bJoinResp)
  await new Promise((r) => setTimeout(r, 200))
  console.log('   A received presence:joined =', aGotJoin)

  console.log('--- A sends note:live, B should receive')
  sa.emit('note:live', {
    noteId: note.id,
    content: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello live' }] }],
    },
  })
  await new Promise((r) => setTimeout(r, 200))
  console.log('   B received note:live =', bGotLive ? 'yes' : 'no')

  console.log('--- B disconnects, A should receive presence:left')
  let aGotLeft = null
  sa.on('presence:left', (p) => (aGotLeft = p))
  sb.disconnect()
  await new Promise((r) => setTimeout(r, 300))
  console.log('   A received presence:left =', aGotLeft)

  sa.disconnect()
  console.log('--- done')
  process.exit(0)
}

main().catch((e) => {
  console.error('FAIL:', e)
  process.exit(1)
})
