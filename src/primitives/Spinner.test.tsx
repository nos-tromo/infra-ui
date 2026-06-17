import { render, screen } from '@testing-library/react'
import { Spinner } from './Spinner'

test('exposes a status role with the default label', () => {
  render(<Spinner />)
  expect(screen.getByRole('status', { name: 'Loading' })).toHaveClass('animate-spin')
})

test('accepts a custom label', () => {
  render(<Spinner label="Fetching" />)
  expect(screen.getByRole('status', { name: 'Fetching' })).toBeInTheDocument()
})
