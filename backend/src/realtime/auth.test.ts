import { describe, it, expect, vi, beforeEach } from 'vitest'

const { jwtVerify } = vi.hoisted(() => ({ jwtVerify: vi.fn() }))

vi.mock('hono/jwt', () => ({ verify: jwtVerify }))

import { attachAuth, getUserId } from './auth'

// Capture le middleware d'authentification enregistré via io.use().
function buildMiddleware() {
  const use = vi.fn()
  attachAuth({ use } as never)
  return use.mock.calls[0][0] as (socket: unknown, next: (err?: Error) => void) => Promise<void>
}

function fakeSocket(token: unknown) {
  return { handshake: { auth: { token } }, data: {} as { userId?: string } }
}

beforeEach(() => {
  jwtVerify.mockReset()
})

describe('attachAuth — handshake socket.io', () => {
  it('attache userId et laisse passer quand le token est valide', async () => {
    jwtVerify.mockResolvedValue({ sub: 'u1' })
    const mw = buildMiddleware()
    const socket = fakeSocket('valid-token')
    const next = vi.fn()

    await mw(socket, next)

    expect(socket.data.userId).toBe('u1')
    expect(next).toHaveBeenCalledWith()
  })

  it('rejette (UNAUTHENTICATED) un handshake sans token', async () => {
    const mw = buildMiddleware()
    const next = vi.fn()

    await mw(fakeSocket(undefined), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'UNAUTHENTICATED' }))
    expect(jwtVerify).not.toHaveBeenCalled()
  })

  it('rejette (UNAUTHENTICATED) un token dont le payload n’a pas de sub', async () => {
    jwtVerify.mockResolvedValue({})
    const mw = buildMiddleware()
    const next = vi.fn()

    await mw(fakeSocket('token-sans-sub'), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'UNAUTHENTICATED' }))
  })

  it('rejette (UNAUTHENTICATED) un token invalide (verify lève)', async () => {
    jwtVerify.mockRejectedValue(new Error('bad signature'))
    const mw = buildMiddleware()
    const next = vi.fn()

    await mw(fakeSocket('mauvais'), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'UNAUTHENTICATED' }))
  })
})

describe('getUserId', () => {
  it('renvoie le userId stocké sur le socket', () => {
    expect(getUserId({ data: { userId: 'u9' } } as never)).toBe('u9')
  })
})
