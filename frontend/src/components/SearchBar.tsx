import React, { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  initialValue?: string
  disabled?: boolean
}

export function SearchBar({
  onSearch,
  placeholder = 'Search...',
  initialValue = '',
  disabled = false,
}: SearchBarProps): React.ReactElement {
  const [query, setQuery] = useState(initialValue)

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setQuery(e.target.value)
  }

  const handleClear = (): void => {
    setQuery('')
    onSearch('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search form"
      style={{
        display: 'flex',
        gap: '8px',
        width: '100%',
        maxWidth: '600px',
      }}
    >
      <div style={{ position: 'relative', flex: 1 }}>
        <input
          type="search"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Search input"
          aria-required="true"
          style={{
            width: '100%',
            padding: '12px 16px',
            paddingRight: query ? '40px' : '16px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#007bff'
            e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#ccc'
            e.target.style.boxShadow = 'none'
          }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#666',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled || !query.trim()}
        aria-label="Submit search"
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 500,
          color: 'white',
          backgroundColor: disabled || !query.trim() ? '#ccc' : '#007bff',
          border: 'none',
          borderRadius: '8px',
          cursor: disabled || !query.trim() ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!disabled && query.trim()) {
            e.currentTarget.style.backgroundColor = '#0056b3'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && query.trim()) {
            e.currentTarget.style.backgroundColor = '#007bff'
          }
        }}
      >
        Search
      </button>
    </form>
  )
}
