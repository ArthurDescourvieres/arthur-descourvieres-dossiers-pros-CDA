# ADR 0003 — Redis : NoSQL + backplane pub/sub

- **Statut** : Accepté
- **Date** : Mai 2026 (itération temps réel — sprint 4)

## Contexte

Plusieurs besoins « non relationnels » apparaissent : révoquer les refresh
tokens, limiter le débit (rate limiting), mettre en cache des données stables,
et **diffuser les événements temps réel entre plusieurs instances** du serveur
Socket.IO.

## Décision

Utiliser **Redis** (client `ioredis`) comme unique brique NoSQL, et
**`@socket.io/redis-adapter`** comme backplane pub/sub du temps réel.

## Alternatives envisagées

- **MongoDB** : adapté au stockage documentaire, mais mal aligné avec le rate
  limiting et le pub/sub — et aurait quand même imposé d'ajouter Redis.
- **Diffusion en mémoire (sans adaptateur)** : enferme la collaboration dans un
  seul processus, non scalable horizontalement.

## Conséquences

**Positives**

- Une seule technologie couvre quatre besoins ; le **TTL natif** sert à la fois
  la blacklist des refresh tokens et la fenêtre de rate limiting.
- L'adaptateur Redis relaie les diffusions d'une room entre instances → la
  collaboration temps réel est **scalable horizontalement**.

**Négatives / limites**

- Le pub/sub Redis n'offre **ni ordre ni livraison garantis** — choix assumé,
  cohérent avec la stratégie last-writer-wins (cf. [ADR 0005](0005-temps-reel-last-writer-wins.md)) :
  une frappe `note:live` perdue est rattrapée au prochain `note:update` persistant.
