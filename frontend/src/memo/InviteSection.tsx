import { useState, type FormEvent } from 'react'
import { useCreateInvitation, useInvitations, useRevokeInvitation } from '../hooks/useInvitations'
import { createInviteErrorMessage, formatExpiry, inviteLink, roleLabel } from './inviteUtils'

type InvitableRole = 'EDITOR' | 'VIEWER'

const inputClass =
  'min-w-0 rounded border border-[var(--color-line-strong)] bg-[var(--color-surface-strong)] px-2 py-1.5 text-xs text-inherit outline-none'

// OWNER-only sidebar panel: invite a member by email + role, then copy the
// generated link to forward it (no email is sent server-side). Lists and
// revokes pending invitations.
export function InviteSection({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InvitableRole>('EDITOR')
  const [error, setError] = useState<string | null>(null)
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const invitations = useInvitations(workspaceId)
  const create = useCreateInvitation(workspaceId)
  const revoke = useRevokeInvitation(workspaceId)

  const pending = invitations.data ?? []

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const value = email.trim().toLowerCase()
    if (!value) return
    try {
      const invitation = await create.mutateAsync({ email: value, role })
      setEmail('')
      setCreatedToken(invitation.token)
    } catch (err) {
      setError(createInviteErrorMessage(err))
    }
  }

  return (
    <section className="flex flex-col gap-1.5">
      <Header
        title="Inviter"
        onAdd={() => {
          setOpen((v) => !v)
          setError(null)
        }}
      />

      {open && (
        <form onSubmit={submit} className="flex flex-col gap-1.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com"
            className={inputClass}
            autoFocus
            required
          />
          <div className="flex gap-1.5">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as InvitableRole)}
              className={`${inputClass} flex-1`}
            >
              <option value="EDITOR">Éditeur</option>
              <option value="VIEWER">Lecteur</option>
            </select>
            <button
              type="submit"
              className="cursor-pointer rounded border-none bg-[var(--color-accent)] px-3 text-xs text-[var(--color-on-accent)]"
              disabled={create.isPending}
            >
              {create.isPending ? '…' : 'Inviter'}
            </button>
          </div>
          {error && <div className="text-[11.5px] text-[var(--color-danger)]">{error}</div>}
        </form>
      )}

      {createdToken && (
        <div className="flex flex-col gap-1.5 rounded border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] p-2">
          <div className="text-[11px] opacity-75">
            Lien prêt — aucun e-mail n’est envoyé, transmettez-le vous-même :
          </div>
          <div className="flex gap-1.5">
            <input
              readOnly
              value={inviteLink(createdToken)}
              className={`${inputClass} flex-1`}
              onFocus={(e) => e.currentTarget.select()}
            />
            <CopyButton token={createdToken} />
          </div>
        </div>
      )}

      {invitations.isPending ? (
        <div className="text-xs opacity-40">…</div>
      ) : pending.length === 0 ? (
        <div className="px-1.5 py-0.5 text-xs opacity-40">Aucune invitation en attente</div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {pending.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between gap-2 rounded px-1.5 py-1"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px]">
                  {inv.email}
                </span>
                <span className="text-[11px] opacity-50">
                  {roleLabel(inv.role)} · expire le {formatExpiry(inv.expiresAt)}
                </span>
              </div>
              <div className="flex flex-shrink-0 gap-1">
                <CopyButton token={inv.token} />
                <button
                  type="button"
                  onClick={() => revoke.mutate(inv.id)}
                  disabled={revoke.isPending}
                  title="Révoquer l’invitation"
                  className="h-6 w-6 cursor-pointer rounded border border-[var(--color-line-strong)] bg-transparent text-sm leading-none text-inherit opacity-70"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mx-0 mb-0 mt-0.5 text-[10.5px] leading-normal opacity-45">
        La personne doit déjà avoir un compte avec cette adresse, puis ouvrir le lien pour rejoindre
        le workspace.
      </p>
    </section>
  )
}

function CopyButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="cursor-pointer whitespace-nowrap rounded border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-2 py-1 text-[11px] text-inherit"
      title="Copier le lien d’invitation"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(inviteLink(token))
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        } catch {
          /* clipboard indisponible */
        }
      }}
    >
      {copied ? 'Copié ✓' : 'Lien'}
    </button>
  )
}

function Header({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] uppercase tracking-[1px] opacity-50">{title}</span>
      <button
        type="button"
        onClick={onAdd}
        className="cursor-pointer border-none bg-transparent text-sm text-inherit opacity-60"
        title="Inviter un membre"
      >
        +
      </button>
    </div>
  )
}
