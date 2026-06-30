/**
 * Générateur de PNG autonome (zlib natif, aucune dépendance) : produit des
 * « couvertures » en dégradé diagonal qui servent de vraies pièces jointes
 * image. On évite ainsi toute dépendance réseau au moment du seed — les images
 * s'affichent même hors-ligne.
 */
import { deflateSync } from 'node:zlib'

export type RGB = [number, number, number]

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData), 0)
  return Buffer.concat([length, typeAndData, crc])
}

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t)

/**
 * PNG RGB 8 bits, dégradé diagonal de `from` vers `to` avec un léger voile
 * vertical clair pour donner du relief. Dimensions modestes (rapide, ~quelques ko).
 */
export function gradientPng(width: number, height: number, from: RGB, to: RGB): Buffer {
  const stride = width * 3
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filtre 0 (None) en tête de scanline
    for (let x = 0; x < width; x++) {
      const t = (x / width + y / height) / 2
      const sheen = 0.12 * (1 - y / height) // voile clair en haut
      const o = y * (stride + 1) + 1 + x * 3
      raw[o] = Math.min(255, lerp(from[0], to[0], t) + sheen * 255)
      raw[o + 1] = Math.min(255, lerp(from[1], to[1], t) + sheen * 255)
      raw[o + 2] = Math.min(255, lerp(from[2], to[2], t) + sheen * 255)
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // profondeur 8 bits
  ihdr[9] = 2 // type couleur 2 = RGB
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** Palettes nommées (dégradés agréables) réutilisées par le catalogue. */
export const PALETTES: Record<string, [RGB, RGB]> = {
  violet: [
    [124, 58, 237],
    [37, 99, 235],
  ],
  sunset: [
    [244, 114, 182],
    [251, 146, 60],
  ],
  ocean: [
    [14, 165, 233],
    [16, 185, 129],
  ],
  forest: [
    [34, 197, 94],
    [22, 101, 52],
  ],
  graphite: [
    [71, 85, 105],
    [15, 23, 42],
  ],
  amber: [
    [251, 191, 36],
    [239, 68, 68],
  ],
}

export type PaletteKey = keyof typeof PALETTES
