import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

test('renders the neutral variant by default', () => {
  render(<Badge>new</Badge>)
  expect(screen.getByText('new')).toHaveClass('text-muted-foreground')
})

test('applies the accent variant', () => {
  render(<Badge variant="accent">live</Badge>)
  expect(screen.getByText('live')).toHaveClass('text-primary')
})
