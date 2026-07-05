import { render, screen } from '@testing-library/react'
import { HoverIconAction } from './HoverIconAction'

const Glyph = () => <svg data-testid="glyph" />

test('exposes the label as the accessible name and the tooltip', () => {
  render(<HoverIconAction icon={<Glyph />} label="Translate" />)
  const btn = screen.getByRole('button', { name: 'Translate' })
  expect(btn).toBeInTheDocument()
  expect(btn).toHaveAttribute('title', 'Translate')
})

test('is hover/focus revealed (opacity-0 until group/focus)', () => {
  render(<HoverIconAction icon={<Glyph />} label="Translate" />)
  const btn = screen.getByRole('button', { name: 'Translate' })
  expect(btn).toHaveClass('opacity-0', 'group-hover:opacity-100', 'focus-visible:opacity-100')
})

test('renders the passed icon and forwards native attrs', () => {
  render(<HoverIconAction icon={<Glyph />} label="Translate" disabled />)
  expect(screen.getByTestId('glyph')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Translate' })).toBeDisabled()
})

test('merges a custom className', () => {
  render(<HoverIconAction icon={<Glyph />} label="Translate" className="ml-2" />)
  expect(screen.getByRole('button', { name: 'Translate' })).toHaveClass('ml-2')
})
