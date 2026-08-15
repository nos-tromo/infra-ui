import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { SelectMenu } from './SelectMenu'

const OPTIONS = [
  { value: '1', label: 'Case Alpha (2)' },
  { value: '2', label: 'Case Beta (0)' },
  { value: '3', label: 'Case Gamma (7)' },
]

function setup(props: Partial<ComponentProps<typeof SelectMenu>> = {}) {
  const onChange = vi.fn()
  const user = userEvent.setup()
  const utils = render(
    <SelectMenu
      label="Select report"
      options={OPTIONS}
      value="1"
      onChange={onChange}
      placeholder="Choose a report…"
      {...props}
    />,
  )
  return {
    user,
    onChange,
    trigger: screen.getByRole('combobox', { name: 'Select report' }),
    ...utils,
  }
}

const activeLabel = () => document.querySelector('[data-active="true"]')?.textContent

test('shows the current choice on a closed trigger and mounts no panel', () => {
  const { trigger } = setup()
  expect(trigger).toHaveTextContent('Case Alpha (2)')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  // Unmounted, not merely hidden: a hidden-but-mounted panel puts every option
  // into `getByText` for a closed control, which is exactly the coupling that
  // made the native <select> this replaces awkward to test around.
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('falls back to the placeholder for a null or unmatched value', () => {
  const { rerender } = setup({ value: null })
  expect(screen.getByRole('combobox')).toHaveTextContent('Choose a report…')
  rerender(
    <SelectMenu
      label="Select report"
      options={OPTIONS}
      value="99"
      onChange={vi.fn()}
      placeholder="Choose a report…"
    />,
  )
  expect(screen.getByRole('combobox')).toHaveTextContent('Choose a report…')
})

test('an empty list names itself on the trigger and opens nothing', async () => {
  const { user, trigger } = setup({ options: [], value: null, emptyLabel: 'No reports yet.' })
  expect(trigger).toHaveTextContent('No reports yet.')
  expect(trigger).toHaveAttribute('aria-disabled', 'true')
  // No list, so no caret: the drawing is the affordance and there is nothing
  // here to afford.
  expect(trigger.querySelector('svg')).toBeNull()
  await user.click(trigger)
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('opens on click and marks the current value selected', async () => {
  const { user, trigger } = setup()
  await user.click(trigger)
  expect(screen.getByRole('listbox', { name: 'Select report' })).toBeInTheDocument()
  expect(screen.getAllByRole('option')).toHaveLength(3)
  expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Case Alpha (2)')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
})

test('ArrowDown opens and points aria-activedescendant at the current value', () => {
  const { trigger } = setup({ value: '2' })
  trigger.focus()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  expect(trigger.getAttribute('aria-activedescendant')).toBe(
    screen.getByRole('option', { selected: true }).id,
  )
})

test('ArrowUp opens from the bottom when nothing is chosen', () => {
  const { trigger } = setup({ value: null })
  trigger.focus()
  fireEvent.keyDown(trigger, { key: 'ArrowUp' })
  expect(activeLabel()).toBe('Case Gamma (7)')
})

test('the arrows clamp at the ends rather than wrapping', () => {
  const { trigger } = setup({ value: '1' })
  trigger.focus()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  for (let i = 0; i < 5; i++) fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  expect(activeLabel()).toBe('Case Gamma (7)')
  for (let i = 0; i < 5; i++) fireEvent.keyDown(trigger, { key: 'ArrowUp' })
  expect(activeLabel()).toBe('Case Alpha (2)')
})

test('Home and End jump to the ends', () => {
  const { trigger } = setup()
  trigger.focus()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  fireEvent.keyDown(trigger, { key: 'End' })
  expect(activeLabel()).toBe('Case Gamma (7)')
  fireEvent.keyDown(trigger, { key: 'Home' })
  expect(activeLabel()).toBe('Case Alpha (2)')
})

test('Enter commits the value, not the label', () => {
  const { trigger, onChange } = setup()
  trigger.focus()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  fireEvent.keyDown(trigger, { key: 'Enter' })
  expect(onChange).toHaveBeenCalledTimes(1)
  expect(onChange).toHaveBeenCalledWith('2')
  expect(onChange).not.toHaveBeenCalledWith('Case Beta (0)')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('Space commits too, and never reaches the page as a scroll', () => {
  const { trigger, onChange } = setup()
  trigger.focus()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  const notPrevented = fireEvent.keyDown(trigger, { key: ' ' })
  expect(notPrevented).toBe(false)
  expect(onChange).toHaveBeenCalledWith('2')
})

test('clicking an option commits it, closes, and leaves focus on the trigger', async () => {
  const { user, trigger, onChange } = setup()
  await user.click(trigger)
  await user.click(screen.getByRole('option', { name: 'Case Beta (0)' }))
  expect(onChange).toHaveBeenCalledWith('2')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  // Guards the row's `onMouseDown` preventDefault: without it the pointer blurs
  // the trigger, and `aria-activedescendant` only means anything while the
  // combobox holds focus.
  expect(trigger).toHaveFocus()
})

test('Escape closes without committing and leaves focus on the trigger', async () => {
  const { user, trigger, onChange } = setup()
  await user.click(trigger)
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(onChange).not.toHaveBeenCalled()
  expect(trigger).toHaveFocus()
})

test('Escape does not travel past the menu', async () => {
  const onAncestorKey = vi.fn()
  const user = userEvent.setup()
  render(
    <div onKeyDown={onAncestorKey}>
      <SelectMenu label="Select report" options={OPTIONS} value="1" onChange={vi.fn()} />
    </div>,
  )
  await user.click(screen.getByRole('combobox'))
  await user.keyboard('{Escape}')
  // One press dismisses one layer — not this menu plus the dialog holding it.
  expect(onAncestorKey).not.toHaveBeenCalled()
})

test('Tab closes the menu and lets focus move on', async () => {
  const user = userEvent.setup()
  render(
    <>
      <SelectMenu label="Select report" options={OPTIONS} value="1" onChange={vi.fn()} />
      <button type="button">New</button>
    </>,
  )
  await user.click(screen.getByRole('combobox'))
  await user.tab()
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'New' })).toHaveFocus()
})

test('an outside mousedown closes without committing', async () => {
  const onChange = vi.fn()
  const user = userEvent.setup()
  render(
    <div>
      <span>elsewhere</span>
      <SelectMenu label="Select report" options={OPTIONS} value="1" onChange={onChange} />
    </div>,
  )
  await user.click(screen.getByRole('combobox'))
  await user.click(screen.getByText('elsewhere'))
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(onChange).not.toHaveBeenCalled()
})

test('the outside-click listener is removed when the open menu unmounts', async () => {
  const add = vi.spyOn(document, 'addEventListener')
  const remove = vi.spyOn(document, 'removeEventListener')
  const user = userEvent.setup()
  const { unmount } = render(
    <SelectMenu label="Select report" options={OPTIONS} value="1" onChange={vi.fn()} />,
  )
  await user.click(screen.getByRole('combobox'))
  const added = add.mock.calls.find(([type]) => type === 'mousedown')
  expect(added).toBeTruthy()
  unmount()
  // The same *reference*, not merely the same type: an inline arrow in the
  // cleanup leaks a listener on every open, which stays invisible until an app
  // mounting this in a list starts accumulating them.
  expect(remove).toHaveBeenCalledWith('mousedown', added![1])
})

test('a disabled option is announced, skipped by the arrows and not committable', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(
    <SelectMenu
      label="Select report"
      value="1"
      onChange={onChange}
      options={[OPTIONS[0], { ...OPTIONS[1], disabled: true }, OPTIONS[2]]}
    />,
  )
  const trigger = screen.getByRole('combobox')
  await user.click(trigger)
  expect(screen.getByRole('option', { name: 'Case Beta (0)' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  expect(activeLabel()).toBe('Case Gamma (7)')
  await user.click(screen.getByRole('option', { name: 'Case Beta (0)' }))
  expect(onChange).not.toHaveBeenCalled()
  expect(screen.getByRole('listbox')).toBeInTheDocument()
})

test('reopening starts from the current value, not where the arrows were left', async () => {
  const { user, trigger } = setup({ value: '1' })
  await user.click(trigger)
  fireEvent.keyDown(trigger, { key: 'End' })
  expect(activeLabel()).toBe('Case Gamma (7)')
  await user.keyboard('{Escape}')
  await user.click(trigger)
  expect(activeLabel()).toBe('Case Alpha (2)')
})

test('the panel stays text-sm however large the trigger is', async () => {
  const { user, trigger } = setup({ triggerClassName: 'text-2xl font-semibold' })
  await user.click(trigger)
  const listbox = screen.getByRole('listbox')
  expect(trigger).toHaveClass('text-2xl')
  expect(listbox).toHaveClass('text-sm')
  expect(listbox).not.toHaveClass('text-2xl')
  // The whole reason this primitive exists: a native <select>'s popup is a
  // child of the control and inherits its font size, so a title-sized select
  // opened a title-sized list over the header. This panel is a sibling.
  expect(trigger.contains(listbox)).toBe(false)
  for (const option of screen.getAllByRole('option')) expect(option).toHaveClass('text-sm')
})

test('the caret is drawn, not typed', () => {
  const { trigger } = setup()
  const svg = trigger.querySelector('svg')
  expect(svg).not.toBeNull()
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  expect(trigger.textContent).toBe('Case Alpha (2)')
})

test('scrolls the active option into view', async () => {
  // happy-dom leaves scrollIntoView undefined, so give it something to spy on:
  // the point of the test is that the component asks, not that a layout moves.
  Element.prototype.scrollIntoView ??= () => {}
  const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
  const { user, trigger } = setup()
  await user.click(trigger)
  fireEvent.keyDown(trigger, { key: 'End' })
  // `aria-activedescendant` moves no real focus, so the browser scrolls nothing
  // on its own. Drop this call and keyboard navigation silently walks off the
  // bottom of a long list.
  expect(scroll).toHaveBeenCalledWith({ block: 'nearest' })
  scroll.mockRestore()
})

test('align pins the panel to the requested edge', async () => {
  const { user, trigger } = setup({ align: 'end' })
  await user.click(trigger)
  expect(screen.getByRole('listbox')).toHaveClass('right-0')
})
