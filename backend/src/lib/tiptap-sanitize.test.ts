import { describe, it, expect } from 'vitest'
import { sanitizeTiptapContent } from './tiptap-sanitize'

type AnyNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: AnyNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  text?: string
}

describe('sanitizeTiptapContent (§8.1 / T-NOTE-02)', () => {
  it('strips on* attributes from a forged node but keeps its content', () => {
    const clean = sanitizeTiptapContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { onclick: 'alert(1)' },
          content: [{ type: 'text', text: 'hello' }],
        },
      ],
    }) as AnyNode

    expect(clean.content?.[0].attrs?.onclick).toBeUndefined()
    expect(clean.content?.[0].content?.[0].text).toBe('hello')
  })

  it('drops unknown node types', () => {
    const clean = sanitizeTiptapContent({
      type: 'doc',
      content: [{ type: 'script', text: 'x' }, { type: 'paragraph' }],
    }) as AnyNode

    expect(clean.content).toHaveLength(1)
    expect(clean.content?.[0].type).toBe('paragraph')
  })

  it('removes javascript: links while keeping the text', () => {
    const clean = sanitizeTiptapContent({
      type: 'doc',
      content: [
        {
          type: 'text',
          text: 'x',
          marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
        },
      ],
    }) as AnyNode

    expect(clean.content?.[0].marks?.[0].attrs?.href).toBeUndefined()
    expect(clean.content?.[0].text).toBe('x')
  })

  it('drops images whose src is not http(s) or a relative app URL', () => {
    const clean = sanitizeTiptapContent({
      type: 'doc',
      content: [{ type: 'image', attrs: { src: 'javascript:alert(1)' } }],
    }) as AnyNode

    expect(clean.content).toHaveLength(0)
  })

  it('keeps allowed nodes, marks and a relative image src', () => {
    const clean = sanitizeTiptapContent({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
        { type: 'image', attrs: { src: '/api/attachments/abc/file' } },
        { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
      ],
    }) as AnyNode

    expect(clean.content?.[0].type).toBe('heading')
    expect(clean.content?.[0].attrs?.level).toBe(2)
    expect(clean.content?.[1].type).toBe('image')
    expect(clean.content?.[2].marks?.[0].type).toBe('bold')
  })

  it('falls back to an empty doc for non-object input', () => {
    expect(sanitizeTiptapContent(null)).toEqual({ type: 'doc', content: [] })
  })
})
