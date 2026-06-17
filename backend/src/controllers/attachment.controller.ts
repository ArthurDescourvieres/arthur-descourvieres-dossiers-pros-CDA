import type { Context } from 'hono'
import { stream } from 'hono/streaming'
import { fileTypeFromBuffer } from 'file-type'
import type { AppEnv } from '../types/hono.js'
import { attachmentService } from '../services/attachment.service.js'
import { storage } from '../lib/storage.js'
import { ALLOWED_MIMES, looksLikeText } from '../lib/upload.js'

type C = Context<AppEnv>

const MAX_BYTES = 10 * 1024 * 1024

export const attachmentController = {
  async upload(c: C) {
    const noteId = c.req.param('noteId')!
    const userId = (c.get('jwtPayload') as { sub: string }).sub

    let body: Record<string, string | File>
    try {
      body = (await c.req.parseBody()) as Record<string, string | File>
    } catch {
      return c.json({ error: 'Invalid multipart body' }, 400)
    }

    const file = body.file
    if (!(file instanceof File)) {
      return c.json({ error: 'Missing "file" field' }, 400)
    }

    if (file.size > MAX_BYTES) {
      return c.json({ error: `File too large (max ${MAX_BYTES} bytes)` }, 400)
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Validate MIME from magic bytes — never trust the client-sent Content-Type.
    // Plain text has no magic bytes (file-type returns undefined): accept it only
    // when the bytes are genuinely UTF-8 text, so a binary renamed .txt is rejected.
    const detected = await fileTypeFromBuffer(buffer)
    let mime = detected?.mime
    let ext = detected?.ext
    if (!mime && looksLikeText(buffer)) {
      mime = 'text/plain'
      ext = 'txt'
    }
    if (!mime || !ALLOWED_MIMES.has(mime)) {
      return c.json(
        {
          error: 'Unsupported file type',
          detail: mime ? `Detected: ${mime}` : 'Could not detect file type',
          allowed: Array.from(ALLOWED_MIMES),
        },
        415,
      )
    }

    const attachment = await attachmentService.create({
      noteId,
      uploadedById: userId,
      filename: file.name || `upload.${ext}`,
      mimeType: mime,
      buffer,
    })

    return c.json(attachment, 201)
  },

  async list(c: C) {
    const noteId = c.req.param('noteId')!
    const attachments = await attachmentService.listByNote(noteId)
    return c.json(attachments, 200)
  },

  async serveFile(c: C) {
    const id = c.req.param('id')!
    const attachment = await attachmentService.getById(id)
    if (!attachment) return c.json({ error: 'Forbidden' }, 403)

    c.header('Content-Type', attachment.mimeType)
    c.header('Content-Length', String(attachment.size))
    c.header('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.filename)}"`)
    c.header('Cache-Control', 'private, max-age=300')

    return stream(c, async (out) => {
      const node = storage.stream(attachment.storedName)
      // Pipe Node Readable into Hono's StreamingApi
      await new Promise<void>((resolve, reject) => {
        node.on('data', (chunk: Buffer) => {
          out.write(chunk).catch(reject)
        })
        node.on('end', () => resolve())
        node.on('error', reject)
      })
    })
  },

  async remove(c: C) {
    const id = c.req.param('id')!
    const userId = (c.get('jwtPayload') as { sub: string }).sub
    const userRole = c.get('userRole')

    const attachment = await attachmentService.getById(id)
    if (!attachment) return c.json({ error: 'Forbidden' }, 403)

    const isOwner = userRole === 'OWNER'
    const isUploader = attachment.uploadedById === userId
    if (!isOwner && !isUploader) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    await attachmentService.delete(id)
    return c.body(null, 204)
  },
}
