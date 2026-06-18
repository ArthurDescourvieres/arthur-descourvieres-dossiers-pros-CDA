import { z } from 'zod'
import { WorkspaceRole } from '@prisma/client'
import { normalizedText } from './common.js'

// Nom d'icône Lucide en kebab-case (ex. "folder", "arrow-down-0-1"). On valide
// uniquement la forme côté serveur (le catalogue Lucide vit côté client) ; un
// nom inconnu retombera sur l'icône par défaut à l'affichage.
const iconName = z
  .string()
  .trim()
  .max(50)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Nom d'icône invalide")

// Nom de workspace : 3–50 caractères, trimmé + normalisé NFC (§7.3).
export const createWorkspaceSchema = z.object({
  name: normalizedText(3, 50),
  description: z.string().trim().optional(),
  icon: iconName.optional(),
})

export const updateWorkspaceSchema = z.object({
  name: normalizedText(3, 50).optional(),
  description: z.string().trim().optional(),
  // null réinitialise l'icône (retour au rond blanc par défaut).
  icon: iconName.nullable().optional(),
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

// Transfert de propriété : on désigne le membre qui devient le nouveau OWNER.
export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1),
})

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>
