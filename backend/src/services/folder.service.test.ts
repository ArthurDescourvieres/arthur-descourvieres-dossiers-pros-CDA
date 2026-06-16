import { describe, it, expect, vi, beforeEach } from 'vitest'

const { folderFindOrThrow, folderFindUnique, folderUpdate } = vi.hoisted(() => ({
  folderFindOrThrow: vi.fn(),
  folderFindUnique: vi.fn(),
  folderUpdate: vi.fn(),
}))

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    folder: {
      findUniqueOrThrow: folderFindOrThrow,
      findUnique: folderFindUnique,
      update: folderUpdate,
    },
  },
}))

import { folderService } from './folder.service'

beforeEach(() => {
  folderFindOrThrow.mockReset()
  folderFindUnique.mockReset()
  folderUpdate.mockReset()
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
