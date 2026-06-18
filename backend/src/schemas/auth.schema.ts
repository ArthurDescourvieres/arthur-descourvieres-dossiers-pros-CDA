import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(12, 'Le mot de passe doit contenir au moins 12 caractères'),
})

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
