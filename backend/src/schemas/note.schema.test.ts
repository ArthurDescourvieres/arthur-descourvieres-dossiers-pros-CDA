import { describe, it, expect } from 'vitest'
import { createNoteSchema, updateNoteSchema } from './note.schema'

describe('note title validation (§7.3)', () => {
  it('rejects a title longer than 200 characters', () => {
    const result = createNoteSchema.safeParse({ title: 'a'.repeat(201), folderId: 'f1' })
    expect(result.success).toBe(false)
  })

  it('accepts a title of exactly 200 characters', () => {
    const result = createNoteSchema.safeParse({ title: 'a'.repeat(200), folderId: 'f1' })
    expect(result.success).toBe(true)
  })

  it('trims surrounding whitespace before validating', () => {
    const result = createNoteSchema.safeParse({ title: '   Ma note   ', folderId: 'f1' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.title).toBe('Ma note')
  })

  it('rejects a blank title (whitespace only) after trim', () => {
    const result = createNoteSchema.safeParse({ title: '    ', folderId: 'f1' })
    expect(result.success).toBe(false)
  })

  it('normalizes the title to Unicode NFC', () => {
    // 'e' + accent combinant (U+0301) doit être stocké comme 'é' composé (U+00E9).
    const result = updateNoteSchema.safeParse({ title: 'café' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.title).toBe('café')
  })
})
