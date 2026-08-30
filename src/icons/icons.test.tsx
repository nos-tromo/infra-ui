import { render } from '@testing-library/react'
import {
  ArrowLeftIcon,
  BrainActiveIcon,
  BrainIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  DownloadIcon,
  ExternalLinkIcon,
  InfoIcon,
  PlayIcon,
  PlusIcon,
  RefreshIcon,
  ReportCheckIcon,
  ReportIcon,
  SearchIcon,
  SendIcon,
  StopwatchIcon,
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
  CheckIcon,
  StopwatchIcon,
  InfoIcon,
  ExternalLinkIcon,
  ReportIcon,
  ReportCheckIcon,
  SendIcon,
  SearchIcon,
  RefreshIcon,
  ArrowLeftIcon,
  BrainIcon,
  BrainActiveIcon,
  PlayIcon,
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

test('the pass and fail markers are told apart by their drawing', () => {
  const { container: pass } = render(<CheckIcon />)
  const { container: fail } = render(<XIcon />)
  // These two are read side by side as one status pair — a terminal state is
  // "the ✓ one" or "the ✗ one" at a glance, before any label is read.
  expect(pass.querySelector('path')!.getAttribute('d')).not.toBe(
    fail.querySelector('path')!.getAttribute('d'),
  )
})

test('there is exactly one checkmark in the system', () => {
  // CopyButton drew its own check before `src/icons/` existed. A design system
  // holding two different checkmarks is the duplication this directory was
  // extracted to end, so the exported one must stay the drawing every
  // primitive uses — not a second, subtly different tick.
  const { container } = render(<CheckIcon />)
  expect(container.querySelector('path')!.getAttribute('d')).toBe('M20 6 9 17l-5-5')
})

test('the dialled icons keep their dial', () => {
  // Stopwatch and info both mean nothing without the enclosing round face:
  // stripped to their strokes, the stopwatch is a tick and the info is a
  // lowercase i. The circle is not decoration.
  for (const [name, Icon] of Object.entries({ StopwatchIcon, InfoIcon })) {
    const { container } = render(<Icon />)
    expect(container.querySelector('svg')!.querySelector('circle'), name).not.toBeNull()
  }
})

test('the report pair is one page in two states', () => {
  const { container: empty } = render(<ReportIcon />)
  const { container: filed } = render(<ReportCheckIcon />)
  const page = (c: HTMLElement) =>
    [...c.querySelectorAll('path')].slice(0, 2).map((p) => p.getAttribute('d'))
  // "Add to report" is a toggle carrying no text of its own, so the sheet has
  // to stay put while only its contents change — a page that also moved would
  // read as the icon being swapped for a different one, not as a state.
  expect(page(empty)).toEqual(page(filed))
  expect(empty.querySelectorAll('path')).toHaveLength(filed.querySelectorAll('path').length)
  // ...and the two states must still differ, or the toggle says nothing.
  const inside = (c: HTMLElement) => c.querySelectorAll('path')[2]!.getAttribute('d')
  expect(inside(empty)).not.toBe(inside(filed))
})

test('the refresh icon keeps both of its arrows', () => {
  const { container } = render(<RefreshIcon />)
  const paths = [...container.querySelectorAll('path')]
  // Two arcs and two heads, not one circular arrow: a single arrow curving
  // back on itself is the undo drawing, and only the closed pair reads as
  // "again". Stripping one to tidy the icon changes what it means.
  expect(paths.filter((p) => /[aA]/.test(p.getAttribute('d') ?? ''))).toHaveLength(2)
  expect(paths.length).toBeGreaterThanOrEqual(4)
})

test('send is a plane, not the search magnifier or an arrow', () => {
  const { container: send } = render(<SendIcon />)
  const { container: search } = render(<SearchIcon />)
  // The plane is closed geometry (it encloses a shape); the magnifier is a
  // circle plus a stroke. Sharing a drawing would make the chat composer's two
  // controls indistinguishable, and they sit a few pixels apart.
  expect(send.querySelectorAll('path').length).toBe(2)
  expect(send.querySelector('circle')).toBeNull()
  expect(search.querySelector('circle')).not.toBeNull()
})

test('the back arrow is a full arrow, not a chevron', () => {
  const { container: back } = render(<ArrowLeftIcon />)
  const { container: chevron } = render(<ChevronDownIcon />)
  // A chevron is a disclosure or a step within a list; this link leaves the
  // page. The shaft is what carries that difference.
  expect(back.querySelectorAll('path')).toHaveLength(2)
  expect(chevron.querySelectorAll('path')).toHaveLength(1)
})

test('play is one closed triangle, not the send plane or a chevron', () => {
  const { container: play } = render(<PlayIcon />)
  const { container: send } = render(<SendIcon />)
  const { container: chevron } = render(<ChevronDownIcon />)
  const paths = [...play.querySelectorAll('path')]
  // One closed shape: the triangle only reads as "play" when it is filled-in
  // geometry rather than two open strokes meeting at a point.
  expect(paths).toHaveLength(1)
  expect(paths[0]!.getAttribute('d')).toMatch(/z$/i)
  // Both of its neighbours in a media toolbar point the same way, so the
  // drawings have to differ: the plane is two paths, the chevron is open.
  expect(paths[0]!.getAttribute('d')).not.toBe(send.querySelector('path')!.getAttribute('d'))
  expect(paths[0]!.getAttribute('d')).not.toBe(chevron.querySelector('path')!.getAttribute('d'))
})

test('the brain pair is one head in two states', () => {
  const { container: idle } = render(<BrainIcon />)
  const { container: active } = render(<BrainActiveIcon />)
  const outline = (c: HTMLElement) =>
    [...c.querySelectorAll('path')].slice(0, 2).map((p) => p.getAttribute('d'))
  // "Reasoning on/off" is a toggle carrying no text of its own, so — like the
  // report pair — the head has to stay put while only what is inside changes.
  // A silhouette that shifted would read as a different icon, not a state.
  expect(outline(idle)).toEqual(outline(active))
  // The active state adds a spark inside the head; the idle one shows none.
  expect(active.querySelectorAll('path').length).toBeGreaterThan(
    idle.querySelectorAll('path').length,
  )
})
