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
