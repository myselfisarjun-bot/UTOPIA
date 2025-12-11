import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  ErrorBoundary,
  SearchBar,
  ResultsList,
  PlayerShell,
  ErrorBanner,
  LoadingSpinner,
} from './components'
import { useSearch } from './hooks/useSearch'
import type { SearchResult } from './types'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
})

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<SearchResult | undefined>()

  const { data, isLoading, error, refetch } = useSearch(
    { query: searchQuery, limit: 10 },
    !!searchQuery
  )

  const handleSearch = (query: string): void => {
    setSearchQuery(query)
  }

  const handleSelectResult = (result: SearchResult): void => {
    setSelectedItem(result)
  }

  const handleClosePlayer = (): void => {
    setSelectedItem(undefined)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Search Application</h1>
      </header>

      <main className="app-main">
        <div className="search-section">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Enter your search query..."
            disabled={isLoading}
          />
        </div>

        {error && (
          <ErrorBanner
            error={error}
            onRetry={() => refetch()}
            onDismiss={() => setSearchQuery('')}
          />
        )}

        <div className="results-section">
          {isLoading ? (
            <LoadingSpinner size="large" label="Searching..." />
          ) : (
            <ResultsList
              results={data || []}
              onSelect={handleSelectResult}
              emptyMessage={
                searchQuery
                  ? 'No results found for your search'
                  : 'Enter a search query to get started'
              }
            />
          )}
        </div>
      </main>

      <PlayerShell currentItem={selectedItem} onClose={handleClosePlayer} />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
