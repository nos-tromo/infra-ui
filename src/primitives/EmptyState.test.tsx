import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

test('centres a muted message in a dashed box', () => {
  const { container } = render(<EmptyState>No extracts yet.</EmptyState>)
  expect(container.firstElementChild).toHaveClass('border-dashed', 'items-center', 'text-center')
  expect(screen.getByText('No extracts yet.')).toHaveClass('text-muted-foreground')
})

test('renders the one call to action below the message', () => {
  render(<EmptyState action={<button>Build extract</button>}>No extracts yet.</EmptyState>)
  const message = screen.getByText('No extracts yet.')
  const button = screen.getByRole('button', { name: 'Build extract' })
  expect(message.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test('without an action there is only the message', () => {
  const { container } = render(<EmptyState>No extracts yet.</EmptyState>)
  expect(container.querySelector('button')).toBeNull()
})
