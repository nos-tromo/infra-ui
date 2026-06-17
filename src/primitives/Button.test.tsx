import { render, screen } from '@testing-library/react'
import { Button } from './Button'

test('renders children and the default primary variant', () => {
  render(<Button>Save</Button>)
  expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('bg-primary')
})

test('applies the danger variant', () => {
  render(<Button variant="danger">Delete</Button>)
  expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-danger')
})

test('merges a custom className', () => {
  render(<Button className="w-full">X</Button>)
  expect(screen.getByRole('button', { name: 'X' })).toHaveClass('w-full')
})

test('forwards native button attributes', () => {
  render(<Button disabled>Nope</Button>)
  expect(screen.getByRole('button', { name: 'Nope' })).toBeDisabled()
})
