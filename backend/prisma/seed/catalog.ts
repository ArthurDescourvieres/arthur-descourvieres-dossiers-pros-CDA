/**
 * Catalogue déclaratif du seed : utilisateurs, espaces de travail, arborescence
 * de dossiers et notes. Le contenu riche vit dans bodies.ts ; ici on assemble la
 * structure (rôles, invitations, corbeille, couvertures) consommée par seed.ts.
 */
import * as B from './bodies.js'
import type { Body } from './bodies.js'
import type { PaletteKey } from './png.js'

/** Sentinelle remplacée par l'URL réelle de la pièce jointe image au moment de l'insertion. */
export const COVER_PLACEHOLDER = '__COVER_SRC__'

export type SeedRole = 'EDITOR' | 'VIEWER'
export type SeedUser = { key: string; name: string; email: string }

export type SeedNote = {
  title: string
  body: Body
  author?: string
  trashed?: boolean
  cover?: PaletteKey
  gallery?: PaletteKey[]
}
export type SeedFolder = {
  name: string
  trashed?: boolean
  notes?: SeedNote[]
  children?: SeedFolder[]
}
export type SeedWorkspace = {
  name: string
  icon: string
  description?: string
  owner: string
  members?: { user: string; role: SeedRole }[]
  invites?: { email: string; role: SeedRole }[]
  folders: SeedFolder[]
}

export const MAIN_USER = 'arthur'
export const DEMO_PASSWORD = 'MemoDemo2026!'

export const USERS: SeedUser[] = [
  { key: 'arthur', name: 'Arthur Descourvières', email: 'arthur@memo.dev' },
  { key: 'camille', name: 'Camille Moreau', email: 'camille@memo.dev' },
  { key: 'lucas', name: 'Lucas Bernard', email: 'lucas@memo.dev' },
  { key: 'sofia', name: 'Sofia Rossi', email: 'sofia@memo.dev' },
  { key: 'thomas', name: 'Thomas Lefebvre', email: 'thomas@memo.dev' },
  { key: 'emma', name: 'Emma Dubois', email: 'emma@memo.dev' },
  { key: 'noah', name: 'Noah Martin', email: 'noah@memo.dev' },
  { key: 'lea', name: 'Léa Garcia', email: 'lea@memo.dev' },
]

const cover = (title: string, lead: string, points: string[]): Body =>
  B.coverNote(title, lead, COVER_PLACEHOLDER, points)

