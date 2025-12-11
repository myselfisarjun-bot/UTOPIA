import React from 'react'
import type { ApiError } from '../types'

interface ErrorBannerProps {
  error: ApiError | Error | null
  onRetry?: () => void
  onDismiss?: () => void
}

export function ErrorBanner({
  error,
  onRetry,
  onDismiss,
}: ErrorBannerProps): React.ReactElement | null {
  if (!error) return null

  const errorMessage =
    error instanceof Error
      ? error.message
      : (error as ApiError).message || 'An error occurred'

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#fff5f5',
        border: '1px solid #ff4444',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}
        >
          <span
            role="img"
            aria-label="Error"
            style={{ fontSize: '20px', color: '#cc0000' }}
          >
            ⚠️
          </span>
          <strong style={{ color: '#cc0000' }}>Error</strong>
        </div>
        <p style={{ margin: 0, color: '#666' }}>{errorMessage}</p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            aria-label="Retry"
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss error"
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              color: '#666',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
