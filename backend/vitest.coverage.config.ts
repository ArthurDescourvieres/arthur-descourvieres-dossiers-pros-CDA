import { defineConfig } from 'vitest/config'
import { TEST_DATABASE_URL, TEST_REDIS_URL, TEST_JWT_SECRET } from './src/test/env.js'

// Combined coverage across unit + integration tests in a single run, so the
// reported backend figure reflects what the suite actually exercises end-to-end.
// Integration tests need the docker test DB/Redis, so run this via
// `npm run test:coverage` (which boots docker-compose.test.yml first).
// Unit tests are harmless under the integration harness (the per-test TRUNCATE
// just no-ops for them).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    env: {
      JWT_SECRET: TEST_JWT_SECRET,
      DATABASE_URL: TEST_DATABASE_URL,
      REDIS_URL: TEST_REDIS_URL,
    },
    globalSetup: ['src/test/global-setup.ts'],
    setupFiles: ['src/test/setup-integration.ts'],
    // Integration tests share one database, so run them serially in one worker.
    fileParallelism: false,
    maxWorkers: 1,
    hookTimeout: 30000,
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/test/**', 'src/index.ts', 'src/**/*.d.ts'],
      // Seuils documentés (§18.5) : 70 % de lignes global, 85 % sur les
      // composants sensibles. Le run échoue si on passe sous la barre.
      thresholds: {
        lines: 70,
        'src/services/auth.service.ts': { lines: 85 },
        'src/services/workspace.service.ts': { lines: 85 },
        'src/services/attachment.service.ts': { lines: 85 },
        'src/middlewares/rbac.ts': { lines: 85 },
      },
    },
  },
})
