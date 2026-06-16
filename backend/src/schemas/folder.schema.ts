import { z } from 'zod'

export const createFolderSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().optional(),
})

export const updateFolderSchema = z.object({
  name: z.string().min(1),
})

// Déplacement d'un dossier : nouveau parent dans le même workspace, ou null/absent
// pour le remonter à la racine. L'absence de cycle est vérifiée en service.
export const moveFolderSchema = z.object({
  targetParentId: z.string().min(1).nullish(),
})

export type CreateFolderInput = z.infer<typeof createFolderSchema>
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>
export type MoveFolderInput = z.infer<typeof moveFolderSchema>
