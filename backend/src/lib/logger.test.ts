import { describe, it, expect, vi } from 'vitest'
import pino from 'pino'
import { loggerOptions, logger, securityLog } from './logger.js'

describe('logger redaction (§7 — never log secrets)', () => {
  it('censors password / token / authorization / cookie wherever they appear', () => {
    const lines: Record<string, unknown>[] = []
    const stream = {
      write: (s: string) => {
        lines.push(JSON.parse(s))
      },
    }
    const log = pino(
      { ...loggerOptions, level: 'info' },
      stream as unknown as NodeJS.WritableStream,
    )

    log.info(
      {
        password: 'hunter2',
        user: { token: 'tok', accessToken: 'acc', refreshToken: 'ref' },
        req: { headers: { authorization: 'Bearer leaked', cookie: 'refreshToken=leaked' } },
      },
      'msg',
    )

    const line = lines[0]! as {
      password: string
      user: { token: string; accessToken: string; refreshToken: string }
      req: { headers: { authorization: string; cookie: string } }
    }
    expect(line.password).toBe('[REDACTED]')
    expect(line.user.token).toBe('[REDACTED]')
    expect(line.user.accessToken).toBe('[REDACTED]')
    expect(line.user.refreshToken).toBe('[REDACTED]')
    expect(line.req.headers.authorization).toBe('[REDACTED]')
    expect(line.req.headers.cookie).toBe('[REDACTED]')
    // No secret value survives anywhere in the serialized line.
    expect(JSON.stringify(line)).not.toContain('leaked')
    expect(JSON.stringify(line)).not.toContain('hunter2')
  })
})

describe('securityLog', () => {
  it('emits a warn line tagged security:true with the event and data', () => {
    const spy = vi.spyOn(logger, 'warn').mockImplementation(() => true as never)
    securityLog('login_failed', { email: 'a@b.c' })
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ security: true, event: 'login_failed', email: 'a@b.c' }),
      'security:login_failed',
    )
    spy.mockRestore()
  })
})
