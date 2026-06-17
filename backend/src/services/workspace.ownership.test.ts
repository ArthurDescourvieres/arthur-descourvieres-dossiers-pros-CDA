import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkspaceRole } from '@prisma/client'

const {
  wsFindOrThrow,
  wsUpdateTx,
  wsDelete,
  wmFindUnique,
  wmUpdateTx,
  attachmentFindMany,
  txn,
  removeMany,
  invalidateCache,
} = vi.hoisted(() => ({
  wsFindOrThrow: vi.fn(),
  wsUpdateTx: vi.fn(),
  wsDelete: vi.fn(),
  wmFindUnique: vi.fn(),
  wmUpdateTx: vi.fn(),
  attachmentFindMany: vi.fn(),
  txn: vi.fn(),
  removeMany: vi.fn(),
  invalidateCache: vi.fn(),
}))

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    workspace: { findUniqueOrThrow: wsFindOrThrow, delete: wsDelete },
    workspaceMember: { findUnique: wmFindUnique },
    attachment: { findMany: attachmentFindMany },
    $transaction: txn,
  },
}))
vi.mock('../lib/storage.js', () => ({ storage: { removeMany } }))
vi.mock('../lib/cache.js', () => ({
  invalidateWorkspaceCache: invalidateCache,
  cachedJson: vi.fn(),
  workspaceCacheKey: vi.fn(),
  WORKSPACE_CACHE_TTL: 60,
}))
vi.mock('../lib/logger.js', () => ({ securityLog: vi.fn() }))

import { workspaceService } from './workspace.service'

beforeEach(() => {
  vi.clearAllMocks()
  // $transaction en mode callback : exécute la fonction avec un client tx mocké.
  txn.mockImplementation((fn: (tx: unknown) => unknown) =>
    fn({
      workspace: { update: wsUpdateTx },
      workspaceMember: { update: wmUpdateTx },
    }),
  )
})

describe('transferOwnership — transfert de propriété', () => {
  it('bascule ownerId et les rôles (ancien → EDITOR, nouveau → OWNER)', async () => {
    wsFindOrThrow.mockResolvedValue({ ownerId: 'A' })
    wmFindUnique.mockResolvedValue({ id: 'mB', userId: 'B', role: WorkspaceRole.EDITOR })
    wmUpdateTx.mockResolvedValue({ id: 'mB', role: WorkspaceRole.OWNER })

    const result = await workspaceService.transferOwnership('ws1', 'B')

    expect(wsUpdateTx).toHaveBeenCalledWith({ where: { id: 'ws1' }, data: { ownerId: 'B' } })
    expect(result).toEqual({ id: 'mB', role: WorkspaceRole.OWNER })
    expect(invalidateCache).toHaveBeenCalledWith('ws1')
  })

  it('refuse (INVALID_TARGET) un transfert vers le propriétaire actuel', async () => {
    wsFindOrThrow.mockResolvedValue({ ownerId: 'A' })

    await expect(workspaceService.transferOwnership('ws1', 'A')).rejects.toMatchObject({
      code: 'INVALID_TARGET',
    })
    expect(txn).not.toHaveBeenCalled()
  })

  it('refuse (NOT_A_MEMBER) un transfert vers un non-membre', async () => {
    wsFindOrThrow.mockResolvedValue({ ownerId: 'A' })
    wmFindUnique.mockResolvedValue(null)

    await expect(workspaceService.transferOwnership('ws1', 'B')).rejects.toMatchObject({
      code: 'NOT_A_MEMBER',
    })
    expect(txn).not.toHaveBeenCalled()
  })
})

describe('deleteWorkspace — nettoyage du disque', () => {
  it('supprime les fichiers des pièces jointes du workspace après la suppression BDD', async () => {
    attachmentFindMany.mockResolvedValue([{ storedName: 'a.png' }, { storedName: 'b.pdf' }])
    wsDelete.mockResolvedValue({ id: 'ws1' })

    await workspaceService.deleteWorkspace('ws1')

    expect(removeMany).toHaveBeenCalledWith(['a.png', 'b.pdf'])
    expect(invalidateCache).toHaveBeenCalledWith('ws1')
  })
})
