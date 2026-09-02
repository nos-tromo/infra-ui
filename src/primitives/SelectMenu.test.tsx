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

const GROUPED = [
  { value: 'own:alpha', label: 'alpha' },
  { value: 'own:beta', label: 'beta' },
  { value: 'alice:gamma', label: 'gamma', group: 'alice' },
  { value: 'alice:delta', label: 'delta', group: 'alice' },
  { value: 'bob:epsilon', label: 'epsilon', group: 'bob' },
]

/** Longer than the component's own reset window. */
const TYPEAHEAD_PAUSE_MS = 600

const CATALOG = [
  { value: 'ue', label: 'Übergabe' },
  { value: 'c1', label: 'Case Alpha' },
  { value: 'c2', label: 'Case Beta' },
  { value: 'c3', label: 'Case Gamma' },
  { value: 'd', label: 'Dossier', disabled: true },
]

function openGrouped(props: Partial<ComponentProps<typeof SelectMenu>> = {}) {
  render(
    <SelectMenu
      label="Select collection"
      options={GROUPED}
      value="own:alpha"
      onChange={vi.fn()}
      {...props}
    />,
  )
  const trigger = screen.getByRole('combobox')
  trigger.focus()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  return trigger
}

test('options carrying a group sit under a header naming it', () => {
  openGrouped()
  const groups = screen.getAllByRole('group')
  expect(groups).toHaveLength(2)
  expect(groups[0]).toHaveAccessibleName('alice')
  expect(groups[1]).toHaveAccessibleName('bob')
  // The headers are furniture, not choices: an owner is not a collection.
  expect(screen.getAllByRole('option')).toHaveLength(GROUPED.length)
  expect(screen.queryByRole('option', { name: 'alice' })).not.toBeInTheDocument()
  // Ungrouped options stay at the top level, outside every group.
  expect(groups[0].contains(screen.getByRole('option', { name: 'alpha' }))).toBe(false)
  expect(groups[0].contains(screen.getByRole('option', { name: 'gamma' }))).toBe(true)
})

test('the arrows step over the group headers', () => {
  const trigger = openGrouped()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  expect(activeLabel()).toBe('beta')
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  // Straight from the last ungrouped option into the first grouped one: the
  // headers are not in `options`, so nothing has to know to skip them.
  expect(activeLabel()).toBe('gamma')
  fireEvent.keyDown(trigger, { key: 'End' })
  expect(activeLabel()).toBe('epsilon')
})

test('pressing on a group header changes nothing', () => {
  const trigger = openGrouped()
  const header = screen.getAllByRole('group')[0].firstElementChild!
  const prevented = !fireEvent.mouseDown(header)
  // Same guard the option rows carry: a mousedown that blurs the trigger takes
  // `aria-activedescendant` down with it.
  expect(prevented).toBe(true)
  expect(trigger).toHaveFocus()
  expect(screen.getByRole('listbox')).toBeInTheDocument()
})

test('an empty group string is no group at all', () => {
  render(
    <SelectMenu
      label="Select collection"
      options={[{ value: 'a', label: 'alpha', group: '' }]}
      value="a"
      onChange={vi.fn()}
    />,
  )
  fireEvent.click(screen.getByRole('combobox'))
  expect(screen.queryByRole('group')).not.toBeInTheDocument()
})

function typeAhead(props: Partial<ComponentProps<typeof SelectMenu>> = {}) {
  const onChange = vi.fn()
  render(
    <SelectMenu
      label="Select case"
      options={CATALOG}
      value={null}
      onChange={onChange}
      {...props}
    />,
  )
  const trigger = screen.getByRole('combobox')
  trigger.focus()
  return { trigger, onChange }
}

/** Types `text` into the trigger one printable key at a time. */
function typeKeys(trigger: HTMLElement, text: string) {
  for (const key of text) fireEvent.keyDown(trigger, { key })
}

test('a letter jumps to the first option starting with it', () => {
  const { trigger } = typeAhead()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  typeKeys(trigger, 'c')
  expect(activeLabel()).toBe('Case Alpha')
})

test('more letters narrow the search rather than restarting it', () => {
  const { trigger } = typeAhead()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  typeKeys(trigger, 'case b')
  // The space is a character here, not a commit: a catalog full of two-word
  // names is unusable if the first space chooses whatever is highlighted.
  expect(activeLabel()).toBe('Case Beta')
  expect(screen.getByRole('listbox')).toBeInTheDocument()
})

test('the same letter again steps to the next match and wraps', () => {
  const { trigger } = typeAhead()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  typeKeys(trigger, 'c')
  expect(activeLabel()).toBe('Case Alpha')
  typeKeys(trigger, 'c')
  expect(activeLabel()).toBe('Case Beta')
  typeKeys(trigger, 'c')
  expect(activeLabel()).toBe('Case Gamma')
  // Search wraps where the arrows clamp: repeating a letter is a request for
  // "the next one", and there is nowhere else for the last one to go.
  typeKeys(trigger, 'c')
  expect(activeLabel()).toBe('Case Alpha')
})

