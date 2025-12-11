import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { ResultsList } from '../ResultsList'
import { mockSearchResults } from '../../test/mock-data'

describe('ResultsList', () => {
  it('renders list of results', () => {
    render(<ResultsList results={mockSearchResults} />)

    expect(screen.getByText('Test Result 1')).toBeInTheDocument()
    expect(screen.getByText('Test Result 2')).toBeInTheDocument()
    expect(screen.getByText('Test Result 3')).toBeInTheDocument()
  })

  it('displays empty message when no results', () => {
    render(<ResultsList results={[]} emptyMessage="No results found" />)
    expect(screen.getByText('No results found')).toBeInTheDocument()
  })

  it('calls onSelect when result is clicked', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    render(<ResultsList results={mockSearchResults} onSelect={handleSelect} />)

    const firstResult = screen.getByText('Test Result 1')
    await user.click(firstResult)

    expect(handleSelect).toHaveBeenCalledWith(mockSearchResults[0])
  })

  it('calls onSelect when Enter key is pressed', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    render(<ResultsList results={mockSearchResults} onSelect={handleSelect} />)

    const firstResult = screen.getByRole('button', {
      name: /Search result: Test Result 1/i,
    })
    firstResult.focus()
    await user.keyboard('{Enter}')

    expect(handleSelect).toHaveBeenCalledWith(mockSearchResults[0])
  })

  it('calls onSelect when Space key is pressed', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    render(<ResultsList results={mockSearchResults} onSelect={handleSelect} />)

    const firstResult = screen.getByRole('button', {
      name: /Search result: Test Result 1/i,
    })
    firstResult.focus()
    await user.keyboard(' ')

    expect(handleSelect).toHaveBeenCalledWith(mockSearchResults[0])
  })

  it('renders external links when url is provided', () => {
    render(<ResultsList results={mockSearchResults} />)

    const link = screen.getByRole('link', { name: /Open Test Result 1/i })
    expect(link).toHaveAttribute('href', 'https://example.com/1')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('has proper accessibility attributes', () => {
    render(<ResultsList results={mockSearchResults} onSelect={vi.fn()} />)

    const list = screen.getByRole('list')
    expect(list).toHaveAttribute('aria-label', 'Search results')

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
  })
})
