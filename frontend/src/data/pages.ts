import type { Page } from './types';

export const initialPages: Record<string, Page> = {
  atlas: {
    id: 'atlas',
    title: 'Atlas of the Longer Night',
    titleHTML: 'Atlas of the <em>Longer</em> Night',
    emoji: '🕯️',
    path: ['Private', 'Field notebook', 'Atlas of the Longer Night'],
    meta: {
      created: 'Mar 14, 2026',
      edited: '2 hours ago',
      by: 'Elise Marchetti',
      tags: [
        ['Research', 'teal'],
        ['Poetics', 'gold'],
      ],
      status: ['In draft', 'teal'],
      icon: '🕯️',
    },
    blocks: [
      {
        type: 'callout',
        icon: '🌙',
        body: 'A working notebook for <strong>Chapter VII — Hours that refuse to end</strong>. Loose threads kept here until they earn their place in the manuscript.',
      },
      { type: 'h1', text: 'Premise' },
      {
        type: 'p',
        html: 'Somewhere between <em>four and five in the morning</em>, a threshold opens. The world has not yet returned, and sleep is no longer available. These are the <span class="accent">Longer Nights</span> — intervals of suspended attention where thought becomes unusually porous.',
      },
      {
        type: 'p',
        html: 'This atlas collects the textures, temperatures and small objects that accompany those hours. It is not a theory. It is a <strong>catalogue of evidence</strong>.',
      },
      { type: 'divider' },
      { type: 'h2', text: 'Working list' },
      {
        type: 'todo',
        label: 'Transcribe the conversation with Orsola about tide-clocks',
        done: true,
        meta: 'Field',
      },
      {
        type: 'todo',
        label: 'Re-read Bachelard, Chapter 3 — candle as oracle',
        done: true,
        meta: 'Reading',
      },
      {
        type: 'todo',
        label: 'Draft the passage on Campari, rain, and memorized rooms',
        done: false,
        meta: 'Draft',
      },
      {
        type: 'todo',
        label: 'Commission photographs from Hiro — east-facing windows, 05:10',
        done: false,
        meta: 'Commission',
      },
      {
        type: 'todo',
        label: 'Decide: essay or letter? (lean letter)',
        done: false,
        meta: 'Structural',
      },
      {
        type: 'quote',
        text: 'The night has the strange power of making the small seem close at hand and the close seem intolerably small.',
        cite: 'Notebook, 3 Feb, 04:41',
      },
      { type: 'h2', text: 'Open questions' },
      {
        type: 'p',
        html: 'Does the feeling of a long night have a <em>shape</em> — a geometry one could draw? Try a diagram. Consider the spiral, the chamber, the slow horizon.',
      },
      { type: 'slash' },
    ],
  },
  tidecl: {
    id: 'tidecl',
    title: 'On tide-clocks & other small technologies',
    titleHTML: 'On <em>tide-clocks</em> & other small technologies',
    emoji: '🌊',
    path: ['Private', 'Field notebook', 'On tide-clocks'],
    meta: {
      created: 'Feb 28, 2026',
      edited: 'Yesterday, 22:14',
      by: 'Elise Marchetti',
      tags: [
        ['Essay', 'teal'],
        ['Objects', 'slate'],
      ],
      status: ['Polishing', 'gold'],
      icon: '🌊',
    },
    blocks: [
      {
        type: 'callout',
        icon: '⚓',
        body: 'A short companion piece to <strong>Atlas of the Longer Night</strong>. Working length: 1,200 words. Due to <em>Grain &amp; Gutter</em> on the 19th.',
      },
      { type: 'h1', text: 'Opening' },
      {
        type: 'p',
        html: `Orsola's kitchen keeps a <span class="accent">tide-clock</span> above the stove. It tells no hour, only whether the water is rising, falling, or — very rarely — at rest. I have been thinking about what it would mean to own one indoors, far from any sea.`,
      },
      { type: 'h2', text: 'Points to hit' },
      {
        type: 'todo',
        label: 'Define "small technology" in one clean sentence',
        done: true,
        meta: 'Lede',
      },
      {
        type: 'todo',
        label: 'Pair the tide-clock with the dial-barometer',
        done: false,
        meta: 'Middle',
      },
      {
        type: 'todo',
        label: 'Close on the image of the stopped clock that is correct twice',
        done: false,
        meta: 'Ending',
      },
      { type: 'divider' },
      {
        type: 'quote',
        text: 'An object that promises only partial knowledge is a kinder object.',
        cite: 'Note to self',
      },
      { type: 'slash' },
    ],
  },
  letters: {
    id: 'letters',
    title: 'Letters to no one in particular',
    titleHTML: 'Letters <em>to no one</em> in particular',
    emoji: '✉️',
    path: ['Private', 'Field notebook', 'Letters'],
    meta: {
      created: 'Jan 2, 2026',
      edited: '3 days ago',
      by: 'Elise Marchetti',
      tags: [
        ['Letters', 'rose'],
        ['Weekly', 'slate'],
      ],
      status: ['Ongoing', 'teal'],
      icon: '✉️',
    },
    blocks: [
      {
        type: 'callout',
        icon: '📬',
        body: 'A weekly practice. Write the letter, seal it, wait a month, then decide whether to send.',
      },
      { type: 'h1', text: 'Letter — 19 April' },
      { type: 'p', html: 'Dear reader of this sentence,' },
      {
        type: 'p',
        html: 'The rain arrived on schedule, which feels unreasonable. I thought of you while emptying the kettle — a small, domestic thought, the kind I used to <em>apologize</em> for.',
      },
      {
        type: 'p',
        html: 'Nothing else happened. That is, I believe, the point of the letter.',
      },
      {
        type: 'quote',
        text: 'To write without an addressee is to remember that the addressee was always oneself, a little older.',
        cite: 'Borges, paraphrased',
      },
      { type: 'slash' },
    ],
  },
  garden: {
    id: 'garden',
    title: 'A small garden of verbs',
    titleHTML: 'A small <em>garden</em> of verbs',
    emoji: '🌿',
    path: ['Private', 'Vocabulary', 'Garden of verbs'],
    meta: {
      created: 'Dec 11, 2025',
      edited: '5 days ago',
      by: 'Elise Marchetti',
      tags: [['Vocabulary', 'gold']],
      status: ['Tending', 'teal'],
      icon: '🌿',
    },
    blocks: [
      {
        type: 'callout',
        icon: '🪴',
        body: 'Verbs I want to use more this year, with notes on how they should feel in the mouth.',
      },
      { type: 'h1', text: 'Current plantings' },
      {
        type: 'p',
        html: '<strong>To bevel</strong> — to soften an edge without rounding it. For prose that is direct but not sharp.',
      },
      {
        type: 'p',
        html: '<strong>To quieten</strong> — the active form, preferred over <em>to quiet</em>. There is labour in it.',
      },
      {
        type: 'p',
        html: '<strong>To winter</strong> — to wait out a season of reduced yield, honestly, without metaphor.',
      },
      {
        type: 'p',
        html: '<strong>To assemble</strong> — for anything made from pieces that were already whole on their own.',
      },
      { type: 'slash' },
    ],
  },
  manuscript: {
    id: 'manuscript',
    title: 'Manuscript — Book Two',
    titleHTML: '<em>Manuscript</em> — Book Two',
    emoji: '📖',
    path: ['Work', 'Manuscript — Book Two'],
    meta: {
      created: 'Oct 2, 2025',
      edited: 'Last week',
      by: 'Elise Marchetti',
      tags: [
        ['Manuscript', 'gold'],
        ['Deadline', 'rose'],
      ],
      status: ['In progress', 'gold'],
      icon: '📖',
    },
    blocks: [
      {
        type: 'callout',
        icon: '🔖',
        body: 'Overview page. Individual chapters live as children. Target length — <strong>64,000 words</strong>. First pass due <em>September</em>.',
      },
      { type: 'h1', text: 'Table of contents (working)' },
      { type: 'p', html: '<strong>I.</strong> The house before it was a house' },
      { type: 'p', html: '<strong>II.</strong> An inventory of silences' },
      { type: 'p', html: '<strong>III.</strong> A field guide to returning' },
      { type: 'p', html: '<strong>IV.</strong> Letters I did not send' },
      { type: 'p', html: '<strong>V.</strong> Winter, twice' },
      { type: 'p', html: '<strong>VI.</strong> The kitchen as an archive' },
      {
        type: 'p',
        html: '<strong>VII.</strong> Hours that refuse to end <span class="accent">← active</span>',
      },
      { type: 'divider' },
      { type: 'h2', text: 'This week' },
      {
        type: 'todo',
        label: 'Send Chapter V to Marianne for a soft read',
        done: true,
        meta: 'Editorial',
      },
      {
        type: 'todo',
        label: 'Rework the opening paragraph of VII (three attempts)',
        done: false,
        meta: 'Draft',
      },
      {
        type: 'todo',
        label: 'Decide on the dedication — ask R. first',
        done: false,
        meta: 'Decision',
      },
      { type: 'slash' },
    ],
  },
  index: {
    id: 'index',
    title: 'Index — things I keep losing',
    titleHTML: 'Index — things I keep <em>losing</em>',
    emoji: '📇',
    path: ['Private', 'Index'],
    meta: {
      created: 'May 22, 2025',
      edited: 'This morning',
      by: 'Elise Marchetti',
      tags: [['Index', 'slate']],
      status: ['Evergreen', 'teal'],
      icon: '📇',
    },
    blocks: [
      {
        type: 'callout',
        icon: '🧭',
        body: 'A running index of phrases, references and small facts I have lost and re-found more than twice.',
      },
      { type: 'h2', text: 'Cross-references' },
      {
        type: 'p',
        html: '— <em>"A kinder object"</em> → see <strong>On tide-clocks</strong>',
      },
      {
        type: 'p',
        html: '— <em>The 05:10 photograph</em> → see <strong>Atlas of the Longer Night</strong>',
      },
      {
        type: 'p',
        html: '— <em>Kettle, rain, apology</em> → see <strong>Letters — 19 April</strong>',
      },
      {
        type: 'p',
        html: '— <em>Winter, twice</em> → see <strong>Manuscript, Ch. V</strong>',
      },
      { type: 'slash' },
    ],
  },
  inbox: {
    id: 'inbox',
    title: 'Inbox',
    titleHTML: '<em>Inbox</em>',
    emoji: '📥',
    path: ['Inbox'],
    meta: {
      created: '—',
      edited: 'Live',
      by: 'Elise Marchetti',
      tags: [['Capture', 'slate']],
      status: ['Raw', 'slate'],
      icon: '📥',
    },
    blocks: [
      {
        type: 'callout',
        icon: '✨',
        body: 'Unfiltered captures. Move or delete within <strong>seven days</strong>.',
      },
      {
        type: 'todo',
        label: 'Phrase: "the kettle knew before I did"',
        done: false,
        meta: 'Fragment',
      },
      {
        type: 'todo',
        label: 'Check if the antiquarian on Rue des Archives still has the barometer',
        done: false,
        meta: 'Errand',
      },
      {
        type: 'todo',
        label: `Return Orsola's Campari glass`,
        done: true,
        meta: 'Domestic',
      },
      {
        type: 'todo',
        label: 'Book the train to Ancona for the 12th',
        done: false,
        meta: 'Travel',
      },
      { type: 'slash' },
    ],
  },
};

export const virtualPages: Record<
  'today' | 'archive' | 'trash' | 'inbox_empty',
  { emoji: string; title: string; subtitle: string; icon: string }
> = {
  today: {
    emoji: '☀️',
    title: 'Today',
    subtitle: 'Nothing due. A rare and pleasant thing.',
    icon: 'sun',
  },
  archive: {
    emoji: '📦',
    title: 'Archive',
    subtitle: 'Pages you have set aside for later reading.',
    icon: 'archive',
  },
  trash: {
    emoji: '🗑️',
    title: 'Trash',
    subtitle: 'Items deleted in the last 30 days.',
    icon: 'trash-2',
  },
  inbox_empty: {
    emoji: '📥',
    title: 'Inbox',
    subtitle: 'No new captures today.',
    icon: 'inbox',
  },
};
