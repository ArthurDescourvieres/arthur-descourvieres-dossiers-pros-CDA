import { test, expect } from '@playwright/test'
import { uniqueUser, uniqueLabel } from '../helpers/users'
import {
  registerViaUi,
  createWorkspace,
  createNoteFromEmptyState,
  openFirstNoteViaSidebar,
} from '../helpers/app'

/**
 * Parcours 2 — Persistance workspace + note.
 * Créer un workspace, une note, saisir du contenu, attendre l'autosave
 * (debounce 2s → PATCH /api/notes/:id), RECHARGER la page, puis vérifier que le
 * contenu est toujours là.
 */
test('Parcours 2 — Persistance : workspace + note + contenu survivent au rechargement', async ({
  page,
}) => {
  const user = uniqueUser()
  const marker = uniqueLabel('contenu-persistant')

  await registerViaUi(page, user)
  await createWorkspace(page, uniqueLabel('Espace'))
  await createNoteFromEmptyState(page)

  // Saisie dans l'éditeur + attente de l'autosave réel (PATCH /api/notes/:id).
  const editor = page.getByTestId('note-editor-content')
  await editor.click()
  const autosave = page.waitForResponse(
    (r) => r.request().method() === 'PATCH' && /\/api\/notes\/[^/]+$/.test(r.url()) && r.ok(),
  )
  await editor.pressSequentially(marker, { delay: 25 })
  await autosave

  // L'indicateur d'UI confirme aussi la sauvegarde.
  await expect(page.getByTestId('note-save-status')).toHaveAttribute('data-status', 'saved')

  // Rechargement complet : l'état React est perdu, l'auth est ré-hydratée via le
  // cookie de refresh (httpOnly), puis on rouvre la note par la sidebar.
  await page.reload()
  await expect(page.getByTestId('workspace-shell')).toBeVisible()
  await openFirstNoteViaSidebar(page)

  // Le contenu saisi avant rechargement est bien persisté côté serveur.
  await expect(page.getByTestId('note-editor-content')).toContainText(marker)
})
