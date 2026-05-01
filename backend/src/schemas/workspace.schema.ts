import { z } from 'zod'
import { WorkspaceRole } from '@prisma/client'

export const createWorkspaceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
})

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
})

export const inviteMemberSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(WorkspaceRole),
})

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(WorkspaceRole).refine((r) => r !== WorkspaceRole.OWNER, {
    message: 'Cannot assign OWNER role via this route',
  }),
})

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
