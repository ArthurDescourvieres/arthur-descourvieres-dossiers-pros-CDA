import { describe, it, expect, vi, beforeEach } from 'vitest'

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }))

vi.mock('../lib/prisma.js', () => ({ prisma: { $queryRaw: queryRaw } }))

import { searchService } from './search.service'

beforeEach(() => {
  queryRaw.mockReset()
})

describe('searchInWorkspace — recherche plein-texte', () => {
  it('renvoie les résultats classés sans toucher la BDD pour une requête vide', async () => {
    const result = await searchService.searchInWorkspace('ws1', '   ')

    expect(result).toEqual([])
    expect(queryRaw).not.toHaveBeenCalled()
  })

  it('délègue la recherche FTS à Postgres et renvoie les hits', async () => {
    const hits = [
      {
        id: 'n1',
        title: 'Note',
        folderId: 'f1',
        rank: 0.5,
        snippet: '<<match>>',
        updatedAt: new Date(),
      },
    ]
    queryRaw.mockResolvedValue(hits)

    const result = await searchService.searchInWorkspace('ws1', 'match')

    expect(queryRaw).toHaveBeenCalledOnce()
    expect(result).toEqual(hits)
  })
})
