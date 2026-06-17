import { execSync } from 'node:child_process'
import { TEST_DATABASE_URL } from './env.js'

// Runs once before the integration suite: apply migrations to the fresh,
// tmpfs-backed test database brought up by docker-compose.test.yml.
export default function setup() {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  })
}
