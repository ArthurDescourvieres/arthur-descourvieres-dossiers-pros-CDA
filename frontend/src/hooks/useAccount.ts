import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'

/**
 * Export RGPD (droit à la portabilité) : récupère le JSON complet du compte et
 * déclenche son téléchargement côté navigateur. On passe par `api()` (et non un
 * lien direct) car le jeton d'accès vit en mémoire, pas dans un cookie lisible.
 */
export function useExportAccount() {
  return useMutation({
    mutationFn: async () => {
      const data = await api<unknown>('/api/me/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'memo-mes-donnees.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    },
  })
}

/**
 * Suppression du compte (droit à l'effacement) : désactive le compte côté serveur
 * (grâce de 30 jours avant purge définitive). La déconnexion est gérée par l'appelant.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => api<void>('/api/me', { method: 'DELETE' }),
  })
}
