import { useEffect, useRef, useState } from 'react'
import { useAcceptInvitation } from '../hooks/useInvitations'
import { clearPendingInvite, readPendingInvite } from '../lib/pendingInvite'
import { acceptInviteErrorMessage, roleLabel } from './inviteUtils'

type BannerState = 'idle' | 'pending' | 'success' | 'error'

// Reads ?invite=<token> from the URL (once), then strips it so a refresh
// doesn't replay the acceptance.
function consumeInviteToken(): string | null {
  const params = new URLSearchParams(window.location.search)
  let token = params.get('invite')
  if (token) {
    params.delete('invite')
    const qs = params.toString()
    const url = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
    window.history.replaceState(null, '', url)
  } else {
    // Fallback: the token was stashed before the signup/login detour stripped
    // it from the URL (see pendingInvite / main.tsx).
    token = readPendingInvite()
  }
  clearPendingInvite()
  return token
}

// Maps each banner tone to its surface/border classes (per-state colors).
function toneClass(state: BannerState): string {
  if (state === 'success') {
    return 'bg-[var(--color-accent-soft)] border-[var(--color-accent-border)]'
  }
  if (state === 'error') {
    return 'bg-[color-mix(in_oklab,var(--color-danger)_14%,transparent)] border-[var(--color-danger)]'
  }
  return 'bg-[var(--color-surface)]'
}

// Mounted inside the authenticated shell: if the user landed on an invite
// link, accept it and report the outcome.
export function InviteAcceptBanner() {
  const accept = useAcceptInvitation()
  const [state, setState] = useState<BannerState>('idle')
  const [message, setMessage] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const token = consumeInviteToken()
    if (!token) return
    setState('pending')
    accept.mutate(token, {
      onSuccess: (res) => {
        setState('success')
        setMessage(
          `Invitation acceptée — vous avez rejoint le workspace en tant que ${roleLabel(res.role)}.`,
        )
      },
      onError: (err) => {
        setState('error')
        setMessage(acceptInviteErrorMessage(err))
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (state === 'idle') return null

  return (
    <div
      role="status"
      className={`mx-auto mb-4 flex max-w-[760px] items-center justify-between gap-3 rounded-lg border border-[var(--color-line-strong)] px-3.5 py-2.5 ${toneClass(state)}`}
    >
      <span className="text-[13px]">
        {state === 'pending' ? 'Acceptation de l’invitation…' : message}
      </span>
      {state !== 'pending' && (
        <button
          type="button"
          onClick={() => setState('idle')}
          className="cursor-pointer border-none bg-transparent text-base leading-none text-inherit opacity-60"
          title="Fermer"
        >
          ×
        </button>
      )}
    </div>
  )
}
