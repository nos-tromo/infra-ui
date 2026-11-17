import { render, screen } from '@testing-library/react'
import { UserBubble } from './UserBubble'

test('holds what the user wrote in the accent bubble', () => {
  render(<UserBubble data-role="user">What changed since Monday?</UserBubble>)
  const bubble = screen.getByText('What changed since Monday?')
  expect(bubble).toHaveAttribute('data-role', 'user')
  expect(bubble).toHaveClass('ml-auto', 'bg-bubble', 'text-bubble-foreground')
})

test('merges the caller’s classes over its own', () => {
  render(<UserBubble className="max-w-[70%]">Short</UserBubble>)
  const bubble = screen.getByText('Short')
  expect(bubble).toHaveClass('max-w-[70%]')
  expect(bubble).not.toHaveClass('max-w-[85%]')
})
