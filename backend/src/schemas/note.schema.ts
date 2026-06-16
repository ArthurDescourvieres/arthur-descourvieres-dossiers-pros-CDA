import { z } from 'zod'
import { normalizedText } from './common.js'

// Titre de note : 1–200 caractères, trimmé + normalisé NFC (§7.3).
export const createNoteSchema = z.object({
  title: normalizedText(1, 200),
  content: z.record(z.unknown()).default({}),
  folderId: z.string(),
})

export const updateNoteSchema = z.object({
  title: normalizedText(1, 200).optional(),
  content: z.record(z.unknown()).optional(),
})

// Déplacement d'une note : on ne fournit que le dossier cible. La cible doit
// appartenir au même workspace que la note (vérifié en service).
export const moveNoteSchema = z.object({
  targetFolderId: z.string().min(1),
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type MoveNoteInput = z.infer<typeof moveNoteSchema>
