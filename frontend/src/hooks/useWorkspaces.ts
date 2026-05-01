import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Folder, Note, TiptapDoc, WorkspaceWithRole } from '../lib/types'

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api<WorkspaceWithRole[]>('/api/workspaces'),
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

export function useNotesInFolder(workspaceId: string | null, folderId: string | null) {
  return useQuery({
    queryKey: ['notes', workspaceId, folderId],
    queryFn: () =>
      api<Note[]>(`/api/workspaces/${workspaceId}/folders/${folderId}/notes`),
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