test('the search folds case and diacritics', () => {
  const { trigger } = typeAhead()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  // Off the first row first, so reaching it again is the search doing work.
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  expect(activeLabel()).toBe('Case Alpha')
  typeKeys(trigger, 'ü')
  expect(activeLabel()).toBe('Übergabe')
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  expect(activeLabel()).toBe('Case Alpha')
  // A German catalog is the case this has to survive: an operator typing `u`
  // on a keyboard they are not thinking about must still reach `Übergabe`.
  typeKeys(trigger, 'u')
  expect(activeLabel()).toBe('Übergabe')
})

test('the buffer forgets between words', () => {
  const { trigger } = typeAhead()
  vi.useFakeTimers()
  try {
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    typeKeys(trigger, 'c')
    expect(activeLabel()).toBe('Case Alpha')
    vi.advanceTimersByTime(TYPEAHEAD_PAUSE_MS)
    // A pause ends the word. Carried over, this would search 'cü' and match
    // nothing, leaving the highlight where it was.
    typeKeys(trigger, 'ü')
    expect(activeLabel()).toBe('Übergabe')
  } finally {
    vi.useRealTimers()
  }
})

test('a pause is what ends a word, not each keystroke', () => {
  const { trigger } = typeAhead()
  vi.useFakeTimers()
  try {
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(activeLabel()).toBe('Case Alpha')
    // 'd' matches nothing choosable, and 'ü' arriving straight after belongs to
    // that same failed word: 'dü' is not a match either, so nothing moves. A
    // buffer cleared per keystroke would read the 'ü' alone and jump.
    typeKeys(trigger, 'dü')
    expect(activeLabel()).toBe('Case Alpha')
  } finally {
    vi.useRealTimers()
  }
})

test('the search skips what cannot be chosen', () => {
  const { trigger } = typeAhead()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  expect(activeLabel()).toBe('Case Alpha')
  typeKeys(trigger, 'd')
  // 'Dossier' is the only match and it is disabled, so the search finds
  // nothing and the highlight holds where the user left it.
  expect(activeLabel()).toBe('Case Alpha')
})

test('typing on a closed picker chooses without opening it', () => {
  const { trigger, onChange } = typeAhead()
  typeKeys(trigger, 'c')
  // What a native <select> does, and what `variant="field"` sits in a form
  // promising: the value changes under the keystroke, no popup involved.
  expect(onChange).toHaveBeenCalledWith('c1')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('a shortcut is not a search', () => {
  const { trigger } = typeAhead()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  fireEvent.keyDown(trigger, { key: 'ü', ctrlKey: true })
  expect(activeLabel()).toBe('Case Alpha')
})

test('Escape clears the buffer as well as the panel', () => {
  const { trigger } = typeAhead()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  typeKeys(trigger, 'c')
  expect(activeLabel()).toBe('Case Alpha')
  fireEvent.keyDown(trigger, { key: 'Escape' })
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  typeKeys(trigger, 'c')
  // A surviving buffer would read this second 'c' as "the next one" and land
  // on Case Beta.
  expect(activeLabel()).toBe('Case Alpha')
})

test('the field variant wears the same box as an Input', async () => {
  const { user, trigger } = setup({ variant: 'field' })
  expect(trigger).toHaveClass('h-10', 'w-full', 'border', 'border-border', 'bg-background', 'px-3')
  expect(trigger).not.toHaveClass('bg-transparent')
  await user.click(trigger)
  // A native popup is at least as wide as its control; a form picker that
  // opens narrower than the field it belongs to reads as a different control.
  expect(screen.getByRole('listbox')).toHaveClass('min-w-full')
})

test('the inline variant stays the bare trigger it was', () => {
  const { trigger } = setup()
  expect(trigger).toHaveClass('bg-transparent')
  expect(trigger).not.toHaveClass('h-10')
  expect(trigger).not.toHaveClass('border')
})

test('the caret is sized by the variant that owns the text size', () => {
  const { trigger, rerender } = setup()
  // Inline: the caller owns the font size, so the caret tracks it.
  expect(trigger.querySelector('svg')).toHaveClass('h-[0.8em]')
  rerender(
    <SelectMenu
      label="Select report"
      options={OPTIONS}
      value="1"
      onChange={vi.fn()}
      variant="field"
    />,
  )
  // Field: the variant fixes `text-sm`, and 0.8em of that is a smudge beside a
  // 40px-tall box.
  expect(screen.getByRole('combobox').querySelector('svg')).toHaveClass('h-4', 'w-4')
})

test('the field variant pushes its caret to the far edge', () => {
  const { trigger } = setup({ variant: 'field' })
  expect(trigger.querySelector('span')).toHaveClass('flex-1')
  const { container } = render(
    <SelectMenu label="Inline" options={OPTIONS} value="1" onChange={vi.fn()} />,
  )
  expect(container.querySelector('button span')).not.toHaveClass('flex-1')
})

test('triggerClassName still wins over the variant', () => {
  const { trigger } = setup({ variant: 'field', triggerClassName: 'h-8' })
  expect(trigger).toHaveClass('h-8')
  expect(trigger).not.toHaveClass('h-10')
})
