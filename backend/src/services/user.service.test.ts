import { describe, it, expect, vi, beforeEach } from 'vitest'

const { userUpdate, userFindOrThrow, wmFindMany, noteFindMany, attachmentFindMany, logout } =
  vi.hoisted(() => ({
    userUpdate: vi.fn(),
    userFindOrThrow: vi.fn(),
    wmFindMany: vi.fn(),
    noteFindMany: vi.fn(),
    attachmentFindMany: vi.fn(),
    logout: vi.fn(),
  }))

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: { update: userUpdate, findUniqueOrThrow: userFindOrThrow },
    workspaceMember: { findMany: wmFindMany },
    note: { findMany: noteFindMany },
    attachment: { findMany: attachmentFindMany },
  },
}))
vi.mock('./auth.service.js', () => ({ authService: { logout } }))

import { userService } from './user.service'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('deactivateAccount — soft-delete RGPD', () => {
  it('marque le compte désactivé, bump tokenVersion et coupe la session courante', async () => {
    userUpdate.mockResolvedValue({})

    await userService.deactivateAccount('u1', 'refresh-tok')

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { deactivatedAt: expect.any(Date), tokenVersion: { increment: 1 } },
    })
    expect(logout).toHaveBeenCalledWith('refresh-tok')
  })

  it('n’appelle pas logout quand aucun refresh token n’est fourni', async () => {
    userUpdate.mockResolvedValue({})

    await userService.deactivateAccount('u1')

    expect(logout).not.toHaveBeenCalled()
  })
})

describe('exportUserData — portabilité RGPD', () => {
  it('agrège profil, workspaces, notes et pièces jointes avec lien de téléchargement', async () => {
    userFindOrThrow.mockResolvedValue({ id: 'u1', email: 'a@b.com', name: 'Alice' })
    wmFindMany.mockResolvedValue([
      { role: 'OWNER', joinedAt: new Date('2026-01-01'), workspace: { id: 'ws1', name: 'A' } },
    ])
    noteFindMany.mockResolvedValue([{ id: 'n1', title: 'Note' }])
    attachmentFindMany.mockResolvedValue([{ id: 'att1', filename: 'f.png' }])

    const result = await userService.exportUserData('u1')

    expect(result.user).toEqual({ id: 'u1', email: 'a@b.com', name: 'Alice' })
    expect(result.workspaces).toEqual([
      { id: 'ws1', name: 'A', role: 'OWNER', joinedAt: expect.any(Date) },
    ])
    expect(result.notes).toEqual([{ id: 'n1', title: 'Note' }])
    expect(result.attachments).toEqual([
      { id: 'att1', filename: 'f.png', downloadUrl: '/api/attachments/att1/file' },
    ])
    expect(result.exportedAt).toEqual(expect.any(String))
  })
})
