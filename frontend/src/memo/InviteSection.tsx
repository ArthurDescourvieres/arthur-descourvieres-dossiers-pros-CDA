import { useState, type CSSProperties, type FormEvent } from 'react'
import { useCreateInvitation, useInvitations, useRevokeInvitation } from '../hooks/useInvitations'
import { createInviteErrorMessage, formatExpiry, inviteLink, roleLabel } from './inviteUtils'

type InvitableRole = 'EDITOR' | 'VIEWER'

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
    <section style={sectionStyle}>
      <Header
        title="Inviter"
        onAdd={() => {
          setOpen((v) => !v)
          setError(null)
        }}
      />

      {open && (
        <form onSubmit={submit} style={formStyle}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com"
            style={inputStyle}
            autoFocus
            required
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as InvitableRole)}
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value="EDITOR">Éditeur</option>
              <option value="VIEWER">Lecteur</option>
            </select>
            <button type="submit" style={primaryButtonStyle} disabled={create.isPending}>
              {create.isPending ? '…' : 'Inviter'}
            </button>
          </div>
          {error && <div style={errorStyle}>{error}</div>}
        </form>
      )}

      {createdToken && (
        <div style={linkBoxStyle}>
          <div style={{ fontSize: 11, opacity: 0.75 }}>
            Lien prêt — aucun e-mail n’est envoyé, transmettez-le vous-même :
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              readOnly
              value={inviteLink(createdToken)}
              style={{ ...inputStyle, flex: 1 }}
              onFocus={(e) => e.currentTarget.select()}
            />
            <CopyButton token={createdToken} />
          </div>
        </div>
      )}

      {invitations.isPending ? (
        <div style={loadingStyle}>…</div>
      ) : pending.length === 0 ? (
        <div style={emptyStyle}>Aucune invitation en attente</div>
      ) : (
        <ul style={listStyle}>
          {pending.map((inv) => (
            <li key={inv.id} style={rowStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={emailStyle}>{inv.email}</span>
                <span style={metaStyle}>
                  {roleLabel(inv.role)} · expire le {formatExpiry(inv.expiresAt)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <CopyButton token={inv.token} />
                <button
                  type="button"
                  onClick={() => revoke.mutate(inv.id)}
                  disabled={revoke.isPending}
                  title="Révoquer l’invitation"
                  style={iconButtonStyle}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p style={hintStyle}>
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
      style={ghostButtonStyle}
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 }}>
        {title}
      </span>
      <button type="button" onClick={onAdd} style={addButtonStyle} title="Inviter un membre">
        +
      </button>
    </div>
  )
}

const sectionStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const formStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
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
const inputStyle: CSSProperties = {
  background: 'var(--color-surface-strong)',
  border: '1px solid var(--color-line-strong)',
  borderRadius: 4,
  color: 'inherit',
  padding: '6px 8px',
  fontSize: 12,
  outline: 'none',
  minWidth: 0,
}
const primaryButtonStyle: CSSProperties = {
  background: 'var(--color-accent)',
  color: 'var(--color-on-accent)',
  border: 'none',
  borderRadius: 4,
  padding: '0 12px',
  fontSize: 12,
  cursor: 'pointer',
}
const ghostButtonStyle: CSSProperties = {
  background: 'var(--color-accent-soft)',
  border: '1px solid var(--color-accent-border)',
  color: 'inherit',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 11,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
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
const addButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  opacity: 0.6,
  fontSize: 14,
  cursor: 'pointer',
}
const linkBoxStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 8,
  borderRadius: 4,
  background: 'var(--color-accent-soft)',
  border: '1px solid var(--color-accent-border)',
}
const errorStyle: CSSProperties = { fontSize: 11.5, color: 'var(--color-danger)' }
const loadingStyle: CSSProperties = { opacity: 0.4, fontSize: 12 }
const emptyStyle: CSSProperties = { opacity: 0.4, fontSize: 12, padding: '2px 6px' }
const emailStyle: CSSProperties = {
  fontSize: 12.5,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const metaStyle: CSSProperties = { fontSize: 11, opacity: 0.5 }
const hintStyle: CSSProperties = {
  fontSize: 10.5,
  opacity: 0.45,
  lineHeight: 1.5,
  margin: '2px 0 0',
}
