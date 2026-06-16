# Architecture Decision Records (ADR)

Ce dossier consigne les **décisions d'architecture structurantes** de Memo : le
contexte, l'option retenue, les alternatives écartées et les conséquences. Une
fiche = une décision, numérotée et datée (format inspiré de MADR). Elles servent
de mémoire de conception et de support pour l'entretien technique.

| #                                            | Décision                                     | Statut  |
| -------------------------------------------- | -------------------------------------------- | ------- |
| [0001](0001-hono-framework-http.md)          | Hono comme framework HTTP (plutôt qu'Express) | Accepté |
| [0002](0002-prisma-acces-donnees-sql.md)     | Prisma pour l'accès aux données SQL          | Accepté |
| [0003](0003-redis-nosql-pubsub.md)           | Redis : NoSQL + backplane pub/sub            | Accepté |
| [0004](0004-jwt-stateless-refresh-revocable.md) | JWT stateless + refresh révocable         | Accepté |
| [0005](0005-temps-reel-last-writer-wins.md)  | Temps réel last-writer-wins (pas de CRDT)    | Accepté |
