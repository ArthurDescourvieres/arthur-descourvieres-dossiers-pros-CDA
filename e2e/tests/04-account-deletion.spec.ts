import { test, expect } from '@playwright/test'
import { uniqueUser } from '../helpers/users'
import { registerViaUi, fillLogin } from '../helpers/app'

/**
 * Parcours 4 — Suppression de compte.
 * Depuis les paramètres, supprimer le compte → vérifier la déconnexion ET
 * l'impossibilité de se reconnecter (compte désactivé → 403).
 */
test('Parcours 4 — Suppression de compte : déconnexion puis reconnexion impossible (403)', async ({
  page,
}) => {
  const user = uniqueUser()

  await registerViaUi(page, user)

  // Paramètres → Mon compte → Supprimer mon compte → Confirmer.
  await page.getByTestId('profile-menu-button').click()
  await page.getByTestId('profile-settings').click()
  await page.getByTestId('account-delete').click()
  await page.getByTestId('account-delete-confirm').click()

  // Déconnexion automatique : la coquille connectée disparaît (retour visiteur).
  await expect(page.getByTestId('workspace-shell')).toHaveCount(0)

  // Reconnexion impossible : le compte est désactivé → l'API répond 403.
  const loginResponse = page.waitForResponse(
    (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST',
  )
  await fillLogin(page, user.email, user.password)
  expect((await loginResponse).status()).toBe(403)

  // On reste non connecté et un message d'erreur s'affiche.
  await expect(page.getByTestId('workspace-shell')).toHaveCount(0)
  await expect(page.getByRole('alert')).toBeVisible()
})
