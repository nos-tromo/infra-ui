import { render, screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'

test('renders the title as the page h1', () => {
  render(<PageHeader title="Dashboard" />)
  expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
})

test('exposes no banner role — the AppShell chrome header owns it', () => {
  render(<PageHeader title="Dashboard" />)
  expect(screen.queryByRole('banner')).toBeNull()
})

test('renders a muted caption when given', () => {
  render(<PageHeader title="Dashboard" caption="Corpus overview" />)
  expect(screen.getByText('Corpus overview')).toHaveClass('text-muted-foreground')
})

test('omits the caption node entirely when absent', () => {
  render(<PageHeader title="Dashboard" />)
  expect(screen.queryByTestId('pageheader-caption')).not.toBeInTheDocument()
})

test('renders actions on the title row', () => {
  render(<PageHeader title="Jobs" actions={<button>New</button>} />)
  expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument()
})
