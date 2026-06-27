import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from './sanitizeHtml'

describe('sanitizeHtml (§8.1)', () => {
  it('removes <script> tags', () => {
    expect(sanitizeHtml('<p>hi</p><script>alert(1)</script>')).not.toContain('<script')
  })

  it('strips on* event-handler attributes', () => {
    expect(sanitizeHtml('<img src="/x.png" onerror="alert(1)">')).not.toContain('onerror')
  })

  it('drops javascript: URLs', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:')
  })

  it('keeps allowed formatting tags', () => {
    const out = sanitizeHtml('<p><strong>b</strong> <em>i</em></p>')
    expect(out).toContain('<strong>')
    expect(out).toContain('<em>')
  })

  it('keeps the search-highlight <mark>', () => {
    expect(sanitizeHtml('<mark>match</mark>')).toContain('<mark>')
  })

  it('strips the style attribute (CSS injection / exfiltration vector)', () => {
    const out = sanitizeHtml('<mark style="background:url(https://evil.example/beacon)">m</mark>')
    expect(out).not.toContain('style=')
    expect(out).not.toContain('evil.example')
    // …while keeping the highlight tag and its text content.
    expect(out).toContain('<mark>')
    expect(out).toContain('m')
  })

  it('strips the class attribute', () => {
    expect(sanitizeHtml('<mark class="x">m</mark>')).not.toContain('class=')
  })
})
