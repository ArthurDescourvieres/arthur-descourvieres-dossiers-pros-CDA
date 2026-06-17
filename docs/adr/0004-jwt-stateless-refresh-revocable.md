# ADR 0004 — JWT stateless + refresh révocable

- **Statut** : Accepté
- **Date** : Mai 2026 (itération authentification)

## Contexte

L'authentification doit être **légère** (pas de lecture de session en base à
chaque requête) tout en restant **révocable** (déconnexion, retrait d'un membre,
compromission présumée).

## Décision

Deux jetons JWT signés HS256 :

- **access token** court (15 min), gardé **en mémoire** côté client ;
- **refresh token** (7 j) dans un cookie `httpOnly` + `Secure` + `SameSite=Strict`.

Révocation par **liste de blocage Redis** (on n'inscrit que les tokens révoqués,
avec un TTL calé sur l'expiration) + **`tokenVersion`** porté par l'utilisateur
pour invalider d'un coup toutes ses sessions.

## Alternatives envisagées

- **Sessions serveur classiques** : un identifiant de session + lecture en base
  à chaque requête — plus lourd, état centralisé.
- **JWT sans révocation** : impossible de déconnecter avant expiration.

## Conséquences

**Positives**

- Pas de SessionStore : on ne stocke que les **exceptions** (tokens révoqués).
- Révocation immédiate : `logout`, `removeMember` et `updateMemberRole`
  incrémentent `tokenVersion` → les anciens refresh tokens sont rejetés.
- Cookie `httpOnly`/`SameSite=Strict` : hors de portée du JS (anti-XSS) et
  anti-CSRF par construction.

**Négatives / limites**

- Fenêtre résiduelle de **15 min** si un access token est volé — mitigée par sa
  durée courte et par le fait qu'il ne quitte jamais la mémoire de l'app.
