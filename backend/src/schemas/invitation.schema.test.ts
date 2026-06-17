import { describe, it, expect } from 'vitest'
import { createInvitationSchema } from './invitation.schema'

describe('createInvitationSchema (§12)', () => {
  it('accepts EDITOR and VIEWER roles', () => {
    expect(createInvitationSchema.safeParse({ email: 'a@b.co', role: 'EDITOR' }).success).toBe(true)
    expect(createInvitationSchema.safeParse({ email: 'a@b.co', role: 'VIEWER' }).success).toBe(true)
  })

  it('rejects the OWNER role', () => {
    expect(createInvitationSchema.safeParse({ email: 'a@b.co', role: 'OWNER' }).success).toBe(false)
  })

  it('rejects an invalid email', () => {
    expect(createInvitationSchema.safeParse({ email: 'nope', role: 'EDITOR' }).success).toBe(false)
  })
})
