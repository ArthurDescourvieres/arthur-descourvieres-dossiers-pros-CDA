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
# to keep the published image (and the Trivy scan) clean.
RUN apk upgrade --no-cache
COPY --from=builder /app/dist /srv
# The Caddyfile is provided as a read-only mount by docker-compose.prod.yml,
# so the domain/routing can change without rebuilding this image.
EXPOSE 80 443
