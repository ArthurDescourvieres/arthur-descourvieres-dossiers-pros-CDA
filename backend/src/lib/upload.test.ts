import { describe, it, expect } from 'vitest'
import { ALLOWED_MIMES, looksLikeText } from './upload'

describe('upload whitelist (§7.3 — OWASP A03)', () => {
  it('allows text/plain and rejects image/gif', () => {
    expect(ALLOWED_MIMES.has('text/plain')).toBe(true)
    expect(ALLOWED_MIMES.has('image/gif')).toBe(false)
  })

  it('keeps the documented binary types', () => {
    for (const m of ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']) {
      expect(ALLOWED_MIMES.has(m)).toBe(true)
    }
  })
})

describe('looksLikeText (texte brut sans magic bytes)', () => {
  it('treats valid UTF-8 as text', () => {
    expect(looksLikeText(Buffer.from('Bonjour, café ☕', 'utf8'))).toBe(true)
  })

  it('rejects a buffer containing a NUL byte (binary)', () => {
    expect(looksLikeText(Buffer.from([0x48, 0x00, 0x49]))).toBe(false)
  })

  it('rejects invalid UTF-8 bytes', () => {
    expect(looksLikeText(Buffer.from([0xff, 0xfe, 0xfd]))).toBe(false)
  })

  it('rejects an empty buffer', () => {
    expect(looksLikeText(Buffer.from([]))).toBe(false)
  })
})
