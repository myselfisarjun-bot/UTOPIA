import type { SearchResult } from '../types'

export const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    title: 'Test Result 1',
    description: 'This is the first test result',
    url: 'https://example.com/1',
  },
  {
    id: '2',
    title: 'Test Result 2',
    description: 'This is the second test result',
    url: 'https://example.com/2',
  },
  {
    id: '3',
    title: 'Test Result 3',
    description: 'This is the third test result',
  },
]

export const mockApiError = {
  message: 'API Error occurred',
  status: 500,
  code: 'INTERNAL_ERROR',
}
