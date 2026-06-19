import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Folder, Note, Paginated } from '../lib/types'
import { useDeleteFolder } from './useWorkspaces'

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

// Soft-deleted folders (the trash roots) for the whole workspace (EDITOR+).
// Fetched lazily like the deleted notes above.
export function useDeletedFolders(workspaceId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['trash-folders', workspaceId],
    queryFn: () => api<Folder[]>(`/api/workspaces/${workspaceId}/trash/folders`),
    enabled: Boolean(workspaceId) && enabled,
  })
}

/**
 * Mutations utilisées par le dépôt d'un élément sur la corbeille (TrashDropTarget).
 * Note comme dossier sont désormais des soft-delete (restaurables). Le dossier
 * réutilise useDeleteFolder, qui invalide déjà l'arbre, les notes et la corbeille
 * des dossiers ; la note invalide en plus la corbeille des notes.
 */
export function useTrashDrop(workspaceId: string) {
  const qc = useQueryClient()
  const deleteFolder = useDeleteFolder(workspaceId)
  const deleteNote = useMutation({
    mutationFn: (id: string) => api<void>(`/api/notes/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      qc.invalidateQueries({ queryKey: ['trash', workspaceId] })
      // Rafraîchit la note si elle est ouverte : elle revient avec `deletedAt`
      // renseigné, ce qui referme l'éditeur (voir NoteEditor).
      qc.invalidateQueries({ queryKey: ['note', id] })
    },
  })
  return { deleteFolder, deleteNote }
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

export function useRestoreFolder(workspaceId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (folderId: string) =>
      api<void>(`/api/workspaces/${workspaceId}/folders/${folderId}/restore`, { method: 'PATCH' }),
    onSuccess: () => {
      // Le dossier (et son sous-arbre) revient : on rafraîchit la corbeille des
      // dossiers, l'arbre et les listes de notes restaurées.
      qc.invalidateQueries({ queryKey: ['trash-folders', workspaceId] })
      qc.invalidateQueries({ queryKey: ['folders', workspaceId] })
      qc.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
