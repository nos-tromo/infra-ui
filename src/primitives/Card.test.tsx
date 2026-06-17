import { render, screen } from '@testing-library/react'
import { Card } from './Card'

test('renders children inside the surface', () => {
  render(<Card>body</Card>)
  expect(screen.getByText('body')).toHaveClass('rounded-lg')
})

test('merges a custom className', () => {
  render(<Card className="p-8">x</Card>)
  expect(screen.getByText('x')).toHaveClass('p-8')
})
