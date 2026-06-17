/**
 * Validation des fichiers uploadés (§7.3 — OWASP A03 Injection).
 *
 * `ALLOWED_MIMES` est la liste blanche des seuls types acceptés. Pour les
 * formats binaires (images, PDF) le type réel est confirmé par les « magic
 * bytes » via la lib `file-type`. Le texte brut, lui, n'a pas de signature
 * binaire : `file-type` renvoie `undefined`. On l'accepte donc séparément, à
 * condition que le contenu soit réellement du texte UTF-8 (pas d'octet nul,
 * décodage valide) — un binaire renommé en `.txt` est ainsi rejeté.
 */
export const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
])

export function looksLikeText(buffer: Buffer): boolean {
  if (buffer.length === 0) return false
  if (buffer.includes(0)) return false // un octet nul = contenu binaire
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    return true
  } catch {
    return false
  }
}
