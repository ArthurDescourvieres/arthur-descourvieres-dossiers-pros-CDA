import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  folderFindOrThrow,
  folderFindUnique,
  folderUpdate,
  folderFindMany,
  folderUpdateMany,
  noteUpdateMany,
  txn,
} = vi.hoisted(() => ({
  folderFindOrThrow: vi.fn(),
  folderFindUnique: vi.fn(),
  folderUpdate: vi.fn(),
  folderFindMany: vi.fn(),
  folderUpdateMany: vi.fn(),
  noteUpdateMany: vi.fn(),
  txn: vi.fn(),
}))

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    folder: {
      findUniqueOrThrow: folderFindOrThrow,
      findUnique: folderFindUnique,
      update: folderUpdate,
      findMany: folderFindMany,
      updateMany: folderUpdateMany,
    },
    note: { updateMany: noteUpdateMany },
    $transaction: txn,
  },
}))

import { folderService } from './folder.service'

beforeEach(() => {
  folderFindOrThrow.mockReset()
  folderFindUnique.mockReset()
  folderUpdate.mockReset()
  folderFindMany.mockReset()
  folderUpdateMany.mockReset()
  noteUpdateMany.mockReset()
  txn.mockReset()
})

describe('moveFolder — déplacement & anti-cycle', () => {
  it('déplace le dossier sous un parent du même workspace', async () => {
    folderFindOrThrow.mockResolvedValue({ workspaceId: 'ws1' })
    folderFindUnique
      .mockResolvedValueOnce({ workspaceId: 'ws1' }) // validation de la cible
      .mockResolvedValueOnce({ parentId: null }) // remontée anti-cycle (1 niveau)
    folderUpdate.mockResolvedValue({ id: 'f1', parentId: 'f2' })

    await folderService.moveFolder('f1', 'f2')

    expect(folderUpdate).toHaveBeenCalledWith({ where: { id: 'f1' }, data: { parentId: 'f2' } })
  })

  it('détache à la racine quand la cible est nulle', async () => {
    folderFindOrThrow.mockResolvedValue({ workspaceId: 'ws1' })
    folderUpdate.mockResolvedValue({ id: 'f1', parentId: null })

    await folderService.moveFolder('f1', null)

    expect(folderUpdate).toHaveBeenCalledWith({ where: { id: 'f1' }, data: { parentId: null } })
    expect(folderFindUnique).not.toHaveBeenCalled()
  })

  it('refuse (INVALID_TARGET) un dossier comme son propre parent', async () => {
    folderFindOrThrow.mockResolvedValue({ workspaceId: 'ws1' })

    await expect(folderService.moveFolder('f1', 'f1')).rejects.toMatchObject({
      code: 'INVALID_TARGET',
    })
    expect(folderUpdate).not.toHaveBeenCalled()
  })

  it('refuse (INVALID_TARGET) un parent dans un autre workspace', async () => {
    folderFindOrThrow.mockResolvedValue({ workspaceId: 'ws1' })
    folderFindUnique.mockResolvedValueOnce({ workspaceId: 'ws2' })

    await expect(folderService.moveFolder('f1', 'f2')).rejects.toMatchObject({
      code: 'INVALID_TARGET',
    })
    expect(folderUpdate).not.toHaveBeenCalled()
  })

  it('refuse (CYCLE) de déplacer un dossier dans l’un de ses descendants', async () => {
    // Arborescence f1 > f2 > f3 ; déplacer f1 sous f3 formerait une boucle.
    folderFindOrThrow.mockResolvedValue({ workspaceId: 'ws1' })
    folderFindUnique
      .mockResolvedValueOnce({ workspaceId: 'ws1' }) // validation de la cible f3
      .mockResolvedValueOnce({ parentId: 'f2' }) // remontée : f3 → f2
      .mockResolvedValueOnce({ parentId: 'f1' }) // remontée : f2 → f1 (== dossier déplacé)

    await expect(folderService.moveFolder('f1', 'f3')).rejects.toMatchObject({ code: 'CYCLE' })
    expect(folderUpdate).not.toHaveBeenCalled()
  })
})

describe('softDeleteFolder & restoreFolder — cascade sur le sous-arbre', () => {
  it('met en corbeille le dossier, ses sous-dossiers et leurs notes', async () => {
    // Arbre f1 > f2 > f3 : la collecte descend niveau par niveau via parentId.
    folderFindMany
      .mockResolvedValueOnce([{ id: 'f2' }]) // enfants de f1
      .mockResolvedValueOnce([{ id: 'f3' }]) // enfants de f2
      .mockResolvedValueOnce([]) // f3 est une feuille
    noteUpdateMany.mockResolvedValue({ count: 0 })
    folderUpdateMany.mockResolvedValue({ count: 3 })
    txn.mockImplementation((ops: unknown[]) => Promise.all(ops))

    await folderService.softDeleteFolder('f1')

    expect(noteUpdateMany).toHaveBeenCalledWith({
      where: { folderId: { in: ['f1', 'f2', 'f3'] }, deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    })
    expect(folderUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['f1', 'f2', 'f3'] } },
      data: { deletedAt: expect.any(Date) },
    })
  })

  it('restaure le dossier et tout son sous-arbre (deletedAt remis à null)', async () => {
    // Arbre f1 > f2.
    folderFindMany
      .mockResolvedValueOnce([{ id: 'f2' }]) // enfants de f1
      .mockResolvedValueOnce([]) // f2 est une feuille
    noteUpdateMany.mockResolvedValue({ count: 0 })
    folderUpdateMany.mockResolvedValue({ count: 2 })
    txn.mockImplementation((ops: unknown[]) => Promise.all(ops))

    await folderService.restoreFolder('f1')

    expect(noteUpdateMany).toHaveBeenCalledWith({
      where: { folderId: { in: ['f1', 'f2'] } },
      data: { deletedAt: null },
    })
    expect(folderUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['f1', 'f2'] } },
      data: { deletedAt: null },
    })
  })
})
