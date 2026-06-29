import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  userFindUnique,
  userCreate,
  userUpdate,
  userFindOrThrow,
  redisGet,
  redisSetex,
  hashPassword,
  verifyPassword,
  needsRehash,
  isPasswordPwned,
  securityLog,
  jwtSign,
  jwtVerify,
} = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  userFindOrThrow: vi.fn(),
  redisGet: vi.fn(),
  redisSetex: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  needsRehash: vi.fn(),
  isPasswordPwned: vi.fn(),
  securityLog: vi.fn(),
  jwtSign: vi.fn(),
  jwtVerify: vi.fn(),
}))

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: userFindUnique,
      create: userCreate,
      update: userUpdate,
      findUniqueOrThrow: userFindOrThrow,
    },
  },
}))
vi.mock('../lib/redis.js', () => ({
  redis: { get: redisGet, setex: redisSetex, flushdb: vi.fn(), quit: vi.fn() },
}))
vi.mock('../lib/password.js', () => ({ hashPassword, verifyPassword, needsRehash }))
vi.mock('../lib/hibp.js', () => ({ isPasswordPwned }))
vi.mock('../lib/logger.js', () => ({ securityLog }))
vi.mock('hono/jwt', () => ({ sign: jwtSign, verify: jwtVerify }))

import { authService } from './auth.service'

const USER = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice',
  password: 'argon2-hash',
  tokenVersion: 0,
  deactivatedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

const REGISTER_INPUT = { email: 'alice@example.com', name: 'Alice', password: 'S3cret!password' }

beforeEach(() => {
  vi.clearAllMocks()
  jwtSign.mockResolvedValue('signed-token')
})

describe('register', () => {
  it('crée le compte, hash le mot de passe et renvoie des tokens (cas nominal)', async () => {
    userFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    isPasswordPwned.mockResolvedValue(false)
    hashPassword.mockResolvedValue('new-hash')
    userCreate.mockResolvedValue(USER)

    const result = await authService.register(REGISTER_INPUT)

    expect(hashPassword).toHaveBeenCalledWith(REGISTER_INPUT.password)
    expect(userCreate).toHaveBeenCalledWith({
      data: { name: 'Alice', email: 'alice@example.com', password: 'new-hash' },
    })
    expect(result.accessToken).toBe('signed-token')
    expect(result.refreshToken).toBe('signed-token')
    expect(result.user).not.toHaveProperty('password')
    expect(result.user).toMatchObject({ id: 'u1', email: 'alice@example.com', name: 'Alice' })
  })

  it('refuse (CONFLICT) un email déjà utilisé', async () => {
    userFindUnique.mockResolvedValueOnce(USER)

    await expect(authService.register(REGISTER_INPUT)).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(userCreate).not.toHaveBeenCalled()
  })

  it('refuse (NAME_CONFLICT) un nom déjà utilisé', async () => {
    userFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(USER)

    await expect(authService.register(REGISTER_INPUT)).rejects.toMatchObject({
      code: 'NAME_CONFLICT',
    })
    expect(userCreate).not.toHaveBeenCalled()
  })

  it('refuse (PWNED) un mot de passe compromis (HIBP)', async () => {
    userFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    isPasswordPwned.mockResolvedValue(true)

    await expect(authService.register(REGISTER_INPUT)).rejects.toMatchObject({ code: 'PWNED' })
    expect(hashPassword).not.toHaveBeenCalled()
    expect(userCreate).not.toHaveBeenCalled()
  })
})

