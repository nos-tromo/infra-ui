import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DisclosureText } from './DisclosureText'

function Steps() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <DisclosureText expanded={open} controls="steps" onClick={() => setOpen((value) => !value)}>
        2 steps
      </DisclosureText>
      {open && <ul id="steps" />}
    </div>
  )
}

test('the words are the button and its name, with no chevron', () => {
  const { container } = render(<Steps />)
  const button = screen.getByRole('button', { name: '2 steps' })
  expect(button).toHaveAttribute('type', 'button')
  expect(button).toHaveAttribute('aria-controls', 'steps')
  expect(container.querySelector('svg')).toBeNull()
})

test('opens and closes from the pointer and the keyboard', async () => {
  const user = userEvent.setup()
  const { container } = render(<Steps />)
  const button = screen.getByRole('button', { name: '2 steps' })
  expect(button).toHaveAttribute('aria-expanded', 'false')

  await user.click(button)
  expect(button).toHaveAttribute('aria-expanded', 'true')
  expect(container.querySelector('#steps')).not.toBeNull()

  await user.keyboard('{Enter}')
  expect(button).toHaveAttribute('aria-expanded', 'false')
  await user.keyboard(' ')
  expect(button).toHaveAttribute('aria-expanded', 'true')
})

test('takes the surrounding colour and brightens on hover', () => {
  render(
    <DisclosureText expanded={false} className="ml-2">
      Ran Python
    </DisclosureText>,
  )
  const button = screen.getByRole('button', { name: 'Ran Python' })
  expect(button).toHaveClass('hover:text-foreground', 'focus-visible:ring-2', 'ml-2')
  expect(button.className).not.toMatch(/(^|\s)text-(muted-)?foreground(\s|$)/)
})
