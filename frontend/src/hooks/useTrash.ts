import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Note, Paginated } from '../lib/types'

// Soft-deleted notes for the whole workspace (EDITOR+). Fetched lazily — pass
// enabled=false to skip the request until the trash panel is opened.
export function useDeletedNotes(workspaceId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['trash', workspaceId],
    queryFn: () =>
      api<Paginated<Note>>(`/api/workspaces/${workspaceId}/trash`).then((page) => page.items),
    enabled: Boolean(workspaceId) && enabled,
  })
}

export function useRestoreNote(workspaceId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => api<Note>(`/api/notes/${noteId}/restore`, { method: 'PATCH' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash', workspaceId] })
      // The note reappears in its folder list.
      qc.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
