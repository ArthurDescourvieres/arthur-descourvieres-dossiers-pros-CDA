import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkspaceRole, InvitationStatus } from '@prisma/client'

const { invCreate, invFindMany, invFindUnique, invUpdate, userFindUnique } = vi.hoisted(() => ({
  invCreate: vi.fn(),
  invFindMany: vi.fn(),
  invFindUnique: vi.fn(),
  invUpdate: vi.fn(),
  userFindUnique: vi.fn(),
}))

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    invitation: {
      create: invCreate,
      findMany: invFindMany,
      findUnique: invFindUnique,
      update: invUpdate,
    },
    user: { findUnique: userFindUnique },
  },
}))

import { invitationService } from './invitation.service'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createInvitation — résolution de l’invité', () => {
  it('crée l’invitation à partir d’un email (normalisé en minuscules)', async () => {
    invCreate.mockResolvedValue({ id: 'inv1' })

    await invitationService.createInvitation(
      'ws1',
      'Bob@Example.com',
      WorkspaceRole.EDITOR,
      'inviter1',
    )

    expect(invCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: 'ws1',
          email: 'bob@example.com',
          role: WorkspaceRole.EDITOR,
          invitedById: 'inviter1',
        }),
      }),
    )
  })

  it('résout un nom d’utilisateur vers son email', async () => {
    userFindUnique.mockResolvedValue({ email: 'Carol@Example.com' })
    invCreate.mockResolvedValue({ id: 'inv2' })

    await invitationService.createInvitation('ws1', 'carol', WorkspaceRole.VIEWER, 'inviter1')

    expect(userFindUnique).toHaveBeenCalledWith({ where: { name: 'carol' } })
    expect(invCreate.mock.calls[0][0].data.email).toBe('carol@example.com')
  })

  it('refuse (USER_NOT_FOUND) un nom d’utilisateur inconnu', async () => {
    userFindUnique.mockResolvedValue(null)

    await expect(
      invitationService.createInvitation('ws1', 'ghost', WorkspaceRole.VIEWER, 'inviter1'),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' })
    expect(invCreate).not.toHaveBeenCalled()
  })
})

describe('listPending', () => {
  it('renvoie les invitations en attente du workspace', async () => {
    invFindMany.mockResolvedValue([{ id: 'inv1' }])

    const result = await invitationService.listPending('ws1')

    expect(invFindMany).toHaveBeenCalledWith({
      where: { workspaceId: 'ws1', status: InvitationStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    })
    expect(result).toEqual([{ id: 'inv1' }])
  })
})

describe('revokeInvitation', () => {
  it('révoque une invitation du workspace', async () => {
    invFindUnique.mockResolvedValue({ id: 'inv1', workspaceId: 'ws1' })
    invUpdate.mockResolvedValue({})

    await invitationService.revokeInvitation('ws1', 'inv1')

    expect(invUpdate).toHaveBeenCalledWith({
      where: { id: 'inv1' },
      data: { status: InvitationStatus.REVOKED },
    })
  })

  it('refuse (NOT_FOUND) une invitation inexistante', async () => {
    invFindUnique.mockResolvedValue(null)

    await expect(invitationService.revokeInvitation('ws1', 'nope')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
    expect(invUpdate).not.toHaveBeenCalled()
  })

  it('refuse (NOT_FOUND) une invitation d’un autre workspace (anti-enumeration)', async () => {
    invFindUnique.mockResolvedValue({ id: 'inv1', workspaceId: 'autre-ws' })

    await expect(invitationService.revokeInvitation('ws1', 'inv1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
    expect(invUpdate).not.toHaveBeenCalled()
  })
})

describe('acceptInvitation — états refusés', () => {
  it('refuse (NOT_FOUND) une invitation révoquée', async () => {
    invFindUnique.mockResolvedValue({ id: 'inv1', status: InvitationStatus.REVOKED })

    await expect(invitationService.acceptInvitation('tok', 'u1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('refuse (CONFLICT) une invitation déjà acceptée', async () => {
    invFindUnique.mockResolvedValue({ id: 'inv1', status: InvitationStatus.ACCEPTED })

    await expect(invitationService.acceptInvitation('tok', 'u1')).rejects.toMatchObject({
      code: 'CONFLICT',
    })
  })
})
