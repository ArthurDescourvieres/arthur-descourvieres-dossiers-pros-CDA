import { ApiError } from '../lib/api'
import type { WorkspaceRole } from '../lib/types'

// The server e-mails this link to the invitee (see backend lib/mailer). This
// builds the same link for the in-app "copy link" fallback shown to the OWNER.
export function inviteLink(token: string): string {
  return `${window.location.origin}/?invite=${encodeURIComponent(token)}`
}

export function roleLabel(role: WorkspaceRole): string {
  switch (role) {
    case 'OWNER':
      return 'Propriétaire'
    case 'EDITOR':
      return 'Éditeur'
    case 'VIEWER':
      return 'Lecteur'
  }
}

// Rôles assignables via les sélecteurs (l'OWNER ne s'attribue pas). Partagé par
// InviteSection et MembersModal pour éviter la duplication des `<option>`.
export const ASSIGNABLE_ROLE_OPTIONS = (['EDITOR', 'VIEWER'] as const).map((value) => ({
  value,
  label: roleLabel(value),
}))

export function formatExpiry(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function createInviteErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 400) return 'E-mail invalide ou rôle non autorisé.'
    if (err.status === 403) return 'Seul le propriétaire peut inviter des membres.'
    if (err.status === 404) return 'Aucun utilisateur ne correspond à ce pseudo.'
    if (err.status === 429) return 'Trop de tentatives, réessayez dans un instant.'
  }
  return "L'invitation n'a pas pu être créée."
}

export function acceptInviteErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 404:
        return 'Cette invitation est introuvable ou a été révoquée.'
      case 410:
        return 'Cette invitation a expiré.'
      case 409:
        return 'Cette invitation a déjà été acceptée.'
      case 403:
        return 'Cette invitation a été émise pour une autre adresse e-mail.'
      case 429:
        return 'Trop de tentatives, réessayez dans un instant.'
    }
  }
  return "Impossible d'accepter l'invitation."
}
