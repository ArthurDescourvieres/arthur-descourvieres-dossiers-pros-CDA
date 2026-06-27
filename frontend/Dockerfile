# syntax=docker/dockerfile:1
#
# Multi-stage image for the Memo front-end.
#   - `development` : used by docker-compose.yml (Vite dev server).
#   - `builder`     : compiles the React/Vite app to static assets.
#   - `production`  : Caddy serves the static build AND reverse-proxies the API,
#                     so no dedicated Node/Nginx container is needed in prod.
#
# The app calls the API with relative paths (/api/*, /socket.io/*), so the build
# needs no build-time API URL: Caddy routes everything on the same origin.

# ---- Development (docker-compose.yml -> target: development) --------------
FROM node:22-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---- Builder: compile the Vite app to static assets ----------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Production: Caddy serves /srv and reverse-proxies api:3000 ----------
FROM caddy:2-alpine AS production
# Patch base-image OS packages (e.g. OpenSSL) to the latest Alpine patch level:
# the caddy:2-alpine tag lags behind fresh CVE fixes, so we upgrade at build time
# to keep the published image (and the Trivy scan) clean. libcap ships `setcap`,
# used below so an unprivileged user can still bind ports 80/443.
RUN apk upgrade --no-cache && apk add --no-cache libcap

COPY --from=builder /app/dist /srv
# The Caddyfile is provided as a read-only mount by docker-compose.prod.yml,
# so the domain/routing can change without rebuilding this image.

# Run Caddy as a non-root user. This image is the public entry point: Caddy
# binds the privileged ports 80/443 and terminates TLS (see the Caddyfile and
# the `caddy` service in docker-compose.prod.yml), so a bare `USER` would fail
# with "permission denied" when binding. Granting the binary CAP_NET_BIND_SERVICE
# lets an unprivileged process bind ports < 1024 — that capability is in Docker's
# default bounding set — so we drop root without running the whole container
# privileged or widening its runtime capability set.
RUN addgroup -S app \
  && adduser -S -D -H -G app app \
  && setcap 'cap_net_bind_service=+ep' /usr/bin/caddy \
  # Caddy persists certificates/ACME state under /data and autosaves the running
  # config under /config (XDG_DATA_HOME / XDG_CONFIG_HOME in the base image); the
  # static build lives in /srv. The non-root user must own all three. NOTE: a
  # named volume that already holds root-owned data from a previous root run
  # keeps that ownership — on an existing deployment, run `chown -R app:app` on
  # the caddy_data / caddy_config volumes (or recreate them) once after upgrading.
  && chown -R app:app /srv /data /config
USER app

EXPOSE 80 443
