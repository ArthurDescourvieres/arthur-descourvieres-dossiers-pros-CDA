import { z } from 'zod'

/**
 * Champ texte « métier » (titre de note, nom de workspace…).
 *
 * Étapes appliquées dans l'ordre (§7.3 — validation & assainissement) :
 *  1. trim()           → retire les espaces de début/fin ;
 *  2. min() / max()    → borne la longueur sur la valeur déjà trimmée ;
 *  3. normalize('NFC') → fusionne les variantes Unicode (« é » composé vs
 *     « e » + accent combinant) pour qu'un même texte visuel soit toujours
 *     stocké de façon identique.
 *
 * À NE PAS utiliser pour un secret (mot de passe) : on ne doit jamais trim ni
 * normaliser un mot de passe, sa valeur exacte saisie fait foi.
 */
export function normalizedText(min: number, max: number) {
  return z
    .string()
    .trim()
    .min(min)
    .max(max)
    .transform((s) => s.normalize('NFC'))
}
