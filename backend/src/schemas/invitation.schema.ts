import { z } from 'zod'
import { WorkspaceRole } from '@prisma/client'

// An invitee is identified by email (anything containing '@') or by unique
// username. We only enforce a valid email format when an '@' is present; a bare
// string is treated as a username and resolved to an account server-side.
export const createInvitationSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Identifiant requis')
    .max(254)
    .refine((v) => !v.includes('@') || z.string().email().safeParse(v).success, {
      message: 'Adresse e-mail invalide',
    }),
  role: z.nativeEnum(WorkspaceRole).refine((r) => r !== WorkspaceRole.OWNER, {
    message: 'Invitations can only grant EDITOR or VIEWER',
  }),
})

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>
