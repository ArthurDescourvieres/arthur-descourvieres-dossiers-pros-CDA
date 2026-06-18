// Connection strings for the docker-compose.test.yml services.
// Host port 5434 (not the spec's 5433, already taken on this machine).
export const TEST_DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5434/memo_test'
export const TEST_REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6380'
export const TEST_JWT_SECRET = 'integration-test-secret-not-for-production'
