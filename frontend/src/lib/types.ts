export type Workspace = {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type WorkspaceWithRole = Workspace & { role: 'OWNER' | 'EDITOR' | 'VIEWER' }

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
