import { z } from 'zod'

export const createFolderSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().optional(),
})

export const updateFolderSchema = z.object({
  name: z.string().min(1),
})

export type CreateFolderInput = z.infer<typeof createFolderSchema>
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>
