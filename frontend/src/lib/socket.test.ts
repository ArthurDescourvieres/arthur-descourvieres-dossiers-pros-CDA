import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// io() is mocked so getSocket() can be tested without a real WebSocket. The spy
// is created via vi.hoisted so it is reachable from the hoisted vi.mock factory.
const { ioMock } = vi.hoisted(() => ({ ioMock: vi.fn() }))
vi.mock('socket.io-client', () => ({
  io: ioMock,
  Socket: class {},
}))

import { getSocket, disconnectSocket } from './socket'
import { setAccessToken } from './api'

type AuthCb = (data: { token: string }) => void

function fakeSocket() {
  return { disconnect: vi.fn() }
}

describe('socket singleton', () => {
  beforeEach(() => {
    setAccessToken(null)
    disconnectSocket() // reset the module-level singleton between tests
    ioMock.mockReset()
  })
  afterEach(() => {
    disconnectSocket()
    setAccessToken(null)
  })

  it('creates the socket once and reuses the same instance', () => {
    ioMock.mockReturnValue(fakeSocket())

    const first = getSocket()
    const second = getSocket()

    expect(ioMock).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('feeds the current access token to the auth handshake', async () => {
    setAccessToken('jwt-xyz')
    ioMock.mockReturnValue(fakeSocket())

    getSocket()
    const options = ioMock.mock.calls[0][1]
    const handshake = await new Promise<{ token: string }>((resolve) => {
      ;(options.auth as (cb: AuthCb) => void)(resolve)
    })

    expect(handshake).toEqual({ token: 'jwt-xyz' })
  })

  it('sends an empty token when no session is active', async () => {
    ioMock.mockReturnValue(fakeSocket())

    getSocket()
    const options = ioMock.mock.calls[0][1]
    const handshake = await new Promise<{ token: string }>((resolve) => {
      ;(options.auth as (cb: AuthCb) => void)(resolve)
    })

    expect(handshake).toEqual({ token: '' })
  })

  it('disconnects and drops the singleton so the next call reconnects', () => {
    const socket = fakeSocket()
    ioMock.mockReturnValue(socket)

    getSocket()
    disconnectSocket()
    getSocket()

    expect(socket.disconnect).toHaveBeenCalledTimes(1)
    expect(ioMock).toHaveBeenCalledTimes(2)
  })
})
