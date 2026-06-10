import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // jsdom is the canonical DOM for DOMPurify and React Testing Library.
    // It needs Node's require(ESM) support for its css-color dependency, which
    // the test scripts enable via NODE_OPTIONS=--experimental-require-module
    // (a no-op on Node >= 22.12, where it is already unflagged).
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
