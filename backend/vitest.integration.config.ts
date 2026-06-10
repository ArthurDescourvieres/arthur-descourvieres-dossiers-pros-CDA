import { defineConfig } from 'vitest/config'
import { TEST_DATABASE_URL, TEST_REDIS_URL, TEST_JWT_SECRET } from './src/test/env.js'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
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
  },
})
