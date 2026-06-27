import { test, expect } from '@playwright/test'
import { uniqueUser, uniqueLabel } from '../helpers/users'
import {
  registerViaUi,
  createWorkspace,
  createNoteFromEmptyState,
  openFirstNoteViaSidebar,
} from '../helpers/app'

/**
 * Parcours 3 — Édition collaborative temps réel entre DEUX contextes.
 * Même compte, deux contextes de navigateur indépendants, même note (rôle
 * OWNER/EDITOR des deux côtés). Une frappe dans A apparaît dans B via Socket.IO
 * (événement `note:live`, non persistant et non rejoué).
 */
test('Parcours 3 — Collaboration temps réel : une frappe dans A apparaît dans B', async ({
  browser,
}) => {
  const user = uniqueUser()
  const marker = uniqueLabel('temps-reel')

  // Contexte A : crée le compte, le workspace et la note ; la note reste ouverte.
  const ctxA = await browser.newContext()
  const pageA = await ctxA.newPage()
  await registerViaUi(pageA, user)
  await createWorkspace(pageA, uniqueLabel('Espace'))
  await createNoteFromEmptyState(pageA)

  // Contexte B : même compte, second contexte de navigateur indépendant. On
  // clone la session via le cookie de refresh (storageState) plutôt que de
  // rappeler /login : B se ré-authentifie silencieusement (token d'accès propre,
  // socket propre). Cela évite aussi le rate-limit login (5/min/IP) — en dev le
  // proxy Vite ne transmet pas l'IP cliente, donc tous les /login partagent un
  // même compteur, un artefact d'environnement local.
  const ctxB = await browser.newContext({ storageState: await ctxA.storageState() })
  const pageB = await ctxB.newPage()
  await pageB.goto('/')
  await expect(pageB.getByTestId('workspace-shell')).toBeVisible()
  await openFirstNoteViaSidebar(pageB)

  // B a rejoint la room Socket.IO → A voit sa présence. On attend ce signal
  // AVANT de taper : les `note:live` ne sont pas rejoués, B doit être présent.
  await expect(pageA.getByTestId('note-presence')).toBeVisible({ timeout: 15_000 })

  // A tape ; B doit recevoir le texte en temps réel, sans rechargement.
  const editorA = pageA.getByTestId('note-editor-content')
  const editorB = pageB.getByTestId('note-editor-content')
  await editorA.click()
  await editorA.pressSequentially(marker, { delay: 30 })

  // Robustesse : à l'ouverture, l'éditeur de B arme un verrou anti-écho (~1,5 s)
  // via l'onUpdate d'initialisation de ProseMirror — les éditions locales
  // priment sur le distant. Si la salve initiale tombe dans cette fenêtre, elle
  // est ignorée côté B. Ce verrou n'est armé qu'UNE fois (les updates entrants
  // sont appliqués sans ré-émettre d'onUpdate) : on re-pousse donc de petits
  // événements jusqu'à ce que B reflète le texte — dès le verrou retombé, le
  // prochain événement applique le document complet. Comportement applicatif
  // existant (non modifié) ; la boucle le rend déterministe côté test.
  await expect(async () => {
    await editorA.pressSequentially('.', { delay: 0 })
    await expect(editorB).toContainText(marker, { timeout: 1000 })
  }).toPass({ timeout: 20_000 })

  await ctxA.close()
  await ctxB.close()
})
