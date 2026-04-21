# Notion-like App

Full-stack Notion-like application — React · Hono · Prisma · PostgreSQL · Redis.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite + TanStack Query + Tailwind CSS |
| Backend | Hono + TypeScript + Node.js (@hono/node-server) |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Health check | http://localhost:3000/api/health |

First run — apply DB migrations:

```bash
docker compose exec api npm run db:migrate
```

## Development without Docker

**Backend**

```bash
cd backend
npm install
cp ../.env.example .env   # adjust DATABASE_URL / REDIS_URL to local values
npm run db:generate
npm run db:migrate
npm run dev               # tsx watch — hot reload on port 3000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev               # Vite — hot reload on port 5173
```

## Useful commands

```bash
# Database
docker compose exec api npm run db:migrate    # run pending migrations
docker compose exec api npm run db:generate   # regenerate Prisma client
docker compose exec api npm run db:studio     # Prisma Studio on :5555

# Logs
docker compose logs -f api
docker compose logs -f web
```
