import { describe, it, expect } from 'vitest'
import { escapeHTML } from './escapeHtml'

describe('escapeHTML', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHTML('<a href="x">&\'')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;')
  })

  it('leaves a string without special characters untouched', () => {
    expect(escapeHTML('hello world 123')).toBe('hello world 123')
  })

  it('neutralises a script payload so it cannot break out of text', () => {
    expect(escapeHTML('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
  })
})