export const WORKSPACES: SeedWorkspace[] = [
  {
    name: 'Produit & Roadmap',
    icon: 'rocket',
    description: 'Vision, priorités et discovery produit',
    owner: 'arthur',
    members: [
      { user: 'camille', role: 'EDITOR' },
      { user: 'lucas', role: 'EDITOR' },
      { user: 'thomas', role: 'EDITOR' },
      { user: 'sofia', role: 'VIEWER' },
    ],
    invites: [
      { email: 'nina.acker@partenaire.io', role: 'EDITOR' },
      { email: 'hugo.petit@freelance.dev', role: 'VIEWER' },
    ],
    folders: [
      {
        name: 'Vision',
        notes: [
          {
            title: 'Vision produit 2026',
            body: B.article(
              'Vision produit 2026',
              [
                "Memo doit devenir l'espace de travail où une équipe pense à voix haute : des notes vivantes, partagées, recherchables, et synchronisées en temps réel.",
                'Nous misons sur trois piliers : la rapidité perçue, la collaboration sans friction, et la confiance (sécurité, RGPD, fiabilité).',
              ],
              [
                'Rapidité : tout sous 100 ms perçues',
                'Collaboration : présence et co-édition',
                'Confiance : chiffrement, audit, sauvegardes',
              ],
            ),
          },
          {
            title: 'OKR — Trimestre 3',
            body: B.notesList('OKR T3', 'Objectifs et résultats clés du trimestre.', [
              'O1 — Activer 60 % des nouveaux espaces sous 7 jours',
              'KR1 — Onboarding guidé en 4 étapes',
              'KR2 — Modèles de notes prêts à l’emploi',
              'O2 — Réduire le temps de chargement P95 sous 250 ms',
            ]),
          },
          {
            title: 'Persona — Camille',
            body: B.persona(
              'Camille',
              'Cheffe de projet',
              ['Centraliser les comptes-rendus', 'Suivre les décisions'],
              ['Outils éparpillés', 'Recherche lente'],
            ),
          },
          {
            title: 'Persona — Lucas',
            body: B.persona(
              'Lucas',
              'Développeur',
              ['Documenter vite', 'Lier code et specs'],
              ['Wikis lourds', 'Markdown sans collaboration'],
            ),
          },
        ],
      },
      {
        name: 'Roadmap',
        children: [
          {
            name: 'T3 — En cours',
            notes: [
              {
                title: 'Release 2.4 — notes',
                body: B.changelog(
                  '2.4',
                  ['Recherche plein-texte', 'Présence en temps réel', 'Corbeille par espace'],
                  ['Fuite de focus dans l’éditeur', 'Slugs en double'],
                  ['Cache des espaces (TTL 60 s)'],
                ),
              },
              {
                title: 'Backlog priorisé T3',
                body: B.notesList('Backlog priorisé', 'Trié par impact / effort.', [
                  'Partage public de note (P0)',
                  'Export PDF (P1)',
                  'Mentions @utilisateur (P1)',
                  'Historique de versions (P2)',
                ]),
              },
              {
                title: 'Discovery — Paiement',
                body: B.spec(
                  'Abonnements',
                  'Explorer un modèle freemium avec quotas par espace.',
                  [
                    'Plan gratuit limité à 3 espaces',
                    'Facturation mensuelle et annuelle',
                    'Portail de gestion',
                  ],
                  ['Facturation à l’usage', 'Multi-devises'],
                ),
              },
            ],
          },
          {
            name: 'T4 — Exploration',
            notes: [
              {
                title: 'Idées T4',
                body: B.notesList('Idées T4', 'En vrac, à challenger.', [
                  'Mode hors-ligne',
                  'Application mobile',
                  'API publique',
                  'Intégrations (Slack, Linear)',
                ]),
              },
              {
                title: 'Mode hors-ligne',
                body: B.spec(
                  'Mode hors-ligne',
                  'Permettre la lecture et l’édition sans connexion, avec resynchronisation.',
                  [
                    'File d’attente locale des modifications',
                    'Résolution de conflits dernier-écrivain',
                    'Indicateur d’état de synchro',
                  ],
                  ['Édition concurrente hors-ligne avancée'],
                ),
              },
            ],
          },
        ],
      },
      {
        name: 'Spécifications',
        notes: [
          {
            title: 'Spec — Partage public',
            body: B.spec(
              'Partage public',
              'Publier une note en lecture seule via un lien signé.',
              [
                'Lien révocable',
                'Expiration optionnelle',
                'Rendu lecture seule sans authentification',
              ],
              ['Édition par les invités', 'Indexation moteur'],
            ),
          },
          {
            title: 'Spec — Recherche avancée',
            body: B.spec(
              'Recherche avancée',
              'Filtres par espace, dossier, auteur et date.',
              [
                'Filtres combinables',
                'Surlignage des résultats',
                'Recherche dans le contenu et les titres',
              ],
              ['Recherche sémantique IA'],
            ),
          },
          {
            title: 'Spec — Mentions',
            body: B.spec(
              'Mentions @utilisateur',
              'Notifier un membre dans une note.',
              [
                'Auto-complétion des membres',
                'Notification en cloche',
                'Lien profond vers le paragraphe',
              ],
              ['Mentions de groupes'],
            ),
          },
          {
            title: 'Spec abandonnée — Widgets',
            body: B.short('Widgets de tableau de bord', 'Idée mise de côté pour l’instant.', [
              'Trop tôt dans la roadmap',
              'Besoin non confirmé',
            ]),
            trashed: true,
          },
        ],
      },
      {
        name: 'Réunions',
        notes: [
          {
            title: 'Weekly produit — 24/06',
            body: B.meeting(
              '24 juin 2026',
              ['Arthur', 'Camille', 'Lucas', 'Thomas'],
              ['Prioriser le partage public pour la 2.5', 'Reporter l’export PDF'],
              [
                ['Camille', 'rédiger la spec de partage'],
                ['Lucas', 'prototyper le lien signé'],
                ['Thomas', 'estimer la charge'],
              ],
            ),
          },
          {
            title: 'Comité de pilotage — Juin',
            body: B.meeting(
              '18 juin 2026',
              ['Arthur', 'Direction'],
              ['Valider le budget T3', 'Recruter un designer'],
              [
                ['Arthur', 'ouvrir le poste design'],
                ['Camille', 'préparer le reporting'],
              ],
            ),
          },
          {
            title: 'Rétro — Sprint 14',
            body: B.notesList('Rétro Sprint 14', 'Ce qui a marché, ce qu’on améliore.', [
              '👍 La présence temps réel a été un succès',
              '👎 Trop de bugs de focus',
              '🎯 Renforcer les tests E2E',
            ]),
          },
          {
            title: 'CR obsolète — Mars',
            body: B.short('Compte-rendu de mars', 'Archivé, conservé par erreur.', [
              'Points caducs',
              'À supprimer définitivement',
            ]),
            trashed: true,
          },
        ],
      },
      {
        name: 'Archives 2025',
        trashed: true,
        notes: [
          {
            title: 'Roadmap 2025 (obsolète)',
            body: B.notesList('Roadmap 2025', 'Conservée pour mémoire.', [
              'MVP livré',
              'Première bêta fermée',
            ]),
          },
          {
            title: 'Anciennes personae',
            body: B.notesList('Anciennes personae', 'Remplacées par la nouvelle segmentation.', [
              'Persona « étudiant »',
              'Persona « freelance »',
            ]),
          },
        ],
      },
    ],
  },
  {
    name: 'Engineering',
    icon: 'code',
    description: 'Architecture, guides et exploitation',
    owner: 'arthur',
    members: [
      { user: 'lucas', role: 'EDITOR' },
      { user: 'thomas', role: 'EDITOR' },
      { user: 'noah', role: 'EDITOR' },
      { user: 'emma', role: 'VIEWER' },
    ],
    invites: [{ email: 'dev.stagiaire@memo.dev', role: 'VIEWER' }],
    folders: [
      {
        name: 'Architecture',
        notes: [
          {
            title: 'ADR 001 — Choix de la stack',
            body: B.adr(
              '001',
              'Hono + Prisma + React',
              'Besoin d’une API typée, rapide à démarrer, et d’un ORM sûr.',
              'Adopter Hono (Node), Prisma (PostgreSQL) et React + Vite côté client.',
              ['Typage de bout en bout', 'Migrations versionnées', 'Démarrage Docker simple'],
            ),
          },
          {
            title: 'ADR 002 — Temps réel',
            body: B.adr(
              '002',
              'Socket.IO + Redis',
              'Synchroniser les notes entre onglets et utilisateurs.',
              'Utiliser Socket.IO avec un adaptateur Redis pour la diffusion multi-instances.',
              ['Présence et co-édition', 'Scalabilité horizontale', 'Reconnexion automatique'],
            ),
          },
          {
            title: 'Schéma de données',
            body: B.guide(
              'Schéma de données',
              'Vue d’ensemble des entités et relations.',
              [
                'User possède des Workspace',
                'Workspace contient des Folder',
                'Folder contient des Note',
                'Note porte des Attachment',
              ],
              ['Clés primaires cuid', 'Suppression douce via deletedAt', 'Index de listing dédiés'],
            ),
          },
        ],
      },
      {
        name: 'Guides',
        notes: [
          {
            title: 'Onboarding développeur',
            body: B.guide(
              'Onboarding développeur',
              'Mettre en route l’environnement en moins de 15 minutes.',
              [
                'Cloner le dépôt',
                'Copier .env.example vers .env',
                'docker compose up -d',
                'Appliquer les migrations Prisma',
                'Lancer les tests',
              ],
              ['Utiliser le port 5435 pour Postgres', 'Régénérer le client après chaque migration'],
            ),
          },
          {
            title: 'Conventions de code',
            body: B.notesList('Conventions de code', 'Pour un code lisible et homogène.', [
              'Fichiers < 400 lignes',
              'Nommer en français les commentaires métier',
              'Tests à côté du code',
              'Pas de any non justifié',
            ]),
          },
          {
            title: 'Procédure de déploiement',
            body: B.runbook(
              'Déploiement',
              'Sur tag de release validé',
              [
                'Vérifier la CI verte',
                'Construire et pousser les images',
                'docker compose -f prod up -d',
                'Lancer prisma migrate deploy',
              ],
              'Revenir à l’image précédente et restaurer la dernière sauvegarde.',
            ),
          },
        ],
      },
      {
        name: 'Runbooks',
        notes: [
          {
            title: 'Postmortem — Incident TLS',
            body: B.runbook(
              'Certificat TLS indisponible',
              'Alerte « TLS internal_error », HTTPS down',
              [
                'Diagnostiquer : HTTP OK mais HTTPS en erreur',
                'Vérifier les droits du volume caddy_data',
                'chown -R app:app /data /config',
                'Redémarrer Caddy',
              ],
              'Restaurer le volume de certificats depuis la sauvegarde.',
            ),
          },
          {
            title: 'Restaurer une sauvegarde',
            body: B.runbook(
              'Restauration base de données',
              'Perte ou corruption de données',
              [
                'Arrêter l’API',
                'Récupérer le dump le plus récent',
                'pg_restore dans une base neuve',
                'Basculer la connexion',
              ],
              'Repartir du dump précédent si la restauration échoue.',
            ),
          },
          {
            title: 'Rotation des secrets',
            body: B.checklist(
              'Rotation des secrets',
              'Trimestrielle.',
              ['Ancien JWT_SECRET retiré'],
              ['Générer un nouveau secret', 'Mettre à jour le coffre', 'Invalider les sessions'],
            ),
          },
        ],
      },
      {
        name: 'Tickets',
        notes: [
          {
            title: 'BUG — Focus perdu à l’ouverture',
            body: B.short(
              'Focus perdu',
              'Le curseur saute hors de l’éditeur à l’ouverture d’une note.',
              ['Repro : ouvrir deux notes vite', 'Piste : isTypingRef', 'Sévérité : moyenne'],
            ),
          },
          {
            title: 'TECH — Migrer vers Node 22',
            body: B.short('Node 22', 'Aligner l’image Docker sur la LTS.', [
              'Mettre à jour le Dockerfile',
              'Relancer la CI',
              'Vérifier argon2',
            ]),
          },
          {
            title: 'PERF — Cache des espaces',
            body: B.short('Cache espaces', 'Mettre en cache GET /workspaces/:id.', [
              'TTL 60 s',
              'Invalidation à l’écriture',
              'En-tête X-Cache',
            ]),
          },
          {
            title: 'Doublon — ticket fermé',
            body: B.short('Doublon', 'Fermé car redondant avec un autre ticket.', [
              'Voir le ticket d’origine',
              'Aucune action requise',
            ]),
            trashed: true,
          },
        ],
      },
    ],
  },
  {
    name: 'Design System',
    icon: 'palette',
    description: 'Fondations visuelles et composants',
    owner: 'arthur',
    members: [
      { user: 'emma', role: 'EDITOR' },
      { user: 'sofia', role: 'VIEWER' },
      { user: 'camille', role: 'VIEWER' },
    ],
    folders: [
      {
        name: 'Fondations',
        notes: [
          {
            title: 'Couleurs & thèmes',
            cover: 'violet',
            body: cover(
              'Couleurs & thèmes',
              'La palette repose sur des tokens sémantiques (surface, texte, accent) déclinés en clair et sombre.',
              [
                'Tokens centralisés dans tokens.css',
                'Contraste AA minimum',
                'Accent unique par thème',
              ],
            ),
          },
          {
            title: 'Typographie',
            cover: 'ocean',
            body: cover(
              'Typographie',
              'Une seule famille variable, une échelle modulaire de 12 à 28 px.',
              ['Titres en 700', 'Corps en 400 / 1.6', 'Chiffres tabulaires pour les compteurs'],
            ),
          },
          {
            title: 'Grille & espacements',
            cover: 'forest',
            body: cover(
              'Grille & espacements',
              'Espacements multiples de 4 px, rayons de 8 à 24 px.',
              ['Base 4 px', 'Conteneur max 760 px pour la lecture', 'Marges généreuses'],
            ),
          },
        ],
      },
      {
        name: 'Composants',
        notes: [
          {
            title: 'Boutons',
            cover: 'sunset',
            gallery: ['amber', 'graphite'],
            body: cover('Boutons', 'Trois variantes : primaire, secondaire, fantôme.', [
              'État focus visible',
              'Cible tactile 40 px',
              'Libellés à l’infinitif',
            ]),
          },
          {
            title: 'Champs de formulaire',
            body: B.guide(
              'Champs de formulaire',
              'Cohérence des entrées texte.',
              ['Étiquette toujours visible', 'Message d’erreur sous le champ', 'Halo de focus net'],
              ['Pas de placeholder en guise d’étiquette'],
            ),
          },
          {
            title: 'Modales',
            body: B.guide(
              'Modales',
              'Fenêtres de dialogue accessibles.',
              ['Piéger le focus', 'Fermer via Échap et clic extérieur', 'aria-modal'],
              ['Limiter à une action principale'],
            ),
          },
        ],
      },
      {
        name: 'Icônes & illustrations',
        notes: [
          {
            title: 'Banque d’icônes',
            body: B.notesList('Banque d’icônes', 'Lucide, rendu cohérent.', [
              'Trait 1.75',
              'Taille 18–20 px',
              'Couleur héritée du texte',
            ]),
          },
        ],
      },
    ],
  },
  {
    name: 'Marketing',
    icon: 'megaphone',
    description: 'Lancements, contenu et communication',
    owner: 'arthur',
    members: [
      { user: 'camille', role: 'EDITOR' },
      { user: 'lea', role: 'VIEWER' },
    ],
    invites: [{ email: 'agence@studio-com.fr', role: 'VIEWER' }],
    folders: [
      {
        name: 'Lancement 2.4',
        notes: [
          {
            title: 'Plan de lancement',
            body: B.checklist(
              'Plan de lancement 2.4',
              'Coordination sur deux semaines.',
              ['Page nouveautés rédigée', 'Visuels validés'],
              ['Programmer la newsletter', 'Préparer les posts sociaux', 'Briefer le support'],
            ),
          },
          {
            title: 'Communiqué de presse',
            body: B.article(
              'Communiqué — Memo 2.4',
              [
                'Memo dévoile la recherche plein-texte et la collaboration en temps réel.',
                'Disponible dès aujourd’hui pour tous les espaces.',
              ],
              ['Recherche instantanée', 'Présence en direct', 'Corbeille récupérable'],
            ),
          },
          {
            title: 'Calendrier éditorial',
            body: B.notesList('Calendrier éditorial', 'Juin → Juillet.', [
              'S1 — Teasing',
              'S2 — Annonce',
              'S3 — Tutoriels',
              'S4 — Témoignages',
            ]),
          },
        ],
      },
      {
        name: 'Contenu',
        notes: [
          {
            title: 'Article blog — Nouveautés',
            body: B.article(
              '5 nouveautés qui changent tout',
              [
                'On a réécrit la recherche pour qu’elle soit instantanée.',
                'La collaboration en temps réel rapproche les équipes.',
              ],
              ['Recherche', 'Temps réel', 'Corbeille', 'Thème sombre', 'Performances'],
            ),
          },
          {
            title: 'Newsletter — Juin',
            cover: 'amber',
            body: cover('Newsletter de juin', 'Récap mensuel envoyé à la communauté.', [
              'Nouveautés produit',
              'Astuce du mois',
              'Coulisses de l’équipe',
            ]),
          },
        ],
      },
      {
        name: 'Réseaux sociaux',
        notes: [
          {
            title: 'Lignes directrices',
            body: B.notesList('Lignes directrices sociales', 'Ton et cadence.', [
              'Ton clair et chaleureux',
              '3 posts / semaine',
              'Toujours une capture ou un visuel',
            ]),
          },
        ],
      },
    ],
  },
  {
    name: 'Personnel',
    icon: 'notebook-pen',
    description: 'Mon espace privé',
    owner: 'arthur',
    folders: [
      {
        name: 'Notes',
        notes: [
          {
            title: 'Lectures en cours',
            body: B.notesList('Lectures en cours', 'Pile à lire et notes.', [
              '« Shape Up » — Basecamp',
              '« Refactoring » — Fowler',
              'Articles sur le temps réel',
            ]),
          },
          {
            title: 'Idées en vrac',
            body: B.notesList('Idées en vrac', 'À trier plus tard.', [
              'Raccourci clavier global',
              'Modèle « réunion » par défaut',
              'Widget de capture rapide',
            ]),
          },
          {
            title: 'Voyage — Lisbonne',
            cover: 'ocean',
            body: cover('Voyage — Lisbonne', 'Idées d’itinéraire pour septembre.', [
              'Alfama au lever du jour',
              'Pastéis de Belém',
              'Tram 28',
            ]),
          },
        ],
      },
      {
        name: 'Recettes',
        notes: [
          {
            title: 'Risotto aux champignons',
            body: B.recipe(
              'Risotto aux champignons',
              '4 personnes',
              ['320 g de riz arborio', '300 g de champignons', '1 oignon', 'Parmesan', 'Bouillon'],
              [
                'Faire revenir l’oignon',
                'Nacrer le riz',
                'Ajouter le bouillon louche par louche',
                'Incorporer champignons et parmesan',
              ],
            ),
          },
          {
            title: 'Pain maison',
            body: B.recipe(
              'Pain maison',
              '1 boule',
              ['500 g de farine', '350 g d’eau', '10 g de sel', '4 g de levure'],
              ['Mélanger et autolyse', 'Pétrir et lever 3 h', 'Façonner', 'Cuire 45 min à 240 °C'],
            ),
          },
        ],
      },
    ],
  },
  {
    name: 'Onboarding RH',
    icon: 'users',
    description: 'Parcours d’intégration des nouveaux',
    owner: 'camille',
    members: [
      { user: 'arthur', role: 'EDITOR' },
      { user: 'thomas', role: 'VIEWER' },
    ],
    folders: [
      {
        name: 'Process',
        notes: [
          {
            title: 'Parcours d’intégration',
            body: B.guide(
              'Parcours d’intégration',
              'De la signature au premier mois.',
              [
                'Avant J1 : matériel et accès',
                'J1 : accueil et tour d’équipe',
                'Semaine 1 : binôme',
                'Mois 1 : objectifs',
              ],
              ['Un référent dédié', 'Point hebdo les 4 premières semaines'],
            ),
          },
          {
            title: 'Checklist J1',
            body: B.checklist(
              'Checklist J1',
              'À cocher le premier jour.',
              ['Poste préparé'],
              ['Créer les comptes', 'Remettre le badge', 'Présenter l’équipe', 'Configurer Memo'],
            ),
          },
        ],
      },
      {
        name: 'Modèles',
        notes: [
          {
            title: 'Email de bienvenue',
            body: B.article(
              'Email de bienvenue',
              [
                'Bienvenue dans l’équipe ! Voici tes premiers repères.',
                'Ton référent te contactera dès J1.',
              ],
              ['Accès aux outils', 'Planning de la 1re semaine', 'Contacts utiles'],
            ),
          },
        ],
      },
    ],
  },
  {
    name: 'Veille & Inspiration',
    icon: 'lightbulb',
    description: 'Articles et références à partager',
    owner: 'lucas',
    members: [
      { user: 'arthur', role: 'VIEWER' },
      { user: 'noah', role: 'EDITOR' },
    ],
    folders: [
      {
        name: 'Articles',
        notes: [
          {
            title: 'À lire — IA & développement',
            body: B.notesList('À lire — IA & dev', 'Sélection de la semaine.', [
              'Agents et orchestration',
              'Revue de code assistée',
              'Tests générés',
            ]),
          },
          {
            title: 'Design d’interfaces',
            body: B.notesList('Design d’interfaces', 'Inspirations UI.', [
              'Sobriété et hiérarchie',
              'Micro-interactions',
              'Thèmes sombres réussis',
            ]),
          },
        ],
      },
      {
        name: 'Références',
        notes: [
          {
            title: 'Boîte à outils',
            body: B.notesList('Boîte à outils', 'Ce qu’on aime.', [
              'Lucide pour les icônes',
              'Tiptap pour l’édition',
              'Playwright pour l’E2E',
            ]),
          },
        ],
      },
    ],
  },
]
