# ADR 0005 — Temps réel last-writer-wins (descope du CRDT)

- **Statut** : Accepté
- **Date** : Mai 2026 (sprint 4 — replanification documentée)

## Contexte

L'édition collaborative temps réel a fait déborder l'itération de deux semaines :
deux problèmes connexes ont été sous-estimés — la **résolution des éditions
simultanées** sur un même paragraphe et la **résilience aux coupures réseau**.

## Décision

Retenir une stratégie **last-writer-wins (LWW)** : le dernier `note:update`
persisté fait foi, et côté client une modification distante n'est jamais
appliquée tant que l'utilisateur local est en train de taper (`isTypingRef`).
**Ne pas** implémenter de mécanisme CRDT pour la session d'examen.

## Alternatives envisagées

- **CRDT** (Yjs, Automerge) : fusion caractère par caractère sans perte, mais
  coût de modélisation élevé, hors périmètre du diplôme.
- **OT** (Operational Transform) : puissant mais complexe à implémenter et tester.

## Conséquences

**Positives**

- Implémentation simple, livrable dans les temps après replanification.
- Comportement prévisible : aucune corruption, le dernier état persisté fait foi.
- La résilience réseau est traitée par la reconnexion Socket.IO (réabonnement
  `note:join` + resynchronisation depuis la base).

**Négatives / limites**

- Pas de fusion fine : en édition simultanée du même paragraphe, une frappe peut
  être écrasée (rattrapée au prochain `note:update`). Un vrai CRDT est **versé
  aux perspectives d'évolution** du dossier.
