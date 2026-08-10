import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IconButton, IconLink } from './IconButton'

const Icon = () => <svg data-testid="icon" />

test('exposes the label as the accessible name and the tooltip', () => {
  render(<IconButton icon={<Icon />} label="Download" />)
  const btn = screen.getByRole('button', { name: 'Download' })
  expect(btn).toHaveAttribute('title', 'Download')
  expect(screen.getByTestId('icon')).toBeInTheDocument()
})

test('carries no background until hovered', () => {
  render(<IconButton icon={<Icon />} label="Download" />)
  const btn = screen.getByRole('button', { name: 'Download' })
  // ghost: transparent at rest, a background only under the pointer.
  expect(btn).toHaveClass('hover:bg-muted')
  expect(btn.className).not.toMatch(/(^|\s)(bg-muted|border)(\s|$)/)
})

test('is square without an adornment and padded with one', () => {
  const { rerender } = render(<IconButton icon={<Icon />} label="Download" />)
  expect(screen.getByRole('button', { name: 'Download' })).toHaveClass('aspect-square', 'px-0')

  rerender(
    <IconButton icon={<Icon />} label="Export GraphML">
      GraphML
    </IconButton>,
  )
  const adorned = screen.getByRole('button', { name: 'Export GraphML' })
  expect(adorned).toHaveClass('px-2.5')
  // Side-by-side actions are told apart by the adornment, so it stays visible —
  // and the accessible name contains it, as WCAG "Label in Name" requires.
  expect(adorned).toHaveTextContent('GraphML')
})

test('swaps the icon for a spinner while busy and refuses further clicks', async () => {
  const onClick = vi.fn()
  render(<IconButton icon={<Icon />} label="Remove" busy onClick={onClick} />)
  const btn = screen.getByRole('button', { name: 'Remove' })
  expect(screen.queryByTestId('icon')).not.toBeInTheDocument()
  expect(btn).toHaveAttribute('aria-busy', 'true')
  expect(btn).toBeDisabled()

  await userEvent.click(btn)
  expect(onClick).not.toHaveBeenCalled()
})

test('a hint explains an unavailable action without renaming it', () => {
  render(
    <IconButton icon={<Icon />} label="Download all jobs" hint="No jobs completed yet" disabled />,
  )
  // Named for what it does, not for why it cannot: a disabled control called
  // "No jobs completed yet" tells a screen-reader user nothing about the action.
  const btn = screen.getByRole('button', { name: 'Download all jobs' })
  expect(btn).toHaveAttribute('title', 'No jobs completed yet')
  expect(btn).toBeDisabled()
})

test('tints on hover only when the action takes something away', () => {
  const { rerender } = render(<IconButton icon={<Icon />} label="Download" />)
  expect(screen.getByRole('button', { name: 'Download' })).not.toHaveClass('hover:text-danger')

  rerender(<IconButton icon={<Icon />} label="Delete" tone="danger" />)
  expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('hover:text-danger')
})

test('runs its click handler and merges a custom className', async () => {
  const onClick = vi.fn()
  render(<IconButton icon={<Icon />} label="Download" className="ml-2" onClick={onClick} />)
  const btn = screen.getByRole('button', { name: 'Download' })
  expect(btn).toHaveClass('ml-2')
  await userEvent.click(btn)
  expect(onClick).toHaveBeenCalledTimes(1)
})

test('IconLink renders an anchor wearing the same shell', () => {
  render(<IconLink icon={<Icon />} label="Export CSV" href="/export.csv" />)
  const link = screen.getByRole('link', { name: 'Export CSV' })
  expect(link).toHaveAttribute('href', '/export.csv')
  expect(link).toHaveAttribute('title', 'Export CSV')
  expect(link).toHaveClass('aspect-square', 'hover:bg-muted')
})
