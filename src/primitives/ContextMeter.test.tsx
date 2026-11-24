import { render, screen } from '@testing-library/react'
import { ContextMeter } from './ContextMeter'

const LABEL = 'about 62 % of the context used'
const arc = (c: HTMLElement) => c.querySelector('[data-part="arc"]')

test('a meter from 0 to 100, named and titled by its label, at the whole percent of its value', () => {
  render(<ContextMeter value={0.623} label={LABEL} />)
  const meter = screen.getByRole('meter', { name: LABEL })
  expect(meter).toHaveAttribute('aria-valuemin', '0')
  expect(meter).toHaveAttribute('aria-valuemax', '100')
  expect(meter).toHaveAttribute('aria-valuenow', '62')
  expect(meter).toHaveAttribute('aria-valuetext', LABEL) // read as the app words it, not a bare 62
  expect(meter).toHaveAttribute('title', LABEL)
  expect(meter.textContent).toBe('') // drawn, never typed
  expect(meter.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test.each([
  [1.4, '100', 'warn'],
  [Infinity, '100', 'warn'],
  [-1, '0', 'normal'],
  [-Infinity, '0', 'normal'],
  [Number.NaN, '0', 'normal'],
])('a value of %s is clamped: aria-valuenow %s, level %s', (value, now, level) => {
  render(<ContextMeter value={value} label={LABEL} />)
  expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', now)
  expect(screen.getByRole('meter')).toHaveAttribute('data-level', level)
})

test('the ring starts at the top: the svg is turned a quarter back, on a track of radius 9', () => {
  const { container } = render(<ContextMeter value={0.5} label={LABEL} />)
  expect(container.querySelector('svg')).toHaveClass('-rotate-90')
  expect(container.querySelector('[data-part="track"]')).toHaveAttribute('r', '9')
  expect(arc(container)).toHaveAttribute('r', '9')
})

test('the arc draws the same whole percent the meter says, and nothing at zero', () => {
  const { container, rerender } = render(<ContextMeter value={0.623} label={LABEL} />)
  expect(arc(container)).toHaveAttribute('stroke-dasharray', '62 100')
  expect(arc(container)).toHaveAttribute('pathLength', '100')
  rerender(<ContextMeter value={1.4} label={LABEL} />)
  expect(arc(container)).toHaveAttribute('stroke-dasharray', '100 100')
  for (const value of [0, 0.004, Number.NaN]) {
    rerender(<ContextMeter value={value} label={LABEL} />)
    expect(arc(container)).toBeNull() // no round-capped dot
    expect(container.querySelector('[data-part="track"]')).toHaveClass('text-border')
  }
})

test('the level turns to warn at 0.8 by default, and the arc to the warning colour', () => {
  const { container, rerender } = render(<ContextMeter value={0.79} label={LABEL} />)
  expect(screen.getByRole('meter')).toHaveAttribute('data-level', 'normal')
  expect(arc(container)).toHaveClass('text-muted-foreground')
  expect(arc(container)).not.toHaveClass('text-warning')
  for (const value of [0.8, 0.95, 1]) {
    rerender(<ContextMeter value={value} label={LABEL} />)
    expect(screen.getByRole('meter')).toHaveAttribute('data-level', 'warn')
    expect(arc(container)).toHaveClass('text-warning')
  }
})

test('the level is decided on the value, not on the rounded percent', () => {
  render(<ContextMeter value={0.799} label="about 80 % of the context used" />)
  expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '80')
  expect(screen.getByRole('meter')).toHaveAttribute('data-level', 'normal') // as an app comparing 0.799 with 0.8 decides
})

test('warnAt moves the threshold', () => {
  const { rerender } = render(<ContextMeter value={0.5} warnAt={0.5} label={LABEL} />)
  expect(screen.getByRole('meter')).toHaveAttribute('data-level', 'warn')
  rerender(<ContextMeter value={0.49} warnAt={0.5} label={LABEL} />)
  expect(screen.getByRole('meter')).toHaveAttribute('data-level', 'normal')
  rerender(<ContextMeter value={0.85} warnAt={0.9} label={LABEL} />)
  expect(screen.getByRole('meter')).toHaveAttribute('data-level', 'normal')
})

test('className is merged onto the meter, last', () => {
  render(<ContextMeter value={0.623} label={LABEL} className="size-5 ml-1" />)
  const meter = screen.getByRole('meter')
  expect(meter).toHaveClass('inline-flex', 'size-5', 'ml-1')
  expect(meter).not.toHaveClass('size-4.5')
})
