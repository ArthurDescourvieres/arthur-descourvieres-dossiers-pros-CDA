import type { JwtVariables } from 'hono/jwt'
import type { WorkspaceRole } from '@prisma/client'

export type AppVariables = JwtVariables & {
  workspaceId: string
  userRole: WorkspaceRole
}

export type AppEnv = { Variables: AppVariables }
