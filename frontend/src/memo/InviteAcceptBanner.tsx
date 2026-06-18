import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useAcceptInvitation } from '../hooks/useInvitations'
import { acceptInviteErrorMessage, roleLabel } from './inviteUtils'

type BannerState = 'idle' | 'pending' | 'success' | 'error'

// Reads ?invite=<token> from the URL (once), then strips it so a refresh
// doesn't replay the acceptance.
function consumeInviteToken(): string | null {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('invite')
  if (!token) return null
  params.delete('invite')
  const qs = params.toString()
  const url = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
  window.history.replaceState(null, '', url)
  return token
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
    <div role="status" style={{ ...bannerStyle, ...toneStyle(state) }}>
      <span style={{ fontSize: 13 }}>
        {state === 'pending' ? 'Acceptation de l’invitation…' : message}
      </span>
      {state !== 'pending' && (
        <button type="button" onClick={() => setState('idle')} style={dismissStyle} title="Fermer">
          ×
        </button>
      )}
    </div>
  )
}

const bannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  maxWidth: 760,
  margin: '0 auto 16px',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--color-line-strong)',
}

function toneStyle(state: BannerState): CSSProperties {
  if (state === 'success') {
    return { background: 'var(--color-accent-soft)', borderColor: 'var(--color-accent-border)' }
  }
  if (state === 'error') {
    return {
      background: 'color-mix(in oklab, var(--color-danger) 14%, transparent)',
      borderColor: 'var(--color-danger)',
    }
  }
  return { background: 'var(--color-surface)' }
}

const dismissStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  fontSize: 16,
  cursor: 'pointer',
  opacity: 0.6,
  lineHeight: 1,
}
