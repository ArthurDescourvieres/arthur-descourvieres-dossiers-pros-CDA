import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkspaceRole } from '@prisma/client'

const {
  wsCreate,
  wsFindFirst,
  wsFindOrThrow,
  wsUpdate,
  wmCreate,
  wmFindUnique,
  wmFindMany,
  wmCount,
  wmFindOrThrow,
  txn,
  cachedJson,
  invalidateCache,
  workspaceCacheKey,
} = vi.hoisted(() => ({
  wsCreate: vi.fn(),
  wsFindFirst: vi.fn(),
  wsFindOrThrow: vi.fn(),
  wsUpdate: vi.fn(),
  wmCreate: vi.fn(),
  wmFindUnique: vi.fn(),
  wmFindMany: vi.fn(),
  wmCount: vi.fn(),
  wmFindOrThrow: vi.fn(),
  txn: vi.fn(),
  cachedJson: vi.fn(),
  invalidateCache: vi.fn(),
  workspaceCacheKey: vi.fn(),
}))

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    workspace: {
      create: wsCreate,
      findFirst: wsFindFirst,
      findUniqueOrThrow: wsFindOrThrow,
      update: wsUpdate,
    },
    workspaceMember: {
      create: wmCreate,
      findUnique: wmFindUnique,
      findMany: wmFindMany,
      count: wmCount,
      findUniqueOrThrow: wmFindOrThrow,
    },
    $transaction: txn,
  },
}))
vi.mock('../lib/storage.js', () => ({ storage: { removeMany: vi.fn() } }))
vi.mock('../lib/cache.js', () => ({
  invalidateWorkspaceCache: invalidateCache,
  cachedJson,
  workspaceCacheKey,
  WORKSPACE_CACHE_TTL: 60,
}))
vi.mock('../lib/logger.js', () => ({ securityLog: vi.fn() }))

import { workspaceService } from './workspace.service'

const PAGE = { limit: 50, offset: 0 }

beforeEach(() => {
  vi.clearAllMocks()
  // $transaction supporte deux formes : callback (createWorkspace) et tableau
  // d'opérations (getWorkspacesByUser).
  txn.mockImplementation((arg: unknown) =>
    typeof arg === 'function'
      ? (arg as (tx: unknown) => unknown)({
          workspace: { create: wsCreate },
          workspaceMember: { create: wmCreate },
        })
      : Promise.all(arg as Promise<unknown>[]),
  )
})

describe('createWorkspace — slug & adhésion OWNER', () => {
  it('crée le workspace et l’adhésion OWNER avec un slug dérivé du nom', async () => {
    wsFindFirst.mockResolvedValue(null)
    wsCreate.mockResolvedValue({ id: 'ws1', slug: 'mon-espace' })
    wmCreate.mockResolvedValue({})

    const result = await workspaceService.createWorkspace(
      { name: 'Mon Espace', description: 'desc' },
      'owner1',
    )

    expect(wsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'mon-espace', ownerId: 'owner1' }),
      }),
    )
    expect(wmCreate).toHaveBeenCalledWith({
      data: { workspaceId: 'ws1', userId: 'owner1', role: WorkspaceRole.OWNER },
    })
    expect(result).toEqual({ id: 'ws1', slug: 'mon-espace' })
  })

  it('suffixe le slug quand la base est déjà prise', async () => {
    wsFindFirst.mockResolvedValue({ id: 'existing', slug: 'mon-espace' })
    wsCreate.mockResolvedValue({ id: 'ws2' })
    wmCreate.mockResolvedValue({})

    await workspaceService.createWorkspace({ name: 'Mon Espace' }, 'owner1')

    const slug = wsCreate.mock.calls[0][0].data.slug as string
    expect(slug.startsWith('mon-espace-')).toBe(true)
  })
})

describe('getWorkspacesByUser — pagination', () => {
  it('renvoie les workspaces du membre avec son rôle, paginés', async () => {
    wmFindMany.mockResolvedValue([
      { role: WorkspaceRole.OWNER, workspace: { id: 'ws1', name: 'A', members: [] } },
    ])
    wmCount.mockResolvedValue(1)

    const result = await workspaceService.getWorkspacesByUser('u1', PAGE)

    expect(result).toEqual({
      items: [{ id: 'ws1', name: 'A', members: [], role: WorkspaceRole.OWNER }],
      total: 1,
      limit: 50,
      offset: 0,
    })
  })
})

describe('getWorkspaceById / getWorkspaceJsonById', () => {
  it('charge le workspace avec ses membres', async () => {
    wsFindOrThrow.mockResolvedValue({ id: 'ws1', members: [] })

    const result = await workspaceService.getWorkspaceById('ws1')

    expect(wsFindOrThrow).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'ws1' } }))
    expect(result).toEqual({ id: 'ws1', members: [] })
  })

  it('passe par le cache read-through (cachedJson) pour la lecture chaude', async () => {
    workspaceCacheKey.mockReturnValue('cache:workspace:ws1')
    wsFindOrThrow.mockResolvedValue({ id: 'ws1', members: [] })
    cachedJson.mockImplementation(
      async (_key: string, _ttl: number, produce: () => Promise<unknown>) => ({
        json: JSON.stringify(await produce()),
        hit: false,
      }),
    )

    const result = await workspaceService.getWorkspaceJsonById('ws1')

    expect(workspaceCacheKey).toHaveBeenCalledWith('ws1')
    expect(result).toEqual({ json: JSON.stringify({ id: 'ws1', members: [] }), hit: false })
  })
})

describe('updateWorkspace — invalidation du cache', () => {
  it('met à jour et invalide le cache du workspace', async () => {
    wsUpdate.mockResolvedValue({ id: 'ws1', name: 'Renommé' })

    const result = await workspaceService.updateWorkspace('ws1', { name: 'Renommé' })

    expect(wsUpdate).toHaveBeenCalledWith({ where: { id: 'ws1' }, data: { name: 'Renommé' } })
    expect(invalidateCache).toHaveBeenCalledWith('ws1')
    expect(result).toEqual({ id: 'ws1', name: 'Renommé' })
  })
})

describe('addMember — ajout & conflit', () => {
  it('ajoute un membre et invalide le cache', async () => {
    wmFindUnique.mockResolvedValue(null)
    wmCreate.mockResolvedValue({ id: 'm1', role: WorkspaceRole.VIEWER })

    const result = await workspaceService.addMember('ws1', 'u2', WorkspaceRole.VIEWER)

    expect(wmCreate).toHaveBeenCalledWith({
      data: { workspaceId: 'ws1', userId: 'u2', role: WorkspaceRole.VIEWER },
    })
    expect(invalidateCache).toHaveBeenCalledWith('ws1')
    expect(result).toEqual({ id: 'm1', role: WorkspaceRole.VIEWER })
  })

  it('refuse (CONFLICT) un utilisateur déjà membre', async () => {
    wmFindUnique.mockResolvedValue({ id: 'm1' })

    await expect(
      workspaceService.addMember('ws1', 'u2', WorkspaceRole.VIEWER),
    ).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(wmCreate).not.toHaveBeenCalled()
  })
})

describe('updateMemberRole — protection du propriétaire', () => {
  it('refuse (FORBIDDEN) de changer le rôle du propriétaire', async () => {
    wmFindOrThrow.mockResolvedValue({ role: WorkspaceRole.OWNER })

    await expect(
      workspaceService.updateMemberRole('ws1', 'owner1', WorkspaceRole.EDITOR),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(txn).not.toHaveBeenCalled()
  })
})
