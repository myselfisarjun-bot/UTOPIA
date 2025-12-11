import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/test-utils'
import { LoadingSpinner } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders with custom label', () => {
    render(<LoadingSpinner label="Please wait..." />)
    expect(screen.getByLabelText('Please wait...')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner label="Loading content" />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveAttribute('aria-label', 'Loading content')
  })
})
