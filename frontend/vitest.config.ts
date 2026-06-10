import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // happy-dom rather than jsdom: jsdom fails to boot under Vitest 4 on
    // Windows / Node 22 (a CJS-requires-ESM error in its css-color dependency).
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