describe('login', () => {
  it('authentifie par email et renvoie des tokens (cas nominal)', async () => {
    userFindUnique.mockResolvedValue(USER)
    verifyPassword.mockResolvedValue(true)
    needsRehash.mockReturnValue(false)

    const result = await authService.login({ identifier: 'alice@example.com', password: 'pw' })

    expect(userFindUnique).toHaveBeenCalledWith({ where: { email: 'alice@example.com' } })
    expect(result.user).not.toHaveProperty('password')
    expect(result.accessToken).toBe('signed-token')
  })

  it('authentifie par nom quand l’identifiant ne contient pas @', async () => {
    userFindUnique.mockResolvedValue(USER)
    verifyPassword.mockResolvedValue(true)
    needsRehash.mockReturnValue(false)

    await authService.login({ identifier: 'Alice', password: 'pw' })

    expect(userFindUnique).toHaveBeenCalledWith({ where: { name: 'Alice' } })
  })

  it('met à jour un hash bcrypt hérité au login (rehash argon2id)', async () => {
    userFindUnique.mockResolvedValue(USER)
    verifyPassword.mockResolvedValue(true)
    needsRehash.mockReturnValue(true)
    hashPassword.mockResolvedValue('upgraded-hash')

    await authService.login({ identifier: 'alice@example.com', password: 'pw' })

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { password: 'upgraded-hash' },
    })
  })

  it('refuse (UNAUTHORIZED) un utilisateur inconnu et journalise l’échec', async () => {
    userFindUnique.mockResolvedValue(null)

    await expect(
      authService.login({ identifier: 'ghost@example.com', password: 'pw' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(securityLog).toHaveBeenCalledWith(
      'login_failed',
      expect.objectContaining({ reason: 'unknown_user' }),
    )
  })

  it('refuse (UNAUTHORIZED) un mot de passe invalide', async () => {
    userFindUnique.mockResolvedValue(USER)
    verifyPassword.mockResolvedValue(false)

    await expect(
      authService.login({ identifier: 'alice@example.com', password: 'bad' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(securityLog).toHaveBeenCalledWith(
      'login_failed',
      expect.objectContaining({ reason: 'bad_password' }),
    )
  })

  it('refuse (DEACTIVATED) un compte désactivé (RGPD)', async () => {
    userFindUnique.mockResolvedValue({ ...USER, deactivatedAt: new Date() })
    verifyPassword.mockResolvedValue(true)

    await expect(
      authService.login({ identifier: 'alice@example.com', password: 'pw' }),
    ).rejects.toMatchObject({ code: 'DEACTIVATED' })
    expect(securityLog).toHaveBeenCalledWith('login_deactivated', { userId: 'u1' })
  })
})

describe('refresh', () => {
  const futureExp = Math.floor(Date.now() / 1000) + 1000

  it('renvoie un nouvel access token quand le refresh est valide', async () => {
    jwtVerify.mockResolvedValue({ sub: 'u1', tokenVersion: 0, exp: futureExp })
    redisGet.mockResolvedValue(null)
    userFindUnique.mockResolvedValue({ ...USER, tokenVersion: 0 })

    const result = await authService.refresh('refresh-tok')

    expect(result.accessToken).toBe('signed-token')
  })

  it('refuse (UNAUTHORIZED) un token invalide/mal signé', async () => {
    jwtVerify.mockRejectedValue(new Error('bad signature'))

    await expect(authService.refresh('bad')).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(securityLog).toHaveBeenCalledWith('refresh_invalid')
  })

  it('refuse (UNAUTHORIZED) un token blacklisté (déconnexion)', async () => {
    jwtVerify.mockResolvedValue({ sub: 'u1', tokenVersion: 0, exp: futureExp })
    redisGet.mockResolvedValue('1')

    await expect(authService.refresh('blk')).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(securityLog).toHaveBeenCalledWith('refresh_blacklisted', { userId: 'u1' })
  })

  it('refuse (UNAUTHORIZED) quand la tokenVersion ne correspond plus (révocation globale)', async () => {
    jwtVerify.mockResolvedValue({ sub: 'u1', tokenVersion: 0, exp: futureExp })
    redisGet.mockResolvedValue(null)
    userFindUnique.mockResolvedValue({ ...USER, tokenVersion: 5 })

    await expect(authService.refresh('stale')).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(securityLog).toHaveBeenCalledWith('refresh_version_mismatch', { userId: 'u1' })
  })
})

describe('logout', () => {
  it('blackliste le refresh token jusqu’à son expiration', async () => {
    const exp = Math.floor(Date.now() / 1000) + 500
    jwtVerify.mockResolvedValue({ sub: 'u1', exp })

    await authService.logout('refresh-tok')

    expect(redisSetex).toHaveBeenCalledWith('bl:refresh-tok', expect.any(Number), '1')
  })

  it('ne fait rien si le token est déjà invalide', async () => {
    jwtVerify.mockRejectedValue(new Error('invalid'))

    await authService.logout('bad')

    expect(redisSetex).not.toHaveBeenCalled()
  })

  it('ne blackliste pas un token déjà expiré (ttl <= 0)', async () => {
    const exp = Math.floor(Date.now() / 1000) - 10
    jwtVerify.mockResolvedValue({ sub: 'u1', exp })

    await authService.logout('expired')

    expect(redisSetex).not.toHaveBeenCalled()
  })
})

describe('getMe', () => {
  it('renvoie le profil courant sans le mot de passe', async () => {
    userFindOrThrow.mockResolvedValue(USER)

    const result = await authService.getMe('u1')

    expect(userFindOrThrow).toHaveBeenCalledWith({ where: { id: 'u1' } })
    expect(result).not.toHaveProperty('password')
    expect(result).toMatchObject({ id: 'u1', email: 'alice@example.com' })
  })
})
