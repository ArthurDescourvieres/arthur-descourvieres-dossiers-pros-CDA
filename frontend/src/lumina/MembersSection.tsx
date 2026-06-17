import { useState, type CSSProperties } from 'react'
import { ApiError } from '../lib/api'
import { useRemoveMember, useUpdateMemberRole, useWorkspaceDetail } from '../hooks/useMembers'
import { roleLabel } from './inviteUtils'
import type { WorkspaceMember, WorkspaceRole } from '../lib/types'

type ManageableRole = 'EDITOR' | 'VIEWER'

// Lists the active members of a workspace. Everyone (VIEWER+) sees the roster;
// only an OWNER (canManage) gets the role selector and the remove button. The
// OWNER row is never editable — the server rejects it with 403.
export function MembersSection({
  workspaceId,
  canManage,
  currentUserId,
}: {
  workspaceId: string
  canManage: boolean
  currentUserId: string | null
}) {
  const detail = useWorkspaceDetail(workspaceId)
  const updateRole = useUpdateMemberRole(workspaceId)
  const remove = useRemoveMember(workspaceId)
  const [error, setError] = useState<string | null>(null)

  const members = sortMembers(detail.data?.members ?? [])

  const onChangeRole = async (userId: string, role: ManageableRole) => {
    setError(null)
    try {
      await updateRole.mutateAsync({ userId, role })
    } catch (err) {
      setError(memberErrorMessage(err))
    }
  }

  const onRemove = async (member: WorkspaceMember) => {
    setError(null)
    if (!window.confirm(`Retirer ${member.user.name} du workspace ?`)) return
    try {
      await remove.mutateAsync(member.userId)
    } catch (err) {
      setError(memberErrorMessage(err))
    }
  }

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <span style={headerLabelStyle}>Membres</span>
        {members.length > 0 && <span style={countStyle}>{members.length}</span>}
      </div>

      {detail.isPending ? (
        <div style={loadingStyle}>…</div>
      ) : detail.isError ? (
        <div style={emptyStyle}>Membres indisponibles</div>
      ) : members.length === 0 ? (
        <div style={emptyStyle}>Aucun membre</div>
      ) : (
        <ul style={listStyle}>
          {members.map((m) => {
            const isOwner = m.role === 'OWNER'
            const isSelf = m.userId === currentUserId
            const rowBusy =
              (updateRole.isPending && updateRole.variables?.userId === m.userId) ||
              (remove.isPending && remove.variables === m.userId)

            return (
              <li key={m.userId} style={rowStyle}>
                <div style={infoStyle}>
                  <span style={nameStyle}>
                    {m.user.name}
                    {isSelf && <span style={selfStyle}> (vous)</span>}
                  </span>
                  <span style={emailStyle}>{m.user.email}</span>
                </div>

                {canManage && !isOwner ? (
                  <div style={actionsStyle}>
                    <select
                      value={m.role}
                      disabled={rowBusy}
                      onChange={(e) => onChangeRole(m.userId, e.target.value as ManageableRole)}
                      style={selectStyle}
                      title="Modifier le rôle"
                    >
                      <option value="EDITOR">Éditeur</option>
                      <option value="VIEWER">Lecteur</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => onRemove(m)}
                      disabled={rowBusy}
                      title="Retirer du workspace"
                      style={iconButtonStyle}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <span style={roleBadgeStyle}>{roleLabel(m.role)}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {error && <div style={errorStyle}>{error}</div>}
    </section>
  )
}

function sortMembers(members: WorkspaceMember[]): WorkspaceMember[] {
  const rank: Record<WorkspaceRole, number> = { OWNER: 0, EDITOR: 1, VIEWER: 2 }
  return [...members].sort(
    (a, b) => rank[a.role] - rank[b.role] || a.user.name.localeCompare(b.user.name),
  )
}

function memberErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return 'Action non autorisée sur ce membre.'
    if (err.status === 404) return "Ce membre n'existe plus."
    if (err.status === 400) return 'Rôle invalide.'
    if (err.status === 429) return 'Trop de tentatives, réessayez dans un instant.'
  }
  return "L'action a échoué."
}

const sectionStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const headerStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }
const headerLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1,
  opacity: 0.5,
}
const countStyle: CSSProperties = {
  fontSize: 10,
  opacity: 0.4,
  fontVariantNumeric: 'tabular-nums',
}
const listStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}
const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
  padding: '4px 6px',
  borderRadius: 4,
}
const infoStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
}
const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: 4,
  flexShrink: 0,
  alignItems: 'center',
}
const nameStyle: CSSProperties = {
  fontSize: 12.5,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const selfStyle: CSSProperties = { opacity: 0.45, fontWeight: 400 }
const emailStyle: CSSProperties = {
  fontSize: 11,
  opacity: 0.5,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const selectStyle: CSSProperties = {
  background: 'var(--color-surface-strong)',
  border: '1px solid var(--color-line-strong)',
  borderRadius: 4,
  color: 'inherit',
  padding: '4px 6px',
  fontSize: 11,
  outline: 'none',
  cursor: 'pointer',
}
const iconButtonStyle: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--color-line-strong)',
  color: 'inherit',
  borderRadius: 4,
  width: 24,
  height: 24,
  lineHeight: 1,
  fontSize: 14,
  cursor: 'pointer',
  opacity: 0.7,
}
const roleBadgeStyle: CSSProperties = {
  fontSize: 11,
  opacity: 0.55,
  flexShrink: 0,
  whiteSpace: 'nowrap',
}
const loadingStyle: CSSProperties = { opacity: 0.4, fontSize: 12 }
const emptyStyle: CSSProperties = { opacity: 0.4, fontSize: 12, padding: '2px 6px' }
const errorStyle: CSSProperties = { fontSize: 11.5, color: 'var(--color-danger)' }
