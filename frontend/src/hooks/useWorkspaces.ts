import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Folder, Note, Paginated, TiptapDoc, Workspace, WorkspaceWithRole } from '../lib/types'

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    // List endpoints return a { items, total, ... } envelope; unwrap to keep the
    // component contract (an array) unchanged.
    queryFn: () => api<Paginated<WorkspaceWithRole>>('/api/workspaces').then((page) => page.items),
  })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; description?: string }) =>
      api<WorkspaceWithRole>('/api/workspaces', { method: 'POST', json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export function useUpdateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api<Workspace>(`/api/workspaces/${id}`, { method: 'PATCH', json: { name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export function useDeleteWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/workspaces/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export function useFolders(workspaceId: string | null) {
  return useQuery({
    queryKey: ['folders', workspaceId],
    queryFn: () => api<Folder[]>(`/api/workspaces/${workspaceId}/folders`),
    enabled: Boolean(workspaceId),
  })
}

export function useCreateFolder(workspaceId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; parentId?: string }) =>
      api<Folder>(`/api/workspaces/${workspaceId}/folders`, {
        method: 'POST',
        json: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders', workspaceId] }),
  })
}

export function useUpdateFolder(workspaceId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api<Folder>(`/api/workspaces/${workspaceId}/folders/${id}`, {
        method: 'PATCH',
        json: { name },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders', workspaceId] }),
  })
}

export function useDeleteFolder(workspaceId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/api/workspaces/${workspaceId}/folders/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders', workspaceId] }),
  })
}

export function useNotesInFolder(workspaceId: string | null, folderId: string | null) {
  return useQuery({
    queryKey: ['notes', workspaceId, folderId],
    queryFn: () =>
      api<Paginated<Note>>(`/api/workspaces/${workspaceId}/folders/${folderId}/notes`).then(
        (page) => page.items,
      ),
    enabled: Boolean(workspaceId && folderId),
  })
}

export function useCreateNote(workspaceId: string | null, folderId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string }) =>
      api<Note>(`/api/workspaces/${workspaceId}/folders/${folderId}/notes`, {
        method: 'POST',
        json: { ...input, folderId },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', workspaceId, folderId] }),
  })
}

export function useDeleteNote(workspaceId: string | null, folderId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => api<void>(`/api/notes/${noteId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', workspaceId, folderId] })
      qc.invalidateQueries({ queryKey: ['trash', workspaceId] })
    },
  })
}

export function useNote(noteId: string | null) {
  return useQuery({
    queryKey: ['note', noteId],
    queryFn: () => api<Note>(`/api/notes/${noteId}`),
    enabled: Boolean(noteId),
  })
}

export function useUpdateNote(noteId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title?: string; content?: TiptapDoc }) =>
      api<Note>(`/api/notes/${noteId}`, { method: 'PATCH', json: input }),
    onSuccess: (note) => {
      qc.setQueryData(['note', noteId], note)
      qc.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
