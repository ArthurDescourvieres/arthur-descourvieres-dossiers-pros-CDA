import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { existsSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// storage.ts lit UPLOADS_DIR au chargement du module : on pointe vers un dossier
// temporaire AVANT l'import (vi.hoisted s'exécute en premier).
const UPLOADS_DIR = vi.hoisted(() => {
  const base = process.env.TEMP ?? process.env.TMPDIR ?? '/tmp'
  const dir = `${base}/memo-storage-test-${process.pid}`
  process.env.UPLOADS_DIR = dir
  return dir
})

import { storage } from './storage'

afterAll(() => {
  rmSync(UPLOADS_DIR, { recursive: true, force: true })
})

describe('save — écriture sur disque', () => {
  it('écrit le fichier sous un nom unique et renvoie sa taille', async () => {
    const buffer = Buffer.from('contenu-image')

    const { storedName, size } = await storage.save(buffer, 'photo.PNG')

    expect(size).toBe(buffer.length)
    // Extension conservée en minuscules, nom préfixé d'un uuid.
    expect(storedName.endsWith('.png')).toBe(true)
    expect(existsSync(join(UPLOADS_DIR, storedName))).toBe(true)
    expect(readFileSync(join(UPLOADS_DIR, storedName)).toString()).toBe('contenu-image')
  })

  it('gère un nom de fichier sans extension', async () => {
    const { storedName } = await storage.save(Buffer.from('x'), 'sans-ext')

    expect(existsSync(join(UPLOADS_DIR, storedName))).toBe(true)
  })
})

describe('remove / removeMany — suppression défensive', () => {
  it('supprime un fichier existant', async () => {
    const { storedName } = await storage.save(Buffer.from('a'), 'a.txt')

    await storage.remove(storedName)

    expect(existsSync(join(UPLOADS_DIR, storedName))).toBe(false)
  })

  it('ignore silencieusement un fichier déjà absent', async () => {
    await expect(storage.remove('deja-parti.txt')).resolves.toBeUndefined()
  })

  it('ignore un nom de fichier non sûr (anti path traversal)', async () => {
    await expect(storage.remove('../../etc/passwd')).resolves.toBeUndefined()
  })

  it('supprime un lot de fichiers', async () => {
    const a = await storage.save(Buffer.from('a'), 'a.txt')
    const b = await storage.save(Buffer.from('b'), 'b.txt')

    await storage.removeMany([a.storedName, b.storedName])

    expect(existsSync(join(UPLOADS_DIR, a.storedName))).toBe(false)
    expect(existsSync(join(UPLOADS_DIR, b.storedName))).toBe(false)
  })
})

describe('stream / pathFor — accès sûr', () => {
  it('renvoie un flux de lecture du fichier stocké', async () => {
    const { storedName } = await storage.save(Buffer.from('flux'), 'f.txt')

    const stream = storage.stream(storedName)
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)

    expect(Buffer.concat(chunks).toString()).toBe('flux')
  })

  it('construit le chemin absolu d’un fichier stocké', () => {
    expect(storage.pathFor('abc.png')).toBe(join(UPLOADS_DIR, 'abc.png'))
  })

  it('refuse un nom non sûr pour stream et pathFor', () => {
    expect(() => storage.stream('../escape')).toThrow('Invalid stored name')
    expect(() => storage.pathFor('a/b')).toThrow('Invalid stored name')
  })
})

// Garde-fou : suppression d'un fichier créé hors API pour valider le chemin réel.
describe('intégration disque', () => {
  beforeAll(() => {
    writeFileSync(join(UPLOADS_DIR, 'manuel.txt'), 'data')
  })

  it('supprime un fichier créé manuellement via remove', async () => {
    await storage.remove('manuel.txt')
    expect(existsSync(join(UPLOADS_DIR, 'manuel.txt'))).toBe(false)
  })
})
