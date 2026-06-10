import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // env.ts resolves JWT_SECRET at import time and throws if it is missing.
    // Provide a throwaway value so the test process can boot.
    env: {
      JWT_SECRET: 'test-only-jwt-secret-do-not-use-in-prod',
    },
  },
})
