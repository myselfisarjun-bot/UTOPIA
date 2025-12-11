import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { SearchBar } from '../SearchBar'

describe('SearchBar', () => {
  it('renders with placeholder text', () => {
    render(<SearchBar onSearch={vi.fn()} placeholder="Search here" />)
    expect(screen.getByPlaceholderText('Search here')).toBeInTheDocument()
  })

  it('calls onSearch when form is submitted', async () => {
    const user = userEvent.setup()
    const handleSearch = vi.fn()
    render(<SearchBar onSearch={handleSearch} />)

    const input = screen.getByRole('searchbox')
    const submitButton = screen.getByRole('button', { name: /submit search/i })

    await user.type(input, 'test query')
    await user.click(submitButton)

    expect(handleSearch).toHaveBeenCalledWith('test query')
  })

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup()
    const handleSearch = vi.fn()
    render(<SearchBar onSearch={handleSearch} />)

    const input = screen.getByRole('searchbox') as HTMLInputElement

    await user.type(input, 'test query')
    expect(input.value).toBe('test query')

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    await user.click(clearButton)

    expect(input.value).toBe('')
    expect(handleSearch).toHaveBeenCalledWith('')
  })

  it('disables input and button when disabled prop is true', () => {
    render(<SearchBar onSearch={vi.fn()} disabled={true} />)

    const input = screen.getByRole('searchbox')
    const submitButton = screen.getByRole('button', { name: /submit search/i })

    expect(input).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('trims whitespace from search query', async () => {
    const user = userEvent.setup()
    const handleSearch = vi.fn()
    render(<SearchBar onSearch={handleSearch} />)

    const input = screen.getByRole('searchbox')
    const submitButton = screen.getByRole('button', { name: /submit search/i })

    await user.type(input, '  test query  ')
    await user.click(submitButton)

    expect(handleSearch).toHaveBeenCalledWith('test query')
  })

  it('has proper accessibility attributes', () => {
    render(<SearchBar onSearch={vi.fn()} />)

    const form = screen.getByRole('search')
    expect(form).toHaveAttribute('aria-label', 'Search form')

    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('aria-label', 'Search input')
    expect(input).toHaveAttribute('aria-required', 'true')
  })
})
