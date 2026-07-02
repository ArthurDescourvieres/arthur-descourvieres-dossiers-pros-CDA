/**
 * Petits constructeurs de noeuds Tiptap/ProseMirror pour le seed.
 *
 * On ne produit que des noeuds et marques de la liste blanche du backend
 * (cf. src/lib/tiptap-sanitize.ts) : le contenu généré traverse la même
 * sanitisation que l'éditeur réel, donc ce qui est écrit ici est exactement
 * ce qui s'affiche dans l'app.
 */

export type Mark = { type: string; attrs?: Record<string, unknown> }
export type TNode = {
  type: string
  attrs?: Record<string, unknown>
  text?: string
  marks?: Mark[]
  content?: TNode[]
}

/** Fragment en ligne : soit un texte brut, soit un noeud texte déjà marqué. */
export type Inline = TNode | string

const norm = (x: Inline): TNode => (typeof x === 'string' ? text(x) : x)

// --- Texte et marques en ligne ---------------------------------------------
export const text = (value: string): TNode => ({ type: 'text', text: value })
const marked = (value: string, mark: Mark): TNode => ({ type: 'text', text: value, marks: [mark] })

export const b = (value: string): TNode => marked(value, { type: 'bold' })
export const i = (value: string): TNode => marked(value, { type: 'italic' })
export const u = (value: string): TNode => marked(value, { type: 'underline' })
export const strike = (value: string): TNode => marked(value, { type: 'strike' })
export const code = (value: string): TNode => marked(value, { type: 'code' })
export const link = (value: string, href: string): TNode =>
  marked(value, { type: 'link', attrs: { href, target: '_blank', rel: 'noopener noreferrer' } })

// --- Blocs ------------------------------------------------------------------
export const p = (...inline: Inline[]): TNode => ({
  type: 'paragraph',
  ...(inline.length ? { content: inline.map(norm) } : {}),
})

export const h = (level: 1 | 2 | 3, ...inline: Inline[]): TNode => ({
  type: 'heading',
  attrs: { level },
  content: inline.map(norm),
})

type Item = Inline[] | Inline
const listItem = (item: Item): TNode => ({
  type: 'listItem',
  content: [p(...(Array.isArray(item) ? item : [item]))],
})

export const ul = (...items: Item[]): TNode => ({
  type: 'bulletList',
  content: items.map(listItem),
})
export const ol = (...items: Item[]): TNode => ({
  type: 'orderedList',
  attrs: { start: 1 },
  content: items.map(listItem),
})

export const quote = (...inline: Inline[]): TNode => ({
  type: 'blockquote',
  content: [p(...inline)],
})

export const codeBlock = (language: string, source: string): TNode => ({
  type: 'codeBlock',
  attrs: { language },
  content: [text(source)],
})

export const hr = (): TNode => ({ type: 'horizontalRule' })

export const image = (src: string, alt: string, width?: number): TNode => ({
  type: 'image',
  attrs: { src, alt, title: null, ...(width ? { width } : {}) },
})

export const doc = (...content: TNode[]): TNode => ({ type: 'doc', content })
