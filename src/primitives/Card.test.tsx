import { render, screen } from '@testing-library/react'
import { Card } from './Card'

test('renders children on an opaque tile surface', () => {
  render(<Card>body</Card>)
  expect(screen.getByText('body')).toHaveClass('rounded-lg', 'bg-muted')
})

test('merges a custom className', () => {
  render(<Card className="p-8">x</Card>)
  expect(screen.getByText('x')).toHaveClass('p-8')
})

test('renders an accent title above the body', () => {
  render(<Card title="Documents">1,284</Card>)
  const heading = screen.getByText('Documents')
  expect(heading).toHaveClass('text-primary', 'font-semibold')
})

test('interactive cards get the hover-accent border', () => {
  render(<Card interactive>x</Card>)
  expect(screen.getByText('x')).toHaveClass('hover:border-primary')
})

test('the title is a real heading', () => {
  render(<Card title="Documents">1,284</Card>)
  expect(screen.getByRole('heading', { level: 2, name: 'Documents' })).toBeInTheDocument()
})

test('caption and actions share the title row', () => {
  render(
    <Card title="Extracts" caption="Full transcripts" actions={<button>New extract</button>}>
      body
    </Card>,
  )
  expect(screen.getByText('Full transcripts')).toHaveClass('text-muted-foreground')
  expect(screen.getByRole('button', { name: 'New extract' }).parentElement).toHaveClass('ml-auto')
})

test('actions without a title still get a header row and no heading', () => {
  render(<Card actions={<button>X</button>}>body</Card>)
  expect(screen.getByRole('button', { name: 'X' })).toBeInTheDocument()
  expect(screen.queryByRole('heading')).toBeNull()
})

test('titleLevel and titleId pass through', () => {
  render(
    <Card title="Retention" titleLevel={3} titleId="c1">
      body
    </Card>,
  )
  expect(screen.getByRole('heading', { level: 3, name: 'Retention' })).toHaveAttribute('id', 'c1')
})

test('a plain card renders no header row', () => {
  const { container } = render(<Card>body</Card>)
  expect(container.querySelector('h2, h3')).toBeNull()
  expect(container.querySelector('.ml-auto')).toBeNull()
})

test('an empty slot leaves no header row behind', () => {
  const { container } = render(<Card actions={false}>body</Card>)
  expect(container.querySelector('.mb-4')).toBeNull()
})
