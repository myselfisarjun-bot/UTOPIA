import React from 'react'
import type { KeyboardEvent } from 'react'
import type { SearchResult } from '../types'

interface ResultsListProps {
  results: SearchResult[]
  onSelect?: (result: SearchResult) => void
  emptyMessage?: string
}

export function ResultsList({
  results,
  onSelect,
  emptyMessage = 'No results found',
}: ResultsListProps): React.ReactElement {
  const handleKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    result: SearchResult
  ): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.(result)
    }
  }

  if (results.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#666',
        }}
      >
        {emptyMessage}
      </div>
    )
  }

  return (
    <ul
      aria-label="Search results"
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {results.map((result) => (
        <li key={result.id}>
          <button
            onClick={() => onSelect?.(result)}
            onKeyDown={(e) => handleKeyDown(e, result)}
            aria-label={`Search result: ${result.title}`}
            disabled={!onSelect}
            style={{
              width: '100%',
              padding: '16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: onSelect ? 'pointer' : 'default',
              transition: 'all 0.2s',
              backgroundColor: 'white',
              textAlign: 'left',
              fontSize: 'inherit',
            }}
            onMouseEnter={(e) => {
              if (onSelect) {
                e.currentTarget.style.borderColor = '#007bff'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (onSelect) {
                e.currentTarget.style.borderColor = '#e0e0e0'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
            onFocus={(e) => {
              if (onSelect) {
                e.currentTarget.style.borderColor = '#007bff'
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px rgba(0, 123, 255, 0.1)'
              }
            }}
            onBlur={(e) => {
              if (onSelect) {
                e.currentTarget.style.borderColor = '#e0e0e0'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            <h3
              style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                fontWeight: 600,
                color: '#333',
              }}
            >
              {result.title}
            </h3>
            <p
              style={{
                margin: '0',
                fontSize: '14px',
                color: '#666',
                lineHeight: '1.5',
              }}
            >
              {result.description}
            </p>
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${result.title} in new tab`}
                style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  fontSize: '14px',
                  color: '#007bff',
                  textDecoration: 'none',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                View Details →
              </a>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
