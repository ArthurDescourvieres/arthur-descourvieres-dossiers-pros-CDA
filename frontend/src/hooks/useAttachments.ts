import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export type Attachment = {
  id: string
  filename: string
  storedName: string
  mimeType: string
  size: number
  noteId: string
  uploadedById: string
  createdAt: string
}

export function useNoteAttachments(noteId: string | null) {
  return useQuery({
    queryKey: ['attachments', noteId],
    queryFn: () => api<Attachment[]>(`/api/notes/${noteId}/attachments`),
    enabled: Boolean(noteId),
  })
}

export function useUploadAttachment(noteId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return api<Attachment>(`/api/notes/${noteId}/attachments`, {
        method: 'POST',
        body: fd,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', noteId] }),
  })
}

export function useDeleteAttachment(noteId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/api/attachments/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', noteId] }),
  })
}

export function attachmentFileUrl(id: string): string {
  return `/api/attachments/${id}/file`
}
