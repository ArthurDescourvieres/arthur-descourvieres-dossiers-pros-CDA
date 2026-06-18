import { describe, it, expect } from 'vitest'
import { ApiError } from '../lib/api'
import {
  inviteLink,
  roleLabel,
  formatExpiry,
  createInviteErrorMessage,
  acceptInviteErrorMessage,
} from './inviteUtils'

describe('inviteLink', () => {
  it('builds an absolute invite URL with the token encoded', () => {
    expect(inviteLink('a b/c')).toBe(
      `${window.location.origin}/?invite=${encodeURIComponent('a b/c')}`,
    )
  })
})

describe('roleLabel', () => {
  it('maps each workspace role to its French label', () => {
    expect(roleLabel('OWNER')).toBe('Propriétaire')
    expect(roleLabel('EDITOR')).toBe('Éditeur')
    expect(roleLabel('VIEWER')).toBe('Lecteur')
  })
})

describe('formatExpiry', () => {
  it('formats a valid ISO date as dd/mm/yyyy', () => {
    expect(formatExpiry('2026-06-15T12:00:00Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('returns an empty string for an unparseable date', () => {
    expect(formatExpiry('not-a-date')).toBe('')
  })
})

describe('createInviteErrorMessage', () => {
  it('maps known API statuses to a user-facing reason', () => {
    expect(createInviteErrorMessage(new ApiError(400, {}))).toMatch(/invalide/)
    expect(createInviteErrorMessage(new ApiError(403, {}))).toMatch(/propriétaire/)
    expect(createInviteErrorMessage(new ApiError(404, {}))).toMatch(/pseudo/)
    expect(createInviteErrorMessage(new ApiError(429, {}))).toMatch(/Trop de tentatives/)
  })

  it('falls back to a generic message for unknown errors', () => {
    expect(createInviteErrorMessage(new ApiError(500, {}))).toBe(
      "L'invitation n'a pas pu être créée.",
    )
    expect(createInviteErrorMessage(new Error('boom'))).toBe("L'invitation n'a pas pu être créée.")
  })
})

describe('acceptInviteErrorMessage', () => {
  it('maps each acceptance failure to a precise message', () => {
    expect(acceptInviteErrorMessage(new ApiError(404, {}))).toMatch(/introuvable/)
    expect(acceptInviteErrorMessage(new ApiError(410, {}))).toMatch(/expiré/)
    expect(acceptInviteErrorMessage(new ApiError(409, {}))).toMatch(/déjà été acceptée/)
    expect(acceptInviteErrorMessage(new ApiError(403, {}))).toMatch(/autre adresse/)
    expect(acceptInviteErrorMessage(new ApiError(429, {}))).toMatch(/Trop de tentatives/)
  })

  it('falls back to a generic message otherwise', () => {
    expect(acceptInviteErrorMessage(new ApiError(500, {}))).toBe(
      "Impossible d'accepter l'invitation.",
    )
    expect(acceptInviteErrorMessage('nope')).toBe("Impossible d'accepter l'invitation.")
  })
})
