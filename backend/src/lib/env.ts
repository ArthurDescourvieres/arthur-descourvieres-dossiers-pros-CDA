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

/**
 * Public base URL of the app, used to build links inside transactional e-mails
 * (e.g. the invitation link). Trailing slash is stripped so concatenation is
 * predictable. Defaults to the first CORS origin in dev.
 */
export const APP_URL = (process.env.APP_URL ?? CORS_ORIGINS[0] ?? 'http://localhost:5173').replace(
  /\/+$/,
  '',
)

/**
 * Transactional e-mail (Brevo SMTP). Every field is optional: when host/user/
 * key are missing the mailer becomes a no-op (see lib/mailer), so dev and tests
 * run without a provider and invitations still work via the copy-link fallback.
 */
export const MAIL = {
  host: process.env.SMTP_HOST ?? '',
  port: Number(process.env.SMTP_PORT ?? '587'),
  user: process.env.SMTP_USER ?? '',
  pass: process.env.SMTP_KEY ?? '',
  from: process.env.MAIL_FROM ?? 'Memo <noreply@localhost>',
}

/** True only when SMTP is fully configured; gates every send. */
export const MAIL_ENABLED = Boolean(MAIL.host && MAIL.user && MAIL.pass)
