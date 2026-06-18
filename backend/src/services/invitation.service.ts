import { randomBytes } from 'node:crypto'
import { WorkspaceRole, InvitationStatus } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

// Resolve an invitee identifier (email or username) to the email the invitation
// is keyed on. Usernames must match an existing account; acceptance then stays a
// plain email comparison (see acceptInvitation), so no schema change is needed.
async function resolveInviteeEmail(identifier: string): Promise<string> {
  if (identifier.includes('@')) return identifier.toLowerCase()
  const user = await prisma.user.findUnique({ where: { name: identifier } })
  if (!user) {
    throw Object.assign(new Error('No user with that username'), { code: 'USER_NOT_FOUND' })
  }
  return user.email.toLowerCase()
}

export const invitationService = {
  async createInvitation(
    workspaceId: string,
    identifier: string,
    role: WorkspaceRole,
    invitedById: string,
  ) {
    const email = await resolveInviteeEmail(identifier)
    return prisma.invitation.create({
      data: {
        workspaceId,
        email,
        role,
        token: generateToken(),
        invitedById,
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      },
    })
  },

  async listPending(workspaceId: string) {
    return prisma.invitation.findMany({
      where: { workspaceId, status: InvitationStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    })
  },

  async revokeInvitation(workspaceId: string, invitationId: string) {
    const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } })
    if (!invitation || invitation.workspaceId !== workspaceId) {
      throw Object.assign(new Error('Invitation not found'), { code: 'NOT_FOUND' })
    }
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.REVOKED },
    })
  },

  async acceptInvitation(token: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({ where: { token } })
    if (!invitation || invitation.status === InvitationStatus.REVOKED) {
      throw Object.assign(new Error('Invitation not found'), { code: 'NOT_FOUND' })
    }
    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw Object.assign(new Error('Invitation already accepted'), { code: 'CONFLICT' })
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      })
      throw Object.assign(new Error('Invitation expired'), { code: 'EXPIRED' })
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw Object.assign(new Error('Invitation is for a different email'), { code: 'FORBIDDEN' })
    }

    // Create the membership (if not already present) and mark the invitation
    // accepted, atomically.
    return prisma.$transaction(async (tx) => {
      const existing = await tx.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId: invitation.workspaceId } },
      })
      if (!existing) {
        await tx.workspaceMember.create({
          data: { workspaceId: invitation.workspaceId, userId, role: invitation.role },
        })
      }
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      })
      return { workspaceId: invitation.workspaceId, role: invitation.role }
    })
  },
}
