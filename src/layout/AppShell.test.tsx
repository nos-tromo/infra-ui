import { render, screen, fireEvent } from '@testing-library/react'
import { AppShell, SidebarGroup, SIDEBAR_STORAGE_KEY } from './AppShell'
import { __resetStoreForTesting } from '../theme/useTheme'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  __resetStoreForTesting()
})

test('renders header chrome: home link, title, version, theme toggle', () => {
  render(
    <AppShell title="docint" version="v0.9.0">
      body
    </AppShell>,
  )
  expect(screen.getByRole('link', { name: /apps/i })).toHaveAttribute('href', '/')
  expect(screen.getByText('docint')).toBeInTheDocument()
  expect(screen.getByText('v0.9.0')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument()
})

test('renders UserMenu when user is set, nothing when absent', () => {
  const { rerender } = render(<AppShell title="t">x</AppShell>)
  expect(screen.queryByRole('button', { name: /account/i })).not.toBeInTheDocument()
  rerender(
    <AppShell title="t" user="jane.doe">
      x
    </AppShell>,
  )
  expect(screen.getByRole('button', { name: /jane\.doe/ })).toBeInTheDocument()
})

test('children render inside the canvas main landmark', () => {
  render(<AppShell title="t">canvas-content</AppShell>)
  expect(screen.getByRole('main')).toHaveTextContent('canvas-content')
})

test('sidebar renders with a working collapse toggle that persists', () => {
  render(
    <AppShell title="t" sidebar={<nav>side-nav</nav>}>
      x
    </AppShell>,
  )
  expect(screen.getByText('side-nav')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }))
  expect(screen.queryByText('side-nav')).not.toBeInTheDocument()
  expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('1')
})

test('canvas corner treatment persists after sidebar collapse (driven by the sidebar prop, not visibility)', () => {
  render(
    <AppShell title="t" sidebar={<nav>side-nav</nav>}>
      x
    </AppShell>,
  )
  fireEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }))
  expect(screen.queryByText('side-nav')).not.toBeInTheDocument()
  expect(screen.getByRole('main')).toHaveClass('rounded-tl-lg', 'border-l')
})

test('no sidebar toggle for header-only apps', () => {
  render(<AppShell title="t">x</AppShell>)
  expect(screen.queryByRole('button', { name: /toggle sidebar/i })).not.toBeInTheDocument()
})

test('SidebarGroup renders an uppercase section label', () => {
  render(<SidebarGroup label="Entities">items</SidebarGroup>)
  expect(screen.getByText('Entities')).toHaveClass('uppercase')
})
