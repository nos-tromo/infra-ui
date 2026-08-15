import { render, screen, fireEvent } from '@testing-library/react'
import { AppHeader } from './AppHeader'
import * as themeModule from '../theme/useTheme'

const resetStore = themeModule.__resetStoreForTesting

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  resetStore()
})

test('renders home link, title, and user', () => {
  render(<AppHeader title="docint" user="jane.doe" />)
  const home = screen.getByRole('link', { name: /apps/i })
  expect(home).toHaveAttribute('href', '/')
  expect(screen.getByText('docint')).toBeInTheDocument()
  expect(screen.getByText('jane.doe')).toBeInTheDocument()
})

test('hides the user block when user is absent', () => {
  render(<AppHeader title="docint" />)
  expect(screen.queryByTestId('appheader-user')).not.toBeInTheDocument()
})

test('theme toggle cycles and reflects the mode in its accessible name', () => {
  render(<AppHeader title="docint" />)
  const btn = screen.getByRole('button', { name: /system/i })
  fireEvent.click(btn)
  expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument()
  expect(document.documentElement.dataset.theme).toBe('light')
})

test('theme toggle draws its icon as an inline SVG, one per mode', () => {
  render(<AppHeader title="docint" />)
  const btn = screen.getByRole('button', { name: /system/i })
  const iconOf = () => {
    const svg = btn.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    return svg!.innerHTML
  }
  const system = iconOf()
  fireEvent.click(btn) // -> light
  const light = iconOf()
  fireEvent.click(btn) // -> dark
  const dark = iconOf()
  expect(new Set([system, light, dark]).size).toBe(3)
})

test('honors homeHref, homeLabel, and themeLabels overrides', () => {
  render(
    <AppHeader
      title="t"
      homeHref="/portal/"
      homeLabel="Übersicht"
      themeLabels={{ system: 'System', light: 'Hell', dark: 'Dunkel' }}
    />,
  )
  expect(screen.getByRole('link', { name: 'Übersicht' })).toHaveAttribute('href', '/portal/')
  expect(screen.getByRole('button', { name: /System/ })).toBeInTheDocument()
})

test('renders version when provided', () => {
  render(<AppHeader title="chorus" version="v1.2.3" />)
  expect(screen.getByTestId('appheader-version')).toBeInTheDocument()
  expect(screen.getByText('v1.2.3')).toBeInTheDocument()
})

test('omits version element when absent', () => {
  render(<AppHeader title="chorus" />)
  expect(screen.queryByTestId('appheader-version')).not.toBeInTheDocument()
})

test('the back link draws its arrow', () => {
  render(<AppHeader title="docint" homeLabel="Übersicht" />)
  const link = screen.getByRole('link', { name: 'Übersicht' })
  const svg = link.querySelector('svg')
  // Was a typed `←`. The accessible name must stay the label alone — an arrow
  // that reached the accessibility tree would read as part of the destination.
  expect(svg).not.toBeNull()
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  expect(link.textContent).toBe('Übersicht')
})
