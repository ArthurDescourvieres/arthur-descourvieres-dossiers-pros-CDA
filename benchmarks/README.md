# Benchmarks — charge & temps réel

Deux scénarios pour relever les **vrais** P95 cités dans le dossier. Aucun chiffre
ne doit figurer dans le dossier tant que la colonne « mesuré » ci-dessous est vide.

| Scénario | Outil | Cible dossier | Mesuré | Date |
|---|---|---|---|---|
| GET `/api/workspaces/:id` @ 100 req/s (T-PERF-01) | k6 | P95 < 200 ms | _à mesurer_ | — |
| Cache `cache:workspace:<id>` (taux de HIT) | k6 (`X-Cache`) | > 90 % HIT | _à mesurer_ | — |
| 50 clients `note:live`, 3 min (T-RT-01) | socket.io-client | P95 < 500 ms | _à mesurer_ | — |

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
