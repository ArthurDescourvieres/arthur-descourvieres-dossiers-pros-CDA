import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // jsdom is the canonical DOM for DOMPurify and React Testing Library.
    // It needs Node's require(ESM) support for its css-color dependency, which
    // the test scripts enable via NODE_OPTIONS=--experimental-require-module
    // (a no-op on Node >= 22.12, where it is already unflagged).
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/vite-env.d.ts', 'src/**/*.d.ts'],
      // Cible front 62 % (dossier) — pas de seuil bloquant pour l'instant,
      // les tests de hooks/composants arrivent en P3.
    },
  },
})
