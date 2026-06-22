# Benchmarks — charge & temps réel

Deux scénarios pour relever les **vrais** P95 cités dans le dossier. Aucun chiffre
ne doit figurer dans le dossier tant que la colonne « mesuré » ci-dessous est vide.

| Scénario | Outil | Cible dossier | Mesuré | Date |
|---|---|---|---|---|
| GET `/api/workspaces/:id` @ 100 req/s (T-PERF-01) | k6 | P95 < 200 ms | **P95 = 21,84 ms** (0 % d'erreur, 6 000 req) | 2026-06-22 |
| Cache `cache:workspace:<id>` (taux de HIT) | k6 (`X-Cache`) | > 90 % HIT | **99,95 % HIT** (5 997 HIT / 3 MISS) | 2026-06-22 |
| 50 clients `note:live`, 3 min (T-RT-01) | socket.io-client | P95 < 500 ms | **P95 = 16 ms** (p50 11 / p99 28 ms, 40 278 éch.) | 2026-06-22 |

> **Contexte de mesure.** Relevés en **local** sur Docker Desktop / Windows
> (`BASE_URL=http://localhost:3000`), client de charge et stack sur la même
> machine — ce n'est **pas** un environnement de prod. Les valeurs sont donc des
> bornes hautes optimistes (pas de latence réseau) à la fois généreuses (pas de
> RTT internet) et pessimistes (CPU partagé client+serveur). Rapports figés :
> [`reports/rest-workspace-20260622.json`](reports/rest-workspace-20260622.json)
> et [`reports/realtime-note-live-1782131140486.json`](reports/realtime-note-live-1782131140486.json).
>
> Sur le temps réel, le `max` brut (~254 s) est une **anomalie de mesure**
> (supérieure à la durée du run → artefact d'event-loop/reconnexion du harness
> mono-process) qui gonfle la moyenne ; elle n'affecte pas les percentiles
> P50/P95/P99 retenus.

## Pré-requis

- La stack tourne et est joignable (`BASE_URL`, défaut `http://localhost:3000`).
- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) installé pour le scénario REST.
- `npm install` dans `benchmarks/` pour le harness temps réel (Node ≥ 22, `socket.io-client`).

> Conformément à la règle d'or du ROADMAP, ces scénarios ne sont **pas** lancés
> automatiquement : ils exigent une stack vivante. On les déroule à la main, on
> reporte le P95 réel dans le tableau, puis dans le dossier.

## Scénario REST (k6)

```bash
k6 run benchmarks/k6/rest-workspace.js
# ou, en figeant un rapport horodaté :
BASE_URL=http://localhost:3000 RATE=100 DURATION=1m \
  k6 run --summary-export=benchmarks/reports/rest-workspace-$(date +%Y%m%d).json \
  benchmarks/k6/rest-workspace.js
```

Lire `http_req_duration p(95)` (seuil 200 ms) et le ratio `cache_hits` / `cache_misses`.

## Scénario temps réel (Socket.IO)

```bash
cd benchmarks && npm install && cd ..
CLIENTS=50 DURATION_S=180 node benchmarks/realtime/note-live-load.mjs
```

Le script crée une note jetable, connecte `CLIENTS` clients, fait pousser des
`note:live` horodatés par l'un d'eux et mesure la latence de réception chez les
autres. Le P95 s'affiche et un JSON est écrit dans `benchmarks/reports/`.

## Rapports

Les rapports générés sont **versionnés** dans `benchmarks/reports/` : ils sont la
preuve affichable derrière chaque chiffre du dossier.
