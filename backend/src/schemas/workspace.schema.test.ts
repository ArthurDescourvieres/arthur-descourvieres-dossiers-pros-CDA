import { describe, it, expect } from 'vitest'
import { createWorkspaceSchema } from './workspace.schema'

describe('workspace name validation (§7.3)', () => {
  it('rejects a name shorter than 3 characters', () => {
    expect(createWorkspaceSchema.safeParse({ name: 'ab' }).success).toBe(false)
  })

  it('rejects a name longer than 50 characters', () => {
    expect(createWorkspaceSchema.safeParse({ name: 'a'.repeat(51) }).success).toBe(false)
  })

  it('accepts a valid name and trims it', () => {
    const result = createWorkspaceSchema.safeParse({ name: '  Mon espace  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name).toBe('Mon espace')
  })
})
