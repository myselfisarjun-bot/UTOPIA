import React from 'react'

interface LoadingSkeletonProps {
  width?: string
  height?: string
  borderRadius?: string
  count?: number
}

export function LoadingSkeleton({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  count = 1,
}: LoadingSkeletonProps): React.ReactElement {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          role="status"
          aria-label="Loading"
          style={{
            width,
            height,
            borderRadius,
            backgroundColor: '#e0e0e0',
            marginBottom: count > 1 ? '8px' : '0',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  )
}
