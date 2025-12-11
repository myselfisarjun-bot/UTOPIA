import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSearch } from '../useSearch'
import { searchApi } from '../../api/search'
import { mockSearchResults, mockApiError } from '../../test/mock-data'

vi.mock('../../api/search', () => ({
  searchApi: {
    search: vi.fn(),
    getById: vi.fn(),
  },
}))

describe('useSearch', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('fetches search results successfully', async () => {
    vi.mocked(searchApi.search).mockResolvedValue(mockSearchResults)

    const { result } = renderHook(
      () => useSearch({ query: 'test', limit: 10 }),
      { wrapper }
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockSearchResults)
    expect(searchApi.search).toHaveBeenCalledWith({ query: 'test', limit: 10 })
  })

  it('handles API errors', async () => {
    vi.mocked(searchApi.search).mockRejectedValue(mockApiError)

    const { result } = renderHook(
      () => useSearch({ query: 'test', limit: 10 }),
      { wrapper }
    )

    // Wait for the hook to call the API
    await waitFor(() => {
      expect(searchApi.search).toHaveBeenCalled()
    })

    // Wait for loading to complete (with retries configured in the hook)
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 5000 }
    )

    // After retries exhaust, it should be in error state
    expect(result.current.isError).toBe(true)
  })

  it('does not fetch when query is empty', async () => {
    const { result } = renderHook(() => useSearch({ query: '' }), { wrapper })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(searchApi.search).not.toHaveBeenCalled()
  })

  it('does not fetch when enabled is false', async () => {
    const { result } = renderHook(() => useSearch({ query: 'test' }, false), {
      wrapper,
    })

    expect(result.current.isLoading).toBe(false)
    expect(searchApi.search).not.toHaveBeenCalled()
  })

  it('refetches when query changes', async () => {
    vi.mocked(searchApi.search).mockResolvedValue(mockSearchResults)

    const { result, rerender } = renderHook(
      ({ query }) => useSearch({ query }),
      {
        wrapper,
        initialProps: { query: 'test1' },
      }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    rerender({ query: 'test2' })

    await waitFor(() => {
      expect(searchApi.search).toHaveBeenCalledWith({ query: 'test2' })
    })
  })
})
