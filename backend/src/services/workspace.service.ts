import { WorkspaceRole } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from '../schemas/workspace.schema.js'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = toSlug(name)
  const existing = await prisma.workspace.findFirst({ where: { slug: { startsWith: base } } })
  if (!existing) return base
  return `${base}-${Date.now()}`
}

export const workspaceService = {
  async createWorkspace(data: CreateWorkspaceInput, ownerId: string) {
    const slug = await generateUniqueSlug(data.name)
    return prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name: data.name, slug, description: data.description, ownerId },
      })
      await tx.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: ownerId, role: WorkspaceRole.OWNER },
      })
      return workspace
    })
  },

  async getWorkspacesByUser(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: { include: { members: true } } },
    })
    return memberships.map((m) => ({ ...m.workspace, role: m.role }))
  },

  async getWorkspaceById(workspaceId: string) {
    return prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, createdAt: true, updatedAt: true } },
          },
        },
      },
    })
  },

  async updateWorkspace(workspaceId: string, data: UpdateWorkspaceInput) {
    return prisma.workspace.update({ where: { id: workspaceId }, data })
  },

  async deleteWorkspace(workspaceId: string) {
    return prisma.workspace.delete({ where: { id: workspaceId } })
  },

  async addMember(workspaceId: string, userId: string, role: WorkspaceRole) {
    const existing = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    })
    if (existing) {
      throw Object.assign(new Error('User is already a member'), { code: 'CONFLICT' })
    }
    return prisma.workspaceMember.create({ data: { workspaceId, userId, role } })
  },

  async updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole) {
    const member = await prisma.workspaceMember.findUniqueOrThrow({
      where: { userId_workspaceId: { userId, workspaceId } },
    })
    if (member.role === WorkspaceRole.OWNER) {
      throw Object.assign(new Error('Cannot change role of workspace owner'), { code: 'FORBIDDEN' })
    }
    return prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId, workspaceId } },
      data: { role },
    })
  },

  async removeMember(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUniqueOrThrow({
      where: { userId_workspaceId: { userId, workspaceId } },
    })
    if (member.role === WorkspaceRole.OWNER) {
      throw Object.assign(new Error('Cannot remove workspace owner'), { code: 'FORBIDDEN' })
    }
    // Remove the member and bump their tokenVersion so their existing sessions
    // are revoked on the next refresh (§5.5).
    await prisma.$transaction([
      prisma.workspaceMember.delete({ where: { userId_workspaceId: { userId, workspaceId } } }),
      prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } }),
    ])
  },
}
