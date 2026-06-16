import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkspaceRole } from '@prisma/client'

const { findOrThrow, wmUpdate, wmDelete, userUpdate, txn } = vi.hoisted(() => ({
  findOrThrow: vi.fn(),
  wmUpdate: vi.fn(),
  wmDelete: vi.fn(),
  userUpdate: vi.fn(),
  txn: vi.fn(),
}))

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    workspaceMember: {
      findUniqueOrThrow: findOrThrow,
      update: wmUpdate,
      delete: wmDelete,
    },
    user: { update: userUpdate },
    $transaction: txn,
  },
}))

import { workspaceService } from './workspace.service'

beforeEach(() => {
  findOrThrow.mockReset()
  wmUpdate.mockReset()
  wmDelete.mockReset()
  userUpdate.mockReset()
  txn.mockReset()
})

describe('removeMember — protection du propriétaire (T-WS-01)', () => {
  it('throws CANNOT_REMOVE_OWNER and writes nothing when the target is the OWNER', async () => {
    findOrThrow.mockResolvedValue({ role: WorkspaceRole.OWNER })

    await expect(workspaceService.removeMember('ws1', 'owner1')).rejects.toMatchObject({
      code: 'CANNOT_REMOVE_OWNER',
    })

    // Aucune écriture : ni transaction, ni suppression, ni bump de tokenVersion.
    expect(txn).not.toHaveBeenCalled()
    expect(wmDelete).not.toHaveBeenCalled()
    expect(userUpdate).not.toHaveBeenCalled()
  })
})

describe('updateMemberRole — révocation de session du membre modifié (§5.5)', () => {
  it('bumps the member tokenVersion alongside the role change', async () => {
    findOrThrow.mockResolvedValue({ role: WorkspaceRole.VIEWER })
    wmUpdate.mockReturnValue('wm-update-op')
    userUpdate.mockReturnValue('user-update-op')
    txn.mockResolvedValue([{ id: 'm1', role: WorkspaceRole.EDITOR }, {}])

    const result = await workspaceService.updateMemberRole('ws1', 'user1', WorkspaceRole.EDITOR)

    expect(txn).toHaveBeenCalledOnce()
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user1' },
      data: { tokenVersion: { increment: 1 } },
    })
    expect(result).toEqual({ id: 'm1', role: WorkspaceRole.EDITOR })
  })
})
