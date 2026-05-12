import { mkdir, writeFile, unlink, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { join, extname } from 'node:path'
import { randomUUID } from 'node:crypto'

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? '/app/uploads'

let initialised = false
async function ensureDir(): Promise<void> {
  if (initialised) return
  await mkdir(UPLOADS_DIR, { recursive: true })
  initialised = true
}

export const storage = {
  async save(buffer: Buffer, originalName: string): Promise<{ storedName: string; size: number }> {
    await ensureDir()
    const ext = extname(originalName).toLowerCase().slice(0, 16) || ''
    const storedName = `${randomUUID()}${ext}`
    const fullPath = join(UPLOADS_DIR, storedName)
    await writeFile(fullPath, buffer)
    const stats = await stat(fullPath)
    return { storedName, size: stats.size }
  },

  async remove(storedName: string): Promise<void> {
    if (!isSafeName(storedName)) return
    try {
      await unlink(join(UPLOADS_DIR, storedName))
    } catch {
      // already gone — ignore
    }
  },

  stream(storedName: string): NodeJS.ReadableStream {
    if (!isSafeName(storedName)) throw new Error('Invalid stored name')
    return createReadStream(join(UPLOADS_DIR, storedName))
  },

  pathFor(storedName: string): string {
    if (!isSafeName(storedName)) throw new Error('Invalid stored name')
    return join(UPLOADS_DIR, storedName)
  },
}

function isSafeName(name: string): boolean {
  // No path separators, no traversal, just safe filename chars
  return /^[A-Za-z0-9._-]+$/.test(name)
}
