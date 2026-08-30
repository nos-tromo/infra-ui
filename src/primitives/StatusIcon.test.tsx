import { render, screen } from '@testing-library/react'
import { StatusIcon, type StatusIconStatus } from './StatusIcon'

const STATUSES: StatusIconStatus[] = ['idle', 'running', 'done', 'failed', 'cancelled']

test('every state names itself and carries a tooltip', () => {
  for (const status of STATUSES) {
    const { container, unmount } = render(<StatusIcon status={status} label={`State ${status}`} />)
    // The marker replaces a word, so the wording has to survive somewhere: the
    // accessibility tree for a screen reader, `title` for a hovering pointer.
    expect(screen.getByTitle(`State ${status}`), status).toBeInTheDocument()
    expect(container.textContent, status).toBe('')
    unmount()
  }
})

test('the terminal states are drawn, the live one spins', () => {
  for (const status of ['idle', 'done', 'failed', 'cancelled'] as const) {
    const { container, unmount } = render(<StatusIcon status={status} label="x" />)
    // A drawn SVG, never a text character: ✓ and ✗ render from whatever font
    // the machine falls back to, and can arrive full-colour as emoji.
    expect(container.querySelector('svg'), status).not.toBeNull()
    expect(container.querySelector('[role="status"]'), status).toBeNull()
    unmount()
  }
  render(<StatusIcon status="running" label="Processing" />)
  // Motion is what separates "still going" from "queued" at a glance, and the
  // spinner's own live role is what announces it as ongoing.
  expect(screen.getByRole('status', { name: 'Processing' })).toHaveClass('animate-spin')
})

test('the static markers are images with the label as their name', () => {
  render(<StatusIcon status="done" label="Complete" />)
  expect(screen.getByRole('img', { name: 'Complete' })).toBeInTheDocument()
})

test('failed and cancelled share the cross but not the tint', () => {
  const { container: failed } = render(<StatusIcon status="failed" label="Failed" />)
  const { container: cancelled } = render(<StatusIcon status="cancelled" label="Cancelled" />)
  // One is an error to look at, the other is something the user stopped on
  // purpose — same drawing, and the colour is the whole difference.
  expect(failed.querySelector('path')!.getAttribute('d')).toBe(
    cancelled.querySelector('path')!.getAttribute('d'),
  )
  expect(failed.querySelector('svg')).toHaveClass('text-danger')
  expect(cancelled.querySelector('svg')).toHaveClass('text-muted-foreground')
})

test('done and idle are told apart by their drawing', () => {
  const { container: done } = render(<StatusIcon status="done" label="Complete" />)
  const { container: idle } = render(<StatusIcon status="idle" label="Queued" />)
  expect(done.querySelector('path')!.getAttribute('d')).not.toBe(
    idle.querySelector('path')!.getAttribute('d'),
  )
  // The stopwatch keeps its face — stripped to strokes it is just a tick.
  expect(idle.querySelector('circle')).not.toBeNull()
  expect(done.querySelector('svg')).toHaveClass('text-primary')
})

test('the caller can resize any state', () => {
  const { container } = render(<StatusIcon status="done" label="Complete" className="h-3.5 w-3.5" />)
  expect(container.querySelector('svg')).toHaveClass('h-3.5', 'w-3.5')
  const { container: spinning } = render(
    <StatusIcon status="running" label="Processing" className="h-3.5 w-3.5" />,
  )
  expect(spinning.querySelector('[role="status"]')).toHaveClass('h-3.5', 'w-3.5')
})
