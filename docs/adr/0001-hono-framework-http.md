# ADR 0001 — Hono comme framework HTTP (plutôt qu'Express)

- **Statut** : Accepté
- **Date** : Mai 2026 (itération 1 — API workspace / dossier / note)

## Contexte

La couche applicative expose une API REST + un canal temps réel. Elle doit
chaîner des middlewares dans un ordre strict (CORS, en-têtes de sécurité, rate
limiting, authentification, validation) et rester **fortement typée** et
**testable sans démarrer un serveur**.

## Décision

Utiliser **Hono** comme framework HTTP du backend.

## Alternatives envisagées

- **Express** : très répandu mais antérieur aux Web Standards, typage faible du
  chaînage de middlewares, `Request`/`Response` non standard.
- **Fastify** : performant et typé, mais écosystème de plugins plus lourd que
  nécessaire pour ce périmètre.

## Conséquences

**Positives**

- API fondée sur les Web Standards (`Request`/`Response`) : le code est testable
  hors serveur via `app.request()` — c'est ce qui porte les tests d'intégration
  (aucun port ouvert, traversée réelle de la chaîne de middlewares).
- Contexte typé (`Context<AppEnv>`) : `c.get('jwtPayload')`, `c.get('userRole')`
  sont typés, ce qui sécurise les contrôleurs et le RBAC.

**Négatives / limites**

- Écosystème plus jeune qu'Express : moins de ressources tierces, quelques
  intégrations à écrire soi-même (ex. middleware de rate limiting maison).
