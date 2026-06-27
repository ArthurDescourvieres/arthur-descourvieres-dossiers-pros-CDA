import { test, expect } from '@playwright/test'
import { uniqueUser } from '../helpers/users'

/**
 * Parcours 1 — Inscription.
 * Créer un compte depuis /register et vérifier l'arrivée dans l'app connectée.
 */
test('Parcours 1 — Inscription : un nouveau compte arrive dans l’app connectée', async ({
  page,
}) => {
  const user = uniqueUser()

  await page.goto('/register')
  await page.locator('#login-name').fill(user.name)
  await page.locator('#login-identifier').fill(user.email)
  await page.locator('#login-password').fill(user.password)
  await page.getByTestId('auth-submit').click()

  // Arrivée dans l'app connectée : la coquille WorkspaceShell est rendue à `/`.
  await expect(page.getByTestId('workspace-shell')).toBeVisible()

  // Compte neuf → aucun workspace : l'écran d'accueil propose d'en créer un,
  // ce qui confirme qu'on est bien dans l'application (et pas sur l'auth).
  await expect(page.getByTestId('empty-action-workspace')).toBeVisible()
})
