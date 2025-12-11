import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { PlayerShell } from '../PlayerShell'
import { mockSearchResults } from '../../test/mock-data'

describe('PlayerShell', () => {
  it('renders nothing when currentItem is undefined', () => {
    const { container } = render(<PlayerShell />)
    expect(container.firstChild).toBeNull()
  })

  it('displays current item information', () => {
    render(<PlayerShell currentItem={mockSearchResults[0]} />)

    expect(screen.getByText('Test Result 1')).toBeInTheDocument()
    expect(
      screen.getByText('This is the first test result')
    ).toBeInTheDocument()
  })

  it('toggles play/pause state when button is clicked', async () => {
    const user = userEvent.setup()
    render(<PlayerShell currentItem={mockSearchResults[0]} />)

    const playButton = screen.getByRole('button', { name: /^play$/i })
    expect(playButton).toHaveTextContent('▶')

    await user.click(playButton)

    const pauseButton = screen.getByRole('button', { name: /^pause$/i })
    expect(pauseButton).toHaveTextContent('⏸')
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    render(
      <PlayerShell currentItem={mockSearchResults[0]} onClose={handleClose} />
    )

    const closeButton = screen.getByRole('button', { name: /close player/i })
    await user.click(closeButton)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed on play button', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    render(
      <PlayerShell currentItem={mockSearchResults[0]} onClose={handleClose} />
    )

    const playButton = screen.getByRole('button', { name: /^play$/i })
    playButton.focus()
    await user.keyboard('{Escape}')

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('toggles play state when Space key is pressed on play button', async () => {
    const user = userEvent.setup()
    render(<PlayerShell currentItem={mockSearchResults[0]} />)

    const playButton = screen.getByRole('button', { name: /^play$/i })
    expect(playButton).toHaveAttribute('aria-pressed', 'false')

    playButton.focus()
    await user.keyboard(' ')

    const pauseButton = screen.getByRole('button', { name: /^pause$/i })
    expect(pauseButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('has proper accessibility attributes', () => {
    render(<PlayerShell currentItem={mockSearchResults[0]} />)

    const player = screen.getByRole('region')
    expect(player).toHaveAttribute('aria-label', 'Media player')

    const playButton = screen.getByRole('button', { name: /^play$/i })
    expect(playButton).toHaveAttribute('aria-pressed')
  })
})
