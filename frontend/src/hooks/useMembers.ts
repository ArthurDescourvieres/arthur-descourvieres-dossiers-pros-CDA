import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { WorkspaceDetail, WorkspaceMember } from '../lib/types'

// Workspace detail includes the active members (with their user info) — the
// `/api/workspaces` list only carries the bare membership rows, so role
// management needs this dedicated query. Readable by any member (VIEWER+).
export function useWorkspaceDetail(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => api<WorkspaceDetail>(`/api/workspaces/${workspaceId}`),
    enabled: Boolean(workspaceId),
  })
}

// OWNER-only: change an active member's role. OWNER cannot be targeted (the
// API returns 403) and OWNER cannot be assigned via this route (400).
export function useUpdateMemberRole(workspaceId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'EDITOR' | 'VIEWER' }) =>
      api<WorkspaceMember>(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'PATCH',
        json: { role },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', workspaceId] }),
  })
}

// OWNER-only: remove an active member. Server bumps the removed user's
// tokenVersion, revoking their sessions on next refresh (§5.5).
export function useRemoveMember(workspaceId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      api<void>(`/api/workspaces/${workspaceId}/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', workspaceId] }),
  })
}
