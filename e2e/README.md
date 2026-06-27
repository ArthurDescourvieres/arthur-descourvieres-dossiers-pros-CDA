# Tests E2E Playwright — Memo

Suite end-to-end **locale** (hors CI), **Chromium uniquement**, qui pilote le
front sur `http://localhost:5173` et valide 4 parcours utilisateur contre la
stack réelle (`docker compose`).

> À jouer **en local avant chaque release** (volontairement non branché en CI).

## Parcours couverts

| # | Fichier | Vérifie |
|---|---------|---------|
| 1 | [`tests/01-register.spec.ts`](tests/01-register.spec.ts) | Inscription → arrivée dans l'app connectée |
| 2 | [`tests/02-note-persistence.spec.ts`](tests/02-note-persistence.spec.ts) | Workspace + note + contenu : autosave (PATCH) puis **persistance après rechargement** |
| 3 | [`tests/03-realtime-collab.spec.ts`](tests/03-realtime-collab.spec.ts) | Édition collaborative **temps réel** entre 2 contextes (Socket.IO) |
| 4 | [`tests/04-account-deletion.spec.ts`](tests/04-account-deletion.spec.ts) | Suppression de compte → déconnexion + **reconnexion impossible (403)** |

## Prérequis : la stack doit tourner

Les tests **ne démarrent pas** la stack ; ils s'attendent à la trouver en place.
Depuis la **racine du repo** :

```bash
docker compose up -d
# Attendre que l'API réponde :
curl http://localhost:5173/api/health   # -> {"status":"ok"}
```

`web` (Vite :5173) proxifie `/api` et `/socket.io` vers `api` (:3000) — aucune
config d'URL d'API ni de CORS n'est nécessaire côté tests. Un *global setup*
sonde `/api/health` et échoue vite, avec la marche à suivre, si rien ne répond.

## Installation (une fois)

```bash
cd e2e
npm install
npm run install:browsers   # télécharge le binaire Chromium de Playwright
```

## Lancer

```bash
cd e2e
npm run test:e2e            # les 4 parcours, headless
```

Variantes utiles :

```bash
npm run test:e2e:headed    # navigateur visible
npm run test:e2e:ui        # mode UI interactif Playwright
npm run report             # ouvrir le dernier rapport HTML
npx playwright test tests/03-realtime-collab.spec.ts   # un seul parcours
```

Depuis la **racine** (raccourcis qui délèguent au dossier `e2e/`) :

```bash
npm run e2e:setup          # install deps + Chromium
npm run test:e2e           # lance la suite
```

## Idempotence

Chaque test génère un utilisateur **unique** (`e2e-<timestamp>-<rand>@test.local`,
voir [`helpers/users.ts`](helpers/users.ts)). Aucun reset de BDD requis, aucune
collision entre runs ni entre tests parallèles. Les comptes créés sont
désactivés/abandonnés ; ils n'interfèrent pas avec les exécutions suivantes.

## Note — rate-limit login en dev

`/api/auth/login` est limité à **5 tentatives/min/IP**. En dev, le proxy Vite ne
transmet pas l'IP cliente : toutes les requêtes partagent donc un seul compteur.
La suite minimise les `/login` pour rester loin de cette limite :

- le parcours 3 ouvre le 2nd contexte en **clonant la session** (cookie de
  refresh via `storageState`) au lieu de rappeler `/login` ;
- seul le parcours 4 effectue un vrai `/login` (la vérification du 403).

→ ~**1 login par run**. Évitez seulement d'enchaîner la suite plus de ~5 fois en
une minute (sinon un `429` peut apparaître). En production (Caddy renseigne
`X-Forwarded-For`) chaque client a son propre compteur : ce point ne concerne que
le dev local.

## Sélecteurs

Les tests s'appuient sur des `data-testid` stables ajoutés au front (et sur les
`id` existants `#login-*` du formulaire d'auth). Aucun sélecteur CSS/texte
fragile. Liste des hooks utilisés :

`auth-submit`, `workspace-shell`, `empty-action-workspace`, `empty-action-note`,
`workspace-name-input`, `workspace-submit`, `note-title-input`,
`note-editor-content`, `note-save-status` (+ `data-status`), `note-presence`,
`tree-folder` / `tree-note` (+ `data-id`), `profile-menu-button`,
`profile-settings`, `account-delete`, `account-delete-confirm`.

## Config

`Chromium`, `baseURL=http://localhost:5173` (surcharger via `E2E_BASE_URL`),
parallélisme activé, aucun retry (vert « franc »). Voir
[`playwright.config.ts`](playwright.config.ts).
