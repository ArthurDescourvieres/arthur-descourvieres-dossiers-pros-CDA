import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export type SearchHit = {
  id: string
  title: string
  folderId: string
  rank: number
  snippet: string | null
  updatedAt: string
}

type SearchResponse = { query: string; hits: SearchHit[] }

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function useSearch(workspaceId: string | null, query: string) {
  const debounced = useDebouncedValue(query.trim(), 300)
  return useQuery({
    queryKey: ['search', workspaceId, debounced],
    queryFn: () =>
      api<SearchResponse>(
        `/api/workspaces/${workspaceId}/search?q=${encodeURIComponent(debounced)}`,
      ),
    enabled: Boolean(workspaceId) && debounced.length > 0,
    staleTime: 30_000,
  })
}
