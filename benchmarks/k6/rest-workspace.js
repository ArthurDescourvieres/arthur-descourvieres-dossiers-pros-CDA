// k6 — Scénario 2 : tenue de GET /api/workspaces/:id sous 100 req/s.
//
// Vérifie le P95 REST (< 200 ms, T-PERF-01) et l'efficacité du cache Redis
// (`cache:workspace:<id>`) via l'en-tête X-Cache exposé par le contrôleur.
//
// Lancement (stack démarrée) :
//   k6 run benchmarks/k6/rest-workspace.js
//   BASE_URL=https://memo.derroce.com RATE=100 DURATION=1m \
//     k6 run --summary-export=benchmarks/reports/rest-workspace-$(date +%Y%m%d).json \
//     benchmarks/k6/rest-workspace.js
import http from 'k6/http'
import { check } from 'k6'
import { Counter } from 'k6/metrics'

const BASE = __ENV.BASE_URL || 'http://localhost:3000'
const cacheHits = new Counter('cache_hits')
const cacheMisses = new Counter('cache_misses')

export const options = {
  scenarios: {
    workspace_reads: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.RATE || 100), // requêtes par seconde
      timeUnit: '1s',
      duration: __ENV.DURATION || '1m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<200'], // cible dossier : P95 REST < 200 ms
  },
}

// setup() s'exécute une fois : crée un compte + un workspace, renvoie le token
// et l'id que chaque itération va lire.
export function setup() {
  const email = `k6-${Date.now()}@bench.local`
  const reg = http.post(
    `${BASE}/api/auth/register`,
    JSON.stringify({ name: 'k6', email, password: 'a-strong-passphrase-123' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
  check(reg, { 'register 201': (r) => r.status === 201 })
  const token = reg.json('accessToken')

  const auth = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  const ws = http.post(`${BASE}/api/workspaces`, JSON.stringify({ name: 'Bench WS' }), auth)
  check(ws, { 'workspace 201': (r) => r.status === 201 })

  return { token, wsId: ws.json('id') }
}

export default function (data) {
  const res = http.get(`${BASE}/api/workspaces/${data.wsId}`, {
    headers: { Authorization: `Bearer ${data.token}` },
  })
  check(res, { 'status 200': (r) => r.status === 200 })

  const xCache = res.headers['X-Cache']
  if (xCache === 'HIT') cacheHits.add(1)
  else if (xCache === 'MISS') cacheMisses.add(1)
}
