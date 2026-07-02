/**
 * Modèles de contenu de notes (Tiptap) pour le seed. Chaque fonction renvoie un
 * document complet, réaliste et varié en mise en forme (titres, listes, code,
 * citations, séparateurs…), afin que l'éditeur paraisse « plein » en capture.
 */
import {
  b,
  code,
  codeBlock,
  doc,
  h,
  hr,
  i,
  image,
  link,
  ol,
  p,
  quote,
  strike,
  u,
  ul,
} from './tiptap.js'
import type { TNode } from './tiptap.js'

export type Body = TNode

export const meeting = (
  date: string,
  attendees: string[],
  decisions: string[],
  actions: [string, string][],
): Body =>
  doc(
    h(1, 'Réunion produit'),
    p(b('Date : '), date, '  ·  ', b('Participants : '), attendees.join(', ')),
    hr(),
    h(2, 'Ordre du jour'),
    ul('Avancement du sprint en cours', 'Revue des retours utilisateurs', 'Prochaines priorités'),
    h(2, 'Décisions'),
    ul(...decisions),
    h(2, "Plan d'action"),
    ol(...actions.map(([who, what]) => [b(who + ' — '), what])),
    quote(i('« On expédie petit, on expédie souvent. »')),
  )

export const spec = (
  feature: string,
  summary: string,
  requirements: string[],
  outOfScope: string[],
): Body =>
  doc(
    h(1, 'Spécification — ' + feature),
    p(b('Statut : '), 'En revue', '   ', b('Auteur : '), 'Équipe Produit'),
    p(summary),
    hr(),
    h(2, 'Objectifs'),
    ul(...requirements.slice(0, 2)),
    h(2, 'Exigences fonctionnelles'),
    ol(...requirements),
    h(2, 'Hors périmètre'),
    ul(...outOfScope),
    h(2, 'Notes techniques'),
    p('Le point sensible reste la ', b('cohérence temps réel'), ' entre onglets. On valide via :'),
    codeBlock(
      'typescript',
      'socket.on("note:update", (patch) => {\n  if (isLocalEcho(patch)) return\n  applyRemote(patch)\n})',
    ),
  )

export const adr = (
  num: string,
  title: string,
  context: string,
  decision: string,
  consequences: string[],
): Body =>
  doc(
    h(1, `ADR ${num} — ${title}`),
    p(b('Statut : '), u('Accepté'), '   ·   ', b('Date : '), '2026'),
    h(2, 'Contexte'),
    p(context),
    h(2, 'Décision'),
    p(decision),
    h(2, 'Conséquences'),
    ul(...consequences),
    hr(),
    p(i('Voir aussi : '), link('le registre des décisions', 'https://example.com/adr')),
  )

export const guide = (title: string, intro: string, steps: string[], tips: string[]): Body =>
  doc(
    h(1, title),
    p(intro),
    h(2, 'Étapes'),
    ol(...steps),
    h(2, 'Bonnes pratiques'),
    ul(...tips),
    quote(
      '💡 ',
      b('Astuce : '),
      'gardez un environnement reproductible — ',
      code('docker compose up'),
      '.',
    ),
  )

export const runbook = (title: string, when: string, steps: string[], rollback: string): Body =>
  doc(
    h(1, 'Runbook — ' + title),
    p(b('Déclencheur : '), when),
    h(2, 'Procédure'),
    ol(...steps),
    h(2, 'Vérification'),
    p(
      'Confirmer le rétablissement via ',
      code('curl -I https://app.example.com'),
      ' (attendu : ',
      b('200'),
      ').',
    ),
    h(2, 'Retour arrière'),
    p(rollback),
  )

export const checklist = (title: string, intro: string, done: string[], todo: string[]): Body =>
  doc(
    h(1, title),
    p(intro),
    h(2, 'Fait'),
    ul(...done.map((x) => [strike(x)])),
    h(2, 'À faire'),
    ul(...todo),
  )

export const changelog = (
  version: string,
  added: string[],
  fixed: string[],
  changed: string[],
): Body =>
  doc(
    h(1, `Notes de version — ${version}`),
    p(i('Publié à destination de tous les espaces.')),
    hr(),
    h(2, '✨ Ajouté'),
    ul(...added),
    h(2, '🐛 Corrigé'),
    ul(...fixed),
    h(2, '♻️ Modifié'),
    ul(...changed),
  )

export const article = (title: string, paragraphs: string[], bullets: string[]): Body =>
  doc(
    h(1, title),
    p(i('Brouillon — relecture en cours.')),
    ...paragraphs.map((para) => p(para)),
    h(2, 'À retenir'),
    ul(...bullets),
    p('En savoir plus : ', link('documentation interne', 'https://example.com/docs'), '.'),
  )

export const recipe = (
  title: string,
  servings: string,
  ingredients: string[],
  steps: string[],
): Body =>
  doc(
    h(1, title),
    p(b('Pour : '), servings, '   ·   ', b('Temps : '), '40 min'),
    h(2, 'Ingrédients'),
    ul(...ingredients),
    h(2, 'Préparation'),
    ol(...steps),
    quote('Se déguste tiède. ', i('Bon appétit !')),
  )

export const notesList = (title: string, intro: string, bullets: string[]): Body =>
  doc(h(1, title), p(intro), ul(...bullets))

export const persona = (
  name: string,
  role: string,
  goals: string[],
  frustrations: string[],
): Body =>
  doc(
    h(1, 'Persona — ' + name),
    p(b('Rôle : '), role),
    h(2, 'Objectifs'),
    ul(...goals),
    h(2, 'Frustrations'),
    ul(...frustrations),
    hr(),
    p(
      i('« '),
      i(
        name === 'Camille'
          ? "J'ai besoin de retrouver mes notes en 3 secondes."
          : 'Je veux collaborer sans me marcher dessus.',
      ),
      i(' »'),
    ),
  )

/** Note « vedette » illustrée : intègre la couverture en pièce jointe (URL injectée). */
export const coverNote = (title: string, lead: string, imageSrc: string, points: string[]): Body =>
  doc(
    h(1, title),
    p(lead),
    image(imageSrc, title, 680),
    h(2, 'Principes'),
    ul(...points),
    p(
      'Ces choix sont décrits en détail dans le ',
      link('guide de style', 'https://example.com/style'),
      '.',
    ),
  )

/** Petit corps de remplissage pour les notes secondaires de l'arbre. */
export const short = (title: string, lead: string, bullets: string[]): Body =>
  doc(h(2, title), p(lead), ul(...bullets))
