// Scénario 1 — propagation temps réel : N clients sur la même note, un émetteur
// pousse des `note:live` horodatés, les autres mesurent la latence de réception.
// Relève le vrai P95 de propagation (cible dossier < 500 ms, T-RT-01 / T-PERF-01).
//
// k6 ne parle pas nativement le protocole Socket.IO ; on utilise donc le vrai
// client `socket.io-client`, ce qui exerce exactement la même pile que le front.
//
// Pré-requis : stack démarrée + `npm install` dans benchmarks/.
// Lancement :
//   node benchmarks/realtime/note-live-load.mjs
//   BASE_URL=https://memo.derroce.com CLIENTS=50 DURATION_S=180 \
//     node benchmarks/realtime/note-live-load.mjs
import { io } from 'socket.io-client'
import { writeFileSync, mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const CLIENTS = Number(process.env.CLIENTS || 50)
const DURATION_S = Number(process.env.DURATION_S || 180)
const INTERVAL_MS = Number(process.env.INTERVAL_MS || 200)

const headers = { 'Content-Type': 'application/json' }
const post = async (path, token, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`)
  return res.json()
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[idx]
}

async function main() {
  console.log(`Seeding a note on ${BASE} …`)
  const { accessToken: token } = await post('/api/auth/register', null, {
    name: 'rt-bench',
    email: `rt-${Date.now()}@bench.local`,
    password: 'a-strong-passphrase-123',
  })
  const ws = await post('/api/workspaces', token, { name: 'RT Bench' })
  const folder = await post(`/api/workspaces/${ws.id}/folders`, token, { name: 'RT' })
  const note = await post(`/api/workspaces/${ws.id}/folders/${folder.id}/notes`, token, {
    title: 'rt',
    content: { type: 'doc', content: [] },
    folderId: folder.id,
  })
  console.log(`Note ${note.id} ready. Connecting ${CLIENTS} clients …`)

  const latencies = []
  const sockets = []

  await Promise.all(
    Array.from({ length: CLIENTS }, (_, i) => {
      const socket = io(BASE, { auth: { token }, transports: ['websocket'], forceNew: true })
      sockets.push(socket)
      const isReceiver = i !== 0
      if (isReceiver) {
        socket.on('note:live', (msg) => {
          const t0 = msg?.content?.ts
          if (typeof t0 === 'number') latencies.push(Date.now() - t0)
        })
      }
      return new Promise((resolve, reject) => {
        socket.on('connect_error', reject)
        socket.on('connect', () => socket.emit('note:join', { noteId: note.id }, () => resolve()))
      })
    }),
  )

  console.log(`All connected. Emitting note:live every ${INTERVAL_MS}ms for ${DURATION_S}s …`)
  const sender = sockets[0]
  const timer = setInterval(() => {
    sender.emit('note:live', { noteId: note.id, content: { type: 'doc', ts: Date.now() } })
  }, INTERVAL_MS)

  await new Promise((r) => setTimeout(r, DURATION_S * 1000))
  clearInterval(timer)
  await new Promise((r) => setTimeout(r, 1000)) // drain in-flight messages
  sockets.forEach((s) => s.close())

  latencies.sort((a, b) => a - b)
  const report = {
    base: BASE,
    clients: CLIENTS,
    durationSeconds: DURATION_S,
    intervalMs: INTERVAL_MS,
    samples: latencies.length,
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      max: latencies.at(-1) ?? 0,
      mean: latencies.length
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0,
    },
    measuredAt: new Date().toISOString(),
  }
  console.table(report.latencyMs)

  mkdirSync(new URL('../reports/', import.meta.url), { recursive: true })
  const out = new URL(`../reports/realtime-note-live-${Date.now()}.json`, import.meta.url)
  writeFileSync(out, JSON.stringify(report, null, 2))
  console.log(`Report written to ${out.pathname}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
