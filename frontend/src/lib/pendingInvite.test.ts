import { afterEach, describe, expect, it } from 'vitest'
import { capturePendingInviteFromUrl, clearPendingInvite, readPendingInvite } from './pendingInvite'

afterEach(() => {
  clearPendingInvite()
  window.history.replaceState(null, '', '/')
})

describe('pendingInvite', () => {
  it('captures ?invite from the URL and reads it back', () => {
    window.history.replaceState(null, '', '/?invite=abc123')
    capturePendingInviteFromUrl()
    expect(readPendingInvite()).toBe('abc123')
  })

  it('is a no-op when no invite token is present', () => {
    window.history.replaceState(null, '', '/?foo=bar')
    capturePendingInviteFromUrl()
    expect(readPendingInvite()).toBeNull()
  })

  it('clears the stored token', () => {
    window.history.replaceState(null, '', '/?invite=xyz')
    capturePendingInviteFromUrl()
    clearPendingInvite()
    expect(readPendingInvite()).toBeNull()
  })
})
