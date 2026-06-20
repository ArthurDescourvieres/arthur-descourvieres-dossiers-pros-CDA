import { useInviteMeta } from '../hooks/useInvitations'
import { clearPendingInvite } from '../lib/pendingInvite'
import { roleLabel } from './inviteUtils'
import { Login } from './Login'
import { Spinner } from './Spinner'

// Shown to a signed-out visitor who arrived via an invite link. Fetches the
// public invite metadata, then renders the auth screen with the invited email
// prefilled and locked so acceptance (which requires an exact email match)
// can't silently fail. Once the visitor signs up / logs in, InviteAcceptBanner
// replays the stashed token and finalizes membership.
export function InviteGuestGate({ token }: { token: string }) {
  const meta = useInviteMeta(token)

  const goHome = () => {
    clearPendingInvite()
    window.location.href = '/'
  }

  if (meta.isPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--color-bg)]">
        <Spinner size={36} />
      </div>
    )
  }

  if (meta.isError || !meta.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--color-bg)] p-6 text-[var(--color-text)]">
        <div className="flex w-full max-w-[360px] flex-col gap-3 rounded-xl bg-[var(--color-surface)] p-7 text-center shadow-[0_8px_32px_var(--color-shadow)]">
          <h1 className="m-0 text-lg font-semibold">Invitation indisponible</h1>
          <p className="m-0 text-sm opacity-70">
            Cette invitation est introuvable, a été révoquée ou a expiré. Demandez à la personne qui
            vous a invité de vous en renvoyer une.
          </p>
          <button
            type="button"
            onClick={goHome}
            className="mt-1 cursor-pointer rounded-md border-none bg-[var(--color-accent)] px-3 py-2.5 text-sm font-semibold text-[var(--color-on-accent)]"
          >
            Aller à l’accueil
          </button>
        </div>
      </div>
    )
  }

  const { workspaceName, role, email } = meta.data
  return (
    <Login
      initialMode="register"
      lockedEmail={email}
      inviteNote={`Invitation à rejoindre « ${workspaceName} » en tant que ${roleLabel(role)}.`}
      onBack={goHome}
    />
  )
}
