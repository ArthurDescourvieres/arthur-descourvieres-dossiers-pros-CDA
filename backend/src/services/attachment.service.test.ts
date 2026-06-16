import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  storageSave,
  storageRemove,
  attachCreate,
  attachFindMany,
  attachFindUnique,
  attachFindOrThrow,
  attachDelete,
} = vi.hoisted(() => ({
  storageSave: vi.fn(),
  storageRemove: vi.fn(),
  attachCreate: vi.fn(),
  attachFindMany: vi.fn(),
  attachFindUnique: vi.fn(),
  attachFindOrThrow: vi.fn(),
  attachDelete: vi.fn(),
}))

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    attachment: {
      create: attachCreate,
      findMany: attachFindMany,
      findUnique: attachFindUnique,
      findUniqueOrThrow: attachFindOrThrow,
      delete: attachDelete,
    },
  },
}))

vi.mock('../lib/storage.js', () => ({
  storage: {
    save: storageSave,
    remove: storageRemove,
  },
}))

import { attachmentService } from './attachment.service'

const INPUT = {
  noteId: 'note1',
  uploadedById: 'user1',
  filename: 'photo.png',
  mimeType: 'image/png',
  buffer: Buffer.from('fake'),
}

const SAVED = { storedName: 'uuid-photo.png', size: 4 }
const RECORD = {
  id: 'att1',
  noteId: 'note1',
  uploadedById: 'user1',
  filename: 'photo.png',
  mimeType: 'image/png',
  storedName: 'uuid-photo.png',
  size: 4,
}

beforeEach(() => {
  storageSave.mockReset()
  storageRemove.mockReset()
  attachCreate.mockReset()
  attachFindMany.mockReset()
  attachFindUnique.mockReset()
  attachFindOrThrow.mockReset()
  attachDelete.mockReset()
})

describe('create', () => {
  it('enregistre le fichier puis insère le record DB', async () => {
    storageSave.mockResolvedValue(SAVED)
    attachCreate.mockResolvedValue(RECORD)

    const result = await attachmentService.create(INPUT)

    expect(storageSave).toHaveBeenCalledWith(INPUT.buffer, INPUT.filename)
    expect(attachCreate).toHaveBeenCalledWith({
      data: {
        noteId: INPUT.noteId,
        uploadedById: INPUT.uploadedById,
        filename: INPUT.filename,
        storedName: SAVED.storedName,
        mimeType: INPUT.mimeType,
        size: SAVED.size,
      },
    })
    expect(result).toEqual(RECORD)
  })

  it("supprime le fichier uploadé quand l'insertion DB échoue (rollback)", async () => {
    const dbError = new Error('DB constraint')
    storageSave.mockResolvedValue(SAVED)
    attachCreate.mockRejectedValue(dbError)
    storageRemove.mockResolvedValue(undefined)

    await expect(attachmentService.create(INPUT)).rejects.toThrow(dbError)

    expect(storageRemove).toHaveBeenCalledWith(SAVED.storedName)
  })
})

describe('listByNote', () => {
  it('retourne les pièces jointes triées par createdAt desc', async () => {
    const list = [RECORD]
    attachFindMany.mockResolvedValue(list)

    const result = await attachmentService.listByNote('note1')

    expect(attachFindMany).toHaveBeenCalledWith({
      where: { noteId: 'note1' },
      orderBy: { createdAt: 'desc' },
    })
    expect(result).toEqual(list)
  })
})

describe('getById', () => {
  it('retourne la pièce jointe avec son contexte workspace', async () => {
    const full = { ...RECORD, note: { folder: { workspaceId: 'ws1' } } }
    attachFindUnique.mockResolvedValue(full)

    const result = await attachmentService.getById('att1')

    expect(attachFindUnique).toHaveBeenCalledWith({
      where: { id: 'att1' },
      include: { note: { select: { folder: { select: { workspaceId: true } } } } },
    })
    expect(result).toEqual(full)
  })

  it('retourne null si la pièce jointe est introuvable', async () => {
    attachFindUnique.mockResolvedValue(null)

    const result = await attachmentService.getById('missing')

    expect(result).toBeNull()
  })
})

describe('delete', () => {
  it('supprime le record DB puis retire le fichier du stockage', async () => {
    attachFindOrThrow.mockResolvedValue(RECORD)
    attachDelete.mockResolvedValue(undefined)
    storageRemove.mockResolvedValue(undefined)

    await attachmentService.delete('att1')

    expect(attachDelete).toHaveBeenCalledWith({ where: { id: 'att1' } })
    expect(storageRemove).toHaveBeenCalledWith(RECORD.storedName)
  })

  it('lève une erreur et ne touche rien si la pièce jointe est introuvable', async () => {
    const notFound = new Error('Not Found')
    attachFindOrThrow.mockRejectedValue(notFound)

    await expect(attachmentService.delete('ghost')).rejects.toThrow(notFound)
    expect(attachDelete).not.toHaveBeenCalled()
    expect(storageRemove).not.toHaveBeenCalled()
  })
})
