import { render, screen, fireEvent } from '@testing-library/react'
import { UserMenu } from './UserMenu'

test('renders a closed menu button with the user name', () => {
  render(<UserMenu user="jane.doe" />)
  const btn = screen.getByRole('button', { name: /jane\.doe/ })
  expect(btn).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('opens on click and shows the sign-out item', () => {
  render(<UserMenu user="jane.doe" />)
  fireEvent.click(screen.getByRole('button', { name: /jane\.doe/ }))
  const item = screen.getByRole('menuitem', { name: 'Sign out' })
  expect(item).toHaveAttribute('href', '/auth/logout')
})

test('honors signOutHref and signOutLabel overrides', () => {
  render(<UserMenu user="j" signOutHref="/logout" signOutLabel="Abmelden" />)
  fireEvent.click(screen.getByRole('button', { name: /j/ }))
  expect(screen.getByRole('menuitem', { name: 'Abmelden' })).toHaveAttribute('href', '/logout')
})

test('closes on Escape and on outside click', () => {
  render(
    <div>
      <span>outside</span>
      <UserMenu user="jane.doe" />
    </div>,
  )
  const btn = screen.getByRole('button', { name: /jane\.doe/ })
  fireEvent.click(btn)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  fireEvent.click(btn)
  fireEvent.mouseDown(screen.getByText('outside'))
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})
