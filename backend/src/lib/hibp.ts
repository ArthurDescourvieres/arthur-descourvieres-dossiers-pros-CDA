import { createHash } from 'node:crypto'

const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range/'

/**
 * Have I Been Pwned k-anonymity check (§5.3).
 *
 * Only the first 5 characters of the password's SHA-1 are sent to the API;
 * the 35-character suffix is compared locally, so neither the password nor
 * its full hash ever leaves the server. `Add-Padding` obscures the real
 * result set, so padding entries (count 0) must be ignored.
 *
 * Fails open (returns false) on any network/HTTP error: a third-party outage
 * must not block all sign-ups. The minimum-length policy still applies.
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
  const sha1 = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase()
  const prefix = sha1.slice(0, 5)
  const suffix = sha1.slice(5)

  try {
    const res = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    })
    if (!res.ok) return false

    const body = await res.text()
    for (const line of body.split('\n')) {
      const [hashSuffix, countStr] = line.split(':')
      if (hashSuffix?.trim().toUpperCase() === suffix) {
        return Number.parseInt(countStr ?? '0', 10) > 0
      }
    }
    return false
  } catch {
    return false
  }
}
