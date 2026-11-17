import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChatComposer } from './ChatComposer'

test('is a one-line textarea that takes every textarea prop', () => {
  let typed = ''
  render(
    <ChatComposer
      aria-label="Write a message"
      placeholder="Write a message"
      value=""
      onChange={(event) => {
        typed = event.target.value
      }}
    />,
  )
  const box = screen.getByRole('textbox', { name: 'Write a message' })
  expect(box.tagName).toBe('TEXTAREA')
  expect(box).toHaveAttribute('rows', '1')
  expect(box).toHaveAttribute('placeholder', 'Write a message')
  fireEvent.change(box, { target: { value: 'Hello' } })
  expect(typed).toBe('Hello')
})

test('puts the start actions before the text and the end actions after it', () => {
  render(
    <ChatComposer
      aria-label="Message"
      start={<button type="button">Attach</button>}
      end={<button type="submit">Send</button>}
    />,
  )
  const [attach, text, send] = [
    screen.getByRole('button', { name: 'Attach' }),
    screen.getByRole('textbox', { name: 'Message' }),
    screen.getByRole('button', { name: 'Send' }),
  ]
  expect(attach.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(text.compareDocumentPosition(send) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test('leaves out the action groups it is not given', () => {
  const { container } = render(<ChatComposer aria-label="Message" />)
  const pill = container.firstElementChild
  expect(pill?.children).toHaveLength(1)
  expect(pill?.firstElementChild?.tagName).toBe('TEXTAREA')
})

test('forwards the ref to the textarea and merges both class names', () => {
  const ref = createRef<HTMLTextAreaElement>()
  const { container } = render(
    <ChatComposer ref={ref} aria-label="Message" className="max-h-64" boxClassName="rounded-xl" />,
  )
  expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Message' }))
  expect(ref.current).toHaveClass('max-h-64')
  expect(ref.current).not.toHaveClass('max-h-48')
  const pill = container.firstElementChild
  expect(pill).toHaveClass('rounded-xl', 'focus-within:border-primary')
  expect(pill).not.toHaveClass('rounded-3xl')
})
