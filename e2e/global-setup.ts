import { request } from '@playwright/test'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173'

/**
 * Garde-fou de pré-vol : la suite n'a de sens que si la stack tourne. On sonde
 * /api/health *via le proxy Vite* — un 200 prouve d'un coup que `web` (5173) ET
 * `api` (3000) répondent. On laisse jusqu'à 60s (utile juste après un
 * `docker compose up`), puis on échoue avec la marche à suivre.
 */
export default async function globalSetup(): Promise<void> {
  const ctx = await request.newContext()
  const deadline = Date.now() + 60_000
  let lastError = 'aucune réponse'

  while (Date.now() < deadline) {
    try {
      const res = await ctx.get(`${BASE}/api/health`, { timeout: 4000 })
      if (res.ok()) {
        await ctx.dispose()
        return
      }
      lastError = `HTTP ${res.status()}`
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  await ctx.dispose()
  throw new Error(
    `\n  Stack injoignable sur ${BASE} (${lastError}).\n` +
      `  Démarre-la d'abord depuis la racine du repo :\n\n` +
      `      docker compose up -d\n\n` +
      `  Puis attends que http://localhost:5173/api/health réponde {"status":"ok"}.\n`,
  )
}
