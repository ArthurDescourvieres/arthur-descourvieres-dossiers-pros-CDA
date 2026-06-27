import { defineConfig, devices } from '@playwright/test'

/**
 * Suite E2E locale (hors CI) — Chromium uniquement.
 *
 * Prérequis : la stack Docker doit déjà tourner (`docker compose up -d` à la
 * racine). Le front est piloté sur http://localhost:5173 et appelle l'API en
 * chemins relatifs (/api, /socket.io) proxifiés par Vite : aucune config d'URL
 * d'API ni de CORS n'est nécessaire côté tests.
 *
 * `globalSetup` sonde /api/health avant de lancer la suite et échoue vite, avec
 * un message clair, si la stack n'est pas joignable.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',

  // Les 4 specs sont indépendants (utilisateurs uniques par run) → parallélisme sûr.
  fullyParallel: true,
  forbidOnly: false,
  // 1 retry comme filet : absorbe une lenteur ponctuelle de la machine (la stack
  // Docker partage le CPU). Une vraie régression échoue les deux tentatives.
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
