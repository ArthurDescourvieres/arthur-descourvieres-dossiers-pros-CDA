/**
 * Centralised, fail-fast environment configuration.
 *
 * Per the security spec (§5.1) the application must refuse to start when a
 * required secret is missing, rather than silently falling back to a default
 * such as `'secret'`. Importing this module at boot therefore throws if
 * JWT_SECRET is absent — failing fast instead of running with a known key.
 */

export function requireEnv(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[name]
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const JWT_SECRET = requireEnv('JWT_SECRET')

/**
 * Allowed CORS origins (comma-separated). Defaults to the Vite dev origin so
 * local development works out of the box; set CORS_ORIGINS in production.
 */
export const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0)
