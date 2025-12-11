import React, { useState } from 'react'
import type { SearchResult } from '../types'

interface PlayerShellProps {
  currentItem?: SearchResult
  onClose?: () => void
}

export function PlayerShell({
  currentItem,
  onClose,
}: PlayerShellProps): React.ReactElement | null {
  const [isPlaying, setIsPlaying] = useState(false)

  if (!currentItem) return null

  const handlePlayPause = (): void => {
    setIsPlaying(!isPlaying)
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      onClose?.()
    } else if (e.key === ' ') {
      e.preventDefault()
      handlePlayPause()
    }
  }

  return (
    <div
      role="region"
      aria-label="Media player"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '16px',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              margin: '0 0 4px 0',
              fontSize: '16px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentItem.title}
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: '#aaa',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentItem.description}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <button
            onClick={handlePlayPause}
            onKeyDown={handleKeyDown}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            aria-pressed={isPlaying}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#007bff',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0056b3'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#007bff'
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close player"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid #444',
                backgroundColor: 'transparent',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
