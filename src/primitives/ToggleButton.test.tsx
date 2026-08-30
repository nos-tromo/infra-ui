import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToggleButton } from './ToggleButton'

test('renders its label and reads as off by default', () => {
  render(<ToggleButton pressed={false}>Summary</ToggleButton>)
  const toggle = screen.getByRole('button', { name: 'Summary' })
  expect(toggle).toHaveAttribute('aria-pressed', 'false')
  expect(toggle).toHaveClass('bg-muted')
})

test('fills with the accent colour when pressed', () => {
  // The colour IS the answer here — a screen reader gets `aria-pressed`, and
  // everyone else gets the fill. The two must never disagree.
  render(<ToggleButton pressed>Summary</ToggleButton>)
  const toggle = screen.getByRole('button', { name: 'Summary' })
  expect(toggle).toHaveAttribute('aria-pressed', 'true')
  expect(toggle).toHaveClass('bg-primary')
})

test('keeps its name across the flip', async () => {
  // The label says what the option is, not what the next click does, so the
  // accessible name is stable and only the state changes.
  const onClick = vi.fn()
  const { rerender } = render(
    <ToggleButton pressed={false} onClick={onClick}>
      Keyframes
    </ToggleButton>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Keyframes' }))
  expect(onClick).toHaveBeenCalledTimes(1)

  rerender(<ToggleButton pressed>Keyframes</ToggleButton>)
  expect(screen.getByRole('button', { name: 'Keyframes' })).toHaveAttribute('aria-pressed', 'true')
})

test('never submits the form it sits in', () => {
  render(<ToggleButton pressed={false}>Word analysis</ToggleButton>)
  expect(screen.getByRole('button', { name: 'Word analysis' })).toHaveAttribute('type', 'button')
})

test('merges a custom className', () => {
  render(
    <ToggleButton pressed={false} className="flex-1">
      X
    </ToggleButton>,
  )
  expect(screen.getByRole('button', { name: 'X' })).toHaveClass('flex-1')
})

test('forwards native button attributes', () => {
  render(
    <ToggleButton pressed disabled>
      Nope
    </ToggleButton>,
  )
  expect(screen.getByRole('button', { name: 'Nope' })).toBeDisabled()
})
