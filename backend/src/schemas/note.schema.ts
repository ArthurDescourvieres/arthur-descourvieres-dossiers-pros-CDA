import { z } from 'zod'

export const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.record(z.unknown()).default({}),
  folderId: z.string(),
})

export const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.record(z.unknown()).optional(),
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
