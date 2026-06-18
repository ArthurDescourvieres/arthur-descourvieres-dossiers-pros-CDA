import { describe, it, expect } from 'vitest'
import { createInvitationSchema } from './invitation.schema'

describe('createInvitationSchema (§12)', () => {
  it('accepts EDITOR and VIEWER roles by email', () => {
    expect(createInvitationSchema.safeParse({ identifier: 'a@b.co', role: 'EDITOR' }).success).toBe(
      true,
    )
    expect(createInvitationSchema.safeParse({ identifier: 'a@b.co', role: 'VIEWER' }).success).toBe(
      true,
    )
  })

  it('accepts a bare username as identifier', () => {
    expect(createInvitationSchema.safeParse({ identifier: 'alice', role: 'EDITOR' }).success).toBe(
      true,
    )
  })

  it('rejects the OWNER role', () => {
    expect(createInvitationSchema.safeParse({ identifier: 'a@b.co', role: 'OWNER' }).success).toBe(
      false,
    )
  })

  it('rejects a malformed email (contains @ but invalid)', () => {
    expect(createInvitationSchema.safeParse({ identifier: 'bad@', role: 'EDITOR' }).success).toBe(
      false,
    )
  })

  it('rejects an empty identifier', () => {
    expect(createInvitationSchema.safeParse({ identifier: '   ', role: 'EDITOR' }).success).toBe(
      false,
    )
  })
})
