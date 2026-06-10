import type { MiddlewareHandler } from 'hono'
import { WorkspaceRole } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import type { AppEnv } from '../types/hono.js'

export { WorkspaceRole }

const ROLE_WEIGHT: Record<WorkspaceRole, number> = {
  [WorkspaceRole.VIEWER]: 0,
  [WorkspaceRole.EDITOR]: 1,
  [WorkspaceRole.OWNER]: 2,
}

export const requireRole = (minRole: WorkspaceRole): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const payload = c.get('jwtPayload') as { sub: string }
    const userId = payload.sub

    const workspaceId = c.req.param('workspaceId') ?? c.get('workspaceId')
    if (!workspaceId) return c.json({ error: 'Forbidden' }, 403)

    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    })

    if (!member || ROLE_WEIGHT[member.role] < ROLE_WEIGHT[minRole]) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    c.set('userRole', member.role)
    await next()
  }

export const resolveWorkspaceFromNote: MiddlewareHandler<AppEnv> = async (c, next) => {
  const noteId = c.req.param('noteId')
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { folder: { select: { workspaceId: true } } },
  })

  // Anti-enumeration (§6.3): a missing resource and a denied one return the
  // same standardized 403, so the response never reveals whether it exists.
  if (!note) return c.json({ error: 'Forbidden' }, 403)

  c.set('workspaceId', note.folder.workspaceId)
  await next()
}

export const resolveWorkspaceFromAttachment: MiddlewareHandler<AppEnv> = async (c, next) => {
  const id = c.req.param('id')
  const attachment = await prisma.attachment.findUnique({
    where: { id },
    select: { note: { select: { folder: { select: { workspaceId: true } } } } },
  })

  // Anti-enumeration (§6.3): same standardized 403 for missing or denied.
  if (!attachment) return c.json({ error: 'Forbidden' }, 403)

  c.set('workspaceId', attachment.note.folder.workspaceId)
  await next()
}
