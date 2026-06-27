export type TestUser = {
  name: string
  email: string
  password: string
}

/**
 * Génère un utilisateur unique à chaque appel (horodatage + aléatoire). Garantit
 * l'idempotence : aucun reset de BDD, aucune collision entre runs ou entre tests
 * parallèles. Le mot de passe est long et aléatoire → improbable d'apparaître
 * dans HIBP, qui est vérifié à l'inscription.
 */
export function uniqueUser(prefix = 'e2e'): TestUser {
  const tag = uniqueLabel(prefix)
  return {
    name: tag,
    email: `${tag}@test.local`,
    password: `Ts7!${tag}-x9Qz_v2`,
  }
}

/** Libellé unique réutilisable (noms de workspace, marqueurs de contenu, …). */
export function uniqueLabel(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now()}-${rand}`
}
