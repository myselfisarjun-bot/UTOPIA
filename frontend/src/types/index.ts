export interface SearchResult {
  id: string
  title: string
  description: string
  url?: string
}

export interface PlayerData {
  id: string
  name: string
  status: 'idle' | 'loading' | 'playing' | 'error'
  currentItem?: SearchResult
  error?: string
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

export interface LoadingState {
  isLoading: boolean
  error?: ApiError | null
}
