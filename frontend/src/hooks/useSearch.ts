import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { searchApi } from '../api/search'
import type { SearchParams } from '../api/search'
import type { SearchResult, ApiError } from '../types'

export function useSearch(
  params: SearchParams,
  enabled = true
): UseQueryResult<SearchResult[], ApiError> {
  return useQuery<SearchResult[], ApiError>({
    queryKey: ['search', params.query, params.limit],
    queryFn: () => searchApi.search(params),
    enabled: enabled && !!params.query,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

export function useSearchById(
  id: string | null
): UseQueryResult<SearchResult, ApiError> {
  return useQuery<SearchResult, ApiError>({
    queryKey: ['search', id],
    queryFn: () => searchApi.getById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
