// The invite token must survive the signup/login detour: a guest landing on
// /?invite=<token> is routed through the auth screens, which drop the query
// string. We stash the token in sessionStorage at boot (see main.tsx) and
// replay it once authenticated (InviteAcceptBanner) or read it on the guest
// invite screen (App / InviteGuestGate). sessionStorage (not localStorage):
// scoped to the tab, cleared when it closes.
const KEY = 'memo.pendingInvite'

/** Read ?invite=<token> from the current URL and stash it. Safe to call once at boot. */
export function capturePendingInviteFromUrl(): void {
  try {
    const token = new URLSearchParams(window.location.search).get('invite')
    if (token) sessionStorage.setItem(KEY, token)
  } catch {
    /* sessionStorage unavailable (private mode) — ignore, URL flow still works */
  }
}

export function readPendingInvite(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function clearPendingInvite(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
