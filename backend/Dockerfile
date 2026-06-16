# syntax=docker/dockerfile:1
#
# Multi-stage image for the Memo API (Hono / Node.js 22).
#   - `development` : used by docker-compose.yml (bind mount + tsx watch).
#   - `builder`     : installs every dependency and compiles TypeScript.
#   - `production`  : minimal, non-root runtime with prod dependencies only.
#
# The production stage keeps the Prisma CLI (moved to "dependencies") so the
# one-shot `migrate` service can run `prisma migrate deploy` against the prod
# database before the API takes over.

# ---- Base ----------------------------------------------------------------
FROM node:22-alpine AS base
# OpenSSL is required by the Prisma query engine on Alpine (musl).
RUN apk add --no-cache openssl
WORKDIR /app

# ---- Development (docker-compose.yml -> target: development) --------------
FROM base AS development
ENV NODE_ENV=development
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- Builder: install all deps and compile to dist/ ----------------------
FROM base AS builder
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate \
 && npm run build

# ---- Production: minimal, non-root ---------------------------------------
FROM base AS production
ENV NODE_ENV=production

# Production dependencies only (Prisma CLI is in "dependencies" for migrations).
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Prisma schema + migrations, then generate the client against prod deps.
COPY prisma ./prisma
RUN npx prisma generate

# Compiled application.
COPY --from=builder /app/dist ./dist

# Uploads directory — a named volume is mounted here in production.
RUN mkdir -p /app/uploads

# Drop root privileges.
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs \
 && chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
CMD ["node", "dist/index.js"]
