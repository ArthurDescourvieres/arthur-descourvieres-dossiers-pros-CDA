import { z } from 'zod'
import { WorkspaceRole } from '@prisma/client'

export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(WorkspaceRole).refine((r) => r !== WorkspaceRole.OWNER, {
    message: 'Invitations can only grant EDITOR or VIEWER',
  }),
})

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>
