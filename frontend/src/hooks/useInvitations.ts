import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Invitation, WorkspaceRole } from '../lib/types'

// Pending invitations for a workspace — OWNER only (the API returns 403
// otherwise), so callers should mount this for owners.
export function useInvitations(workspaceId: string | null) {
  return useQuery({
    queryKey: ['invitations', workspaceId],
    queryFn: () => api<Invitation[]>(`/api/workspaces/${workspaceId}/invitations`),
    enabled: Boolean(workspaceId),
  })
}

export function useCreateInvitation(workspaceId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { email: string; role: 'EDITOR' | 'VIEWER' }) =>
      api<Invitation>(`/api/workspaces/${workspaceId}/invitations`, {
        method: 'POST',
        json: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations', workspaceId] }),
  })
}

export function useRevokeInvitation(workspaceId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: string) =>
      api<void>(`/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations', workspaceId] }),
  })
}

// Used by the invited user when opening an invite link. Invalidates the
// workspace list so the freshly joined workspace shows up.
export function useAcceptInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (token: string) =>
      api<{ workspaceId: string; role: WorkspaceRole }>(`/api/invitations/${token}/accept`, {
        method: 'POST',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}
