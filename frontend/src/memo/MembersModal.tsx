import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ApiError } from '../lib/api'
import { useRemoveMember, useUpdateMemberRole, useWorkspaceDetail } from '../hooks/useMembers'
import { ASSIGNABLE_ROLE_OPTIONS, roleLabel } from './inviteUtils'
import { Select } from './Select'
import { useDialog } from './dialog/DialogProvider'
import type { WorkspaceMember, WorkspaceRole } from '../lib/types'

type ManageableRole = 'EDITOR' | 'VIEWER'

// Liste les membres actifs d'un workspace, rendue en modale (portail) depuis le
// menu « ⋯ » de la section Workspaces. Tout le monde (VIEWER+) voit la liste ;
// seul un OWNER (canManage) obtient le sélecteur de rôle et le bouton retirer.
// La ligne OWNER n'est jamais éditable — le serveur la rejette en 403.
export function MembersModal({
  workspaceId,
  canManage,
  currentUserId,
  onClose,
}: {
  workspaceId: string
  canManage: boolean
  currentUserId: string | null
  onClose: () => void
}) {
  const detail = useWorkspaceDetail(workspaceId)
  const updateRole = useUpdateMemberRole(workspaceId)
  const remove = useRemoveMember(workspaceId)
  const dialog = useDialog()
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
    const ok = await dialog.confirm({
      title: 'Retirer le membre',
      message: (
        <>
          <strong>{member.user.name}</strong> sera retiré du workspace et perdra l'accès à son
          contenu.
        </>
      ),
      confirmLabel: 'Retirer',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await remove.mutateAsync(member.userId)
    } catch (err) {
      setError(memberErrorMessage(err))
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 grid place-items-center z-[9000] p-6 bg-[oklch(0_0_0_/_0.5)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="flex flex-col gap-4 w-[min(480px,calc(100vw-48px))] max-h-[calc(100vh-48px)] overflow-y-auto rounded-2xl border border-[var(--color-line-strong)] p-[22px] bg-[var(--color-surface-2)] text-[var(--color-text)] shadow-[0_16px_48px_var(--color-shadow)]"
        role="dialog"
        aria-modal="true"
        aria-label="Membres"
      >
        <header className="flex items-center justify-between">
          <h2 className="m-0 flex items-center gap-2 text-lg">
            Membres
            {members.length > 0 && (
              <span className="text-xs tabular-nums opacity-40">{members.length}</span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 text-lg leading-none cursor-pointer rounded-md border border-[var(--color-line-strong)] bg-transparent text-inherit"
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        {detail.isPending ? (
          <div className="opacity-40 text-sm">…</div>
        ) : detail.isError ? (
          <div className="opacity-50 text-[13px]">Membres indisponibles</div>
        ) : members.length === 0 ? (
          <div className="opacity-50 text-[13px]">Aucun membre</div>
        ) : (
          <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
            {members.map((m) => {
              const isOwner = m.role === 'OWNER'
              const isSelf = m.userId === currentUserId
              const rowBusy =
                (updateRole.isPending && updateRole.variables?.userId === m.userId) ||
                (remove.isPending && remove.variables === m.userId)

              return (
                <li
                  key={m.userId}
                  className="flex items-center justify-between gap-2 rounded-md bg-[var(--color-overlay)] px-2 py-1.5"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px]">
                      {m.user.name}
                      {isSelf && <span className="font-normal opacity-45"> (vous)</span>}
                    </span>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] opacity-50">
                      {m.user.email}
                    </span>
                  </div>

                  {canManage && !isOwner ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <Select
                        value={m.role as ManageableRole}
                        disabled={rowBusy}
                        onChange={(role) => onChangeRole(m.userId, role)}
                        options={ASSIGNABLE_ROLE_OPTIONS}
                        title="Modifier le rôle"
                        ariaLabel={`Rôle de ${m.user.name}`}
                        className="px-1.5 py-1 text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => onRemove(m)}
                        disabled={rowBusy}
                        title="Retirer du workspace"
                        className="h-6 w-6 shrink-0 cursor-pointer rounded border border-[var(--color-line-strong)] bg-transparent text-sm leading-none text-inherit opacity-70 disabled:opacity-40"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <span className="shrink-0 whitespace-nowrap text-[11px] opacity-55">
                      {roleLabel(m.role)}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {error && <div className="text-[11.5px] text-[var(--color-danger)]">{error}</div>}
      </div>
    </div>,
    document.body,
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
