import DOMPurify from 'dompurify'

// Tag whitelist aligned with §8.1, plus <mark> for search highlighting and
// <span> for the design-system demo blocks.
const ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'br',
  'ul',
  'ol',
  'li',
  'blockquote',
  'strong',
  'em',
  'a',
  'img',
  'code',
  'pre',
  'mark',
  'span',
]
// No `style` (nor `class`): the only consumer is the search snippet
// (SearchBox), whose sanitised markup is just <mark> highlighting. Allowing
// inline styles would reopen a CSS injection / data-exfiltration vector
// (e.g. `background:url(https://attacker/beacon)`); the highlight colour now
// lives in CSS (.search-snippet mark) instead of an inline style.
const ALLOWED_ATTR = ['href', 'src', 'alt', 'title']

// Bind the purifier to the live window explicitly. The default auto-bound
// instance can degrade to a no-op when the global window isn't ready at import
// time (notably under the test DOM); binding at module load keeps it active.
const purifier = DOMPurify(window)

/**
 * Sanitise an HTML string before it is injected via dangerouslySetInnerHTML
 * (§8.1): strips scripts, event-handler attributes and javascript:/data: URLs,
 * keeping only the whitelisted tags/attributes. URLs are limited to
 * http(s)/mailto or app-relative paths.
 */
export function sanitizeHtml(dirty: string): string {
  return purifier.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i,
  })
}
