import { render, screen } from '@testing-library/react'
import { SectionHeader } from './SectionHeader'

test('renders the title as an h2 by default, accent-styled', () => {
  render(<SectionHeader title="Extracts" />)
  expect(screen.getByRole('heading', { level: 2, name: 'Extracts' })).toHaveClass(
    'text-lg',
    'font-semibold',
    'text-primary',
  )
})

test('level 3 renders a smaller h3', () => {
  render(<SectionHeader title="Merge topics" level={3} />)
  const heading = screen.getByRole('heading', { level: 3, name: 'Merge topics' })
  expect(heading).toHaveClass('text-sm', 'font-semibold')
  expect(heading).not.toHaveClass('text-primary')
})

test('puts the actions on the right, even when the row wraps', () => {
  const { container } = render(<SectionHeader title="Jobs" actions={<button>New</button>} />)
  expect(screen.getByRole('button', { name: 'New' }).parentElement).toHaveClass(
    'ml-auto',
    'shrink-0',
  )
  expect(container.firstElementChild).toHaveClass('flex-wrap')
})

test('a caption-only header renders no heading', () => {
  render(<SectionHeader caption="3 files" />)
  expect(screen.queryByRole('heading')).toBeNull()
  expect(screen.getByText('3 files')).toHaveClass('text-muted-foreground')
})

test('titleId lands on the heading', () => {
  render(<SectionHeader title="Retention" titleId="x" />)
  expect(screen.getByRole('heading', { name: 'Retention' })).toHaveAttribute('id', 'x')
})

test('exposes no banner role', () => {
  render(<SectionHeader title="Jobs" actions={<button>New</button>} />)
  expect(screen.queryByRole('banner')).toBeNull()
})

test('omits the actions slot when none are given', () => {
  const { container } = render(<SectionHeader title="Jobs" />)
  expect(container.querySelector('.ml-auto')).toBeNull()
})

test('a slot given false renders nothing, so `cond && <X/>` is safe', () => {
  const { container } = render(<SectionHeader title="Files" actions={false} />)
  expect(container.querySelector('.ml-auto')).toBeNull()
})

test('renders nothing when every slot is empty', () => {
  const { container } = render(<SectionHeader actions={false} />)
  expect(container.firstChild).toBeNull()
})
