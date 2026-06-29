import { describe, it, expect, vi, beforeEach } from 'vitest'

const { noteFindOrThrow, folderFindUnique, noteUpdate, noteCreate, noteFindMany, noteCount, txn } =
  vi.hoisted(() => ({
    noteFindOrThrow: vi.fn(),
    folderFindUnique: vi.fn(),
    noteUpdate: vi.fn(),
    noteCreate: vi.fn(),
    noteFindMany: vi.fn(),
    noteCount: vi.fn(),
    txn: vi.fn(),
  }))

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    note: {
      findUniqueOrThrow: noteFindOrThrow,
      update: noteUpdate,
      create: noteCreate,
      findMany: noteFindMany,
      count: noteCount,
    },
    folder: { findUnique: folderFindUnique },
    $transaction: txn,
  },
}))
// Le nettoyage HTML (DOMPurify) et l'extraction de texte sont testés ailleurs ;
// on les neutralise ici pour isoler la logique de note.service.
vi.mock('../lib/tiptap-sanitize.js', () => ({ sanitizeTiptapContent: (c: unknown) => c }))
vi.mock('../lib/tiptap.js', () => ({ extractText: () => 'texte extrait' }))

import { noteService } from './note.service'

const PAGE = { limit: 50, offset: 0 }

beforeEach(() => {
  vi.clearAllMocks()
  txn.mockImplementation((arg: unknown) => Promise.all(arg as Promise<unknown>[]))
})

describe('createNote — sanitisation & contentText', () => {
  it('crée la note avec le contenu nettoyé et le texte extrait', async () => {
    const content = { type: 'doc', content: [] }
    noteCreate.mockResolvedValue({ id: 'n1' })

    const result = await noteService.createNote({ title: 'Titre', content, folderId: 'f1' }, 'u1')

    expect(noteCreate).toHaveBeenCalledWith({
      data: {
        title: 'Titre',
        content,
        contentText: 'texte extrait',
        folderId: 'f1',
        createdById: 'u1',
      },
    })
    expect(result).toEqual({ id: 'n1' })
  })
})

describe('getNotesByFolder — pagination & exclusion corbeille', () => {
  it('renvoie les notes actives du dossier, paginées', async () => {
    noteFindMany.mockResolvedValue([{ id: 'n1' }])
    noteCount.mockResolvedValue(1)

    const result = await noteService.getNotesByFolder('f1', PAGE)

    expect(noteFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { folderId: 'f1', deletedAt: null } }),
    )
    expect(result).toEqual({ items: [{ id: 'n1' }], total: 1, limit: 50, offset: 0 })
  })
})

describe('getNoteById', () => {
  it('renvoie la note par id', async () => {
    noteFindOrThrow.mockResolvedValue({ id: 'n1' })

    const result = await noteService.getNoteById('n1')

    expect(noteFindOrThrow).toHaveBeenCalledWith({ where: { id: 'n1' } })
    expect(result).toEqual({ id: 'n1' })
  })
})

describe('updateNote — patch partiel', () => {
  it('met à jour le titre seul sans toucher au contenu', async () => {
    noteUpdate.mockResolvedValue({ id: 'n1', title: 'Nouveau' })

    await noteService.updateNote('n1', { title: 'Nouveau' })

    expect(noteUpdate).toHaveBeenCalledWith({ where: { id: 'n1' }, data: { title: 'Nouveau' } })
  })

  it('re-nettoie et ré-extrait le texte quand le contenu change', async () => {
    const content = { type: 'doc', content: [] }
    noteUpdate.mockResolvedValue({ id: 'n1' })

    await noteService.updateNote('n1', { content })

    expect(noteUpdate).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { content, contentText: 'texte extrait' },
    })
  })
})

describe('softDeleteNote & restoreNote — corbeille', () => {
  it('place la note en corbeille (deletedAt = maintenant)', async () => {
    noteUpdate.mockResolvedValue({ id: 'n1' })

    await noteService.softDeleteNote('n1')

    expect(noteUpdate).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { deletedAt: expect.any(Date) },
    })
  })

  it('restaure la note (deletedAt = null)', async () => {
    noteUpdate.mockResolvedValue({ id: 'n1' })

    await noteService.restoreNote('n1')

    expect(noteUpdate).toHaveBeenCalledWith({ where: { id: 'n1' }, data: { deletedAt: null } })
  })
})

describe('getDeletedNotesByWorkspace — vue corbeille', () => {
  it('renvoie les notes supprimées dont le dossier n’est pas lui-même en corbeille', async () => {
    noteFindMany.mockResolvedValue([{ id: 'n1' }])
    noteCount.mockResolvedValue(1)

    const result = await noteService.getDeletedNotesByWorkspace('ws1', PAGE)

    expect(noteFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: { not: null }, folder: { workspaceId: 'ws1', deletedAt: null } },
      }),
    )
    expect(result).toEqual({ items: [{ id: 'n1' }], total: 1, limit: 50, offset: 0 })
  })
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
