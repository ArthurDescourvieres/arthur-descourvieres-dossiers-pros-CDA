import argon2 from 'argon2'
import bcrypt from 'bcryptjs'

/**
 * Password hashing — argon2id with the OWASP-recommended parameters (§5.2):
 * 19 MiB of memory, 3 iterations, parallelism 1.
 *
 * Accounts created before the migration are stored as bcrypt hashes. They
 * remain verifiable here, and `needsRehash` flags them so the caller can
 * transparently upgrade them to argon2id on the next successful login.
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB (19456 KiB)
  timeCost: 3,
  parallelism: 1,
} as const

function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')
}

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS)
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  if (isBcryptHash(hash)) {
    return bcrypt.compare(plain, hash)
  }
  try {
    return await argon2.verify(hash, plain)
  } catch {
    // Malformed or unknown hash format — treat as a failed verification
    // rather than leaking the error to the caller.
    return false
  }
}

export function needsRehash(hash: string): boolean {
  if (isBcryptHash(hash)) return true
  return argon2.needsRehash(hash, ARGON2_OPTIONS)
}
