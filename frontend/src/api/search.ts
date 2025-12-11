import { apiClient } from './client'
import type { SearchResult } from '../types'

export interface SearchParams {
  query: string
  limit?: number
}

export const searchApi = {
  search: async (params: SearchParams): Promise<SearchResult[]> => {
    const response = await apiClient.get<SearchResult[]>('/search', {
      params,
    })
    return response.data
  },

  getById: async (id: string): Promise<SearchResult> => {
    const response = await apiClient.get<SearchResult>(`/search/${id}`)
    return response.data
  },
}
