import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { ErrorBanner } from '../ErrorBanner'
import { mockApiError } from '../../test/mock-data'

describe('ErrorBanner', () => {
  it('renders nothing when error is null', () => {
    const { container } = render(<ErrorBanner error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('displays error message for ApiError', () => {
    render(<ErrorBanner error={mockApiError} />)
    expect(screen.getByText('API Error occurred')).toBeInTheDocument()
  })

  it('displays error message for Error object', () => {
    const error = new Error('Something went wrong')
    render(<ErrorBanner error={error} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup()
    const handleRetry = vi.fn()
    render(<ErrorBanner error={mockApiError} onRetry={handleRetry} />)

    const retryButton = screen.getByRole('button', { name: /retry/i })
    await user.click(retryButton)

    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    const handleDismiss = vi.fn()
    render(<ErrorBanner error={mockApiError} onDismiss={handleDismiss} />)

    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    await user.click(dismissButton)

    expect(handleDismiss).toHaveBeenCalledTimes(1)
  })

  it('has proper accessibility attributes', () => {
    render(<ErrorBanner error={mockApiError} onRetry={vi.fn()} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'assertive')
  })

  it('does not render buttons when handlers are not provided', () => {
    render(<ErrorBanner error={mockApiError} />)

    expect(
      screen.queryByRole('button', { name: /retry/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /dismiss/i })
    ).not.toBeInTheDocument()
  })
})
