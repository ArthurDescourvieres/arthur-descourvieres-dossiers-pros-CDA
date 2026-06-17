import { describe, it, expect, vi, beforeEach } from 'vitest'

const { noteFindOrThrow, folderFindUnique, noteUpdate } = vi.hoisted(() => ({
  noteFindOrThrow: vi.fn(),
  folderFindUnique: vi.fn(),
  noteUpdate: vi.fn(),
}))

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    note: { findUniqueOrThrow: noteFindOrThrow, update: noteUpdate },
    folder: { findUnique: folderFindUnique },
  },
}))

import { noteService } from './note.service'

beforeEach(() => {
  noteFindOrThrow.mockReset()
  folderFindUnique.mockReset()
  noteUpdate.mockReset()
})

describe('moveNote — déplacement intra-workspace', () => {
  it('déplace la note quand le dossier cible est dans le même workspace', async () => {
    noteFindOrThrow.mockResolvedValue({ folder: { workspaceId: 'ws1' } })
    folderFindUnique.mockResolvedValue({ workspaceId: 'ws1' })
    noteUpdate.mockResolvedValue({ id: 'n1', folderId: 'f2' })

    const result = await noteService.moveNote('n1', 'f2')

    expect(noteUpdate).toHaveBeenCalledWith({ where: { id: 'n1' }, data: { folderId: 'f2' } })
    expect(result).toEqual({ id: 'n1', folderId: 'f2' })
  })

  it('refuse (INVALID_TARGET) un dossier cible dans un autre workspace', async () => {
    noteFindOrThrow.mockResolvedValue({ folder: { workspaceId: 'ws1' } })
    folderFindUnique.mockResolvedValue({ workspaceId: 'ws2' })

    await expect(noteService.moveNote('n1', 'f2')).rejects.toMatchObject({ code: 'INVALID_TARGET' })
    expect(noteUpdate).not.toHaveBeenCalled()
  })

  it('refuse (INVALID_TARGET) un dossier cible inexistant', async () => {
    noteFindOrThrow.mockResolvedValue({ folder: { workspaceId: 'ws1' } })
    folderFindUnique.mockResolvedValue(null)

    await expect(noteService.moveNote('n1', 'fX')).rejects.toMatchObject({ code: 'INVALID_TARGET' })
    expect(noteUpdate).not.toHaveBeenCalled()
  })
})
