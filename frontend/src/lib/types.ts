// Envelope returned by paginated list endpoints (notes, workspaces, trash).
export type Paginated<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}

export type Workspace = {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type WorkspaceRole = 'OWNER' | 'EDITOR' | 'VIEWER'

export type WorkspaceWithRole = Workspace & { role: WorkspaceRole }

export type WorkspaceMember = {
  id: string
  role: WorkspaceRole
  joinedAt: string
  userId: string
  workspaceId: string
  user: { id: string; name: string; email: string; createdAt: string; updatedAt: string }
}

export type WorkspaceDetail = Workspace & { members: WorkspaceMember[] }

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'

export type Invitation = {
  id: string
  workspaceId: string
  email: string
  role: WorkspaceRole
  token: string
  status: InvitationStatus
  expiresAt: string
  invitedById: string
  createdAt: string
}

export type Folder = {
  id: string
  name: string
  workspaceId: string
  parentId: string | null
  createdAt: string
  updatedAt: string
}

export type Note = {
  id: string
  title: string
  content: TiptapDoc | null
  folderId: string
  createdById: string
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export type TiptapDoc = {
  type: 'doc'
  content?: TiptapNode[]
}

export type TiptapNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  text?: string
  marks?: { type: string; attrs?: Record<string, unknown> }[]
}
