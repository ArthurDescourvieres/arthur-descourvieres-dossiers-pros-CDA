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

  if (!note) return c.json({ error: 'Not found' }, 404)

  c.set('workspaceId', note.folder.workspaceId)
  await next()
}
