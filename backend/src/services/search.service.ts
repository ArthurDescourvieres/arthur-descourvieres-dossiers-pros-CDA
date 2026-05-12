import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

export type SearchHit = {
  id: string
  title: string
  folderId: string
  rank: number
  snippet: string | null
  updatedAt: Date
}

export const searchService = {
  /**
   * Full-text search scoped to a single workspace.
   * Matches Note.searchVector (= title weight A + contentText weight B)
   * with plainto_tsquery, ordered by ts_rank. Soft-deleted notes are
   * excluded.
   */
  async searchInWorkspace(workspaceId: string, query: string): Promise<SearchHit[]> {
    const trimmed = query.trim()
    if (trimmed.length === 0) return []

    return prisma.$queryRaw<SearchHit[]>`
      SELECT
        n."id",
        n."title",
        n."folderId",
        n."updatedAt",
        ts_rank(n."searchVector", plainto_tsquery('simple', ${trimmed})) AS "rank",
        ts_headline(
          'simple',
          coalesce(n."contentText", ''),
          plainto_tsquery('simple', ${trimmed}),
          'MaxFragments=1, MaxWords=15, MinWords=5, ShortWord=2, StartSel=<<, StopSel=>>'
        ) AS "snippet"
      FROM "Note" n
      JOIN "Folder" f ON f."id" = n."folderId"
      WHERE f."workspaceId" = ${workspaceId}
        AND n."deletedAt" IS NULL
        AND n."searchVector" @@ plainto_tsquery('simple', ${trimmed})
      ORDER BY "rank" DESC, n."updatedAt" DESC
      LIMIT 50
    `
  },
}

// Re-export Prisma to keep import counts low if needed elsewhere.
export { Prisma }
