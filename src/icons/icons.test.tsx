import { render } from '@testing-library/react'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  DownloadIcon,
  PlusIcon,
  TrashIcon,
  WarningIcon,
  XIcon,
} from './index'

const ICONS = {
  DownloadIcon,
  XIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  WarningIcon,
}

test('every icon is drawn geometry, not a text character', () => {
  for (const [name, Icon] of Object.entries(ICONS)) {
    const { container } = render(<Icon />)
    const svg = container.querySelector('svg')
    expect(svg, name).not.toBeNull()
    // Paths, not codepoints: a character renders from whatever font the OS
    // falls back to, so its size and weight differ on every machine.
    expect(svg!.querySelectorAll('path').length, name).toBeGreaterThan(0)
    expect(svg!.textContent, name).toBe('')
  }
})

test('icons inherit color and stay out of the accessibility tree', () => {
  for (const [name, Icon] of Object.entries(ICONS)) {
    const { container } = render(<Icon />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('stroke'), name).toBe('currentColor')
    // The control around them carries the accessible name.
    expect(svg.getAttribute('aria-hidden'), name).toBe('true')
  }
})

test('the caller sizes them, defaulting to 4', () => {
  const { container, rerender } = render(<DownloadIcon />)
  expect(container.querySelector('svg')).toHaveClass('h-4', 'w-4')
  rerender(<DownloadIcon className="h-3.5 w-3.5" />)
  expect(container.querySelector('svg')).toHaveClass('h-3.5', 'w-3.5')
})

test('the two reorder chevrons point opposite ways', () => {
  const { container: up } = render(<ChevronUpIcon />)
  const { container: down } = render(<ChevronDownIcon />)
  // Same drawing for both would make a reorder pair unusable.
  expect(up.querySelector('path')!.getAttribute('d')).not.toBe(
    down.querySelector('path')!.getAttribute('d'),
  )
})

test('the plus is upright, not the × turned 45°', () => {
  const { container: plus } = render(<PlusIcon />)
  const { container: cross } = render(<XIcon />)
  // Adding and removing are opposite actions drawn from the same two strokes,
  // so only the angle tells them apart — a diagonal plus reads as a remove.
  expect(plus.querySelector('path')!.getAttribute('d')).not.toBe(
    cross.querySelector('path')!.getAttribute('d'),
  )
})
