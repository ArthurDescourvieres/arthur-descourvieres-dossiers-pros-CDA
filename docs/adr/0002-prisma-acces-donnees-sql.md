# ADR 0002 — Prisma pour l'accès aux données SQL

- **Statut** : Accepté
- **Date** : Mai 2026 (itération 1 — modèles workspace / dossier / note)

## Contexte

L'application a besoin d'un accès à PostgreSQL **typé**, avec des **migrations
versionnées** (exigence du référentiel) et une protection structurelle contre
l'injection SQL.

## Décision

Utiliser **Prisma** comme composant d'accès aux données relationnel
(`prisma generate` + migrations dans `backend/prisma/`).

## Alternatives envisagées

- **TypeORM** : à base de décorateurs, typage moins fiable, migrations moins
  déterministes.
- **Knex / SQL brut** : contrôle total mais aucun typage, plus d'erreurs au
  runtime.
- **Drizzle** : prometteur mais plus récent au moment du choix.

## Conséquences

**Positives**

- `schema.prisma` est l'unique source de vérité : les types TypeScript sont
  générés, une faute de colonne échoue **à la compilation**.
- Requêtes **paramétrées par construction** → couvre OWASP A03 (injection).
- Migrations SQL datées et rejouables (`prisma migrate deploy` en production).

**Négatives / limites**

- Pour les requêtes que l'ORM ne couvre pas — notamment la **recherche
  full-text** (`tsvector`, `plainto_tsquery`, `ts_rank`, `ts_headline`) — on
  passe par `$queryRaw` avec paramètres liés (toujours sans injection).
- Le champ `searchVector` est déclaré `Unsupported("tsvector")` et géré par une
  migration SQL brute (colonne `GENERATED ALWAYS AS … STORED`).
