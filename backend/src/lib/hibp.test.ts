import { describe, it, expect, afterEach, vi } from 'vitest'
import { isPasswordPwned } from './hibp'

// SHA-1('password') = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
const PASSWORD_SUFFIX = '1E4C9B93F3F0682250B6CF8331B7EE68FD8'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch(body: string, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, text: async () => body })),
  )
}

describe('isPasswordPwned (HIBP k-anonymity §5.3)', () => {
  it('returns true when the suffix is present with a non-zero count', async () => {
    stubFetch(`${PASSWORD_SUFFIX}:42\nABCDEF00000000000000000000000000000:7`)
    expect(await isPasswordPwned('password')).toBe(true)
  })

  it('returns false when the suffix is absent', async () => {
    stubFetch('ABCDEF00000000000000000000000000000:7')
    expect(await isPasswordPwned('password')).toBe(false)
  })

  it('treats a padding entry (count 0) as not pwned', async () => {
    stubFetch(`${PASSWORD_SUFFIX}:0`)
    expect(await isPasswordPwned('password')).toBe(false)
  })

  it('sends only the 5-char prefix, never the full hash (k-anonymity)', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, text: async () => '' }))
    vi.stubGlobal('fetch', fetchMock)

    await isPasswordPwned('password')

    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl.endsWith('/range/5BAA6')).toBe(true)
    expect(calledUrl).not.toContain(PASSWORD_SUFFIX)
  })

  it('fails open (returns false) on network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    expect(await isPasswordPwned('password')).toBe(false)
  })
})
