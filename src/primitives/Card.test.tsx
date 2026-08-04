import { render, screen } from '@testing-library/react'
import { Card } from './Card'

test('renders children on an opaque tile surface', () => {
  render(<Card>body</Card>)
  expect(screen.getByText('body')).toHaveClass('rounded-lg', 'bg-muted')
})

test('merges a custom className', () => {
  render(<Card className="p-8">x</Card>)
  expect(screen.getByText('x')).toHaveClass('p-8')
})

test('renders an accent title above the body', () => {
  render(<Card title="Documents">1,284</Card>)
  const heading = screen.getByText('Documents')
  expect(heading).toHaveClass('text-primary', 'font-semibold')
})

test('interactive cards get the hover-accent border', () => {
  render(<Card interactive>x</Card>)
  expect(screen.getByText('x')).toHaveClass('hover:border-primary')
})
