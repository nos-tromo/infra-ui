import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Menu, MenuItem } from './Menu'
import { Button } from './Button'
import { DownloadButton } from './iconActions'

function setup(props: Partial<React.ComponentProps<typeof Menu>> = {}) {
  const onSelect = vi.fn()
  const user = userEvent.setup()
  const utils = render(
    <Menu trigger={(p) => <DownloadButton {...p} label="Export" />} {...props}>
      <MenuItem onSelect={onSelect}>Combined JSONL</MenuItem>
      <MenuItem onSelect={onSelect}>Full batch ZIP</MenuItem>
      <MenuItem disabled hint="Nothing to export yet" onSelect={onSelect}>
        Retired format
      </MenuItem>
    </Menu>,
  )
  return { user, onSelect, trigger: screen.getByRole('button', { name: 'Export' }), ...utils }
}

const items = () => screen.getAllByRole('menuitem')

test('a closed menu announces itself and mounts no panel', () => {
  const { trigger } = setup()
  expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).not.toHaveAttribute('aria-controls')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('clicking opens the panel, names it after the trigger, and focuses the first item', async () => {
  const { user, trigger } = setup()
  await user.click(trigger)
  const panel = screen.getByRole('menu', { name: 'Export' })
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(trigger.getAttribute('aria-controls')).toBe(panel.id)
  expect(panel).toHaveAttribute('aria-labelledby', trigger.id)
  // A mouse-open focuses the first item too: on macOS Safari and Firefox the
  // trigger never takes focus from a click, so without this every arrow key
  // below is dead after opening with the pointer.
  expect(items()[0]).toHaveFocus()
})

test('ArrowDown opens at the first item and ArrowUp at the last', () => {
  const { trigger } = setup()
  trigger.focus()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  expect(items()[0]).toHaveFocus()
  fireEvent.keyDown(document.activeElement!, { key: 'Escape' })

  fireEvent.keyDown(trigger, { key: 'ArrowUp' })
  // The third item is disabled, so "last" means the last *choosable* one.
  expect(screen.getByRole('menuitem', { name: 'Full batch ZIP' })).toHaveFocus()
})

test('Enter and Space open once, without the synthesized click closing it again', async () => {
  const { trigger } = setup()
  trigger.focus()
  const enterNotPrevented = fireEvent.keyDown(trigger, { key: 'Enter' })
  expect(enterNotPrevented).toBe(false)
  expect(screen.getByRole('menu')).toBeInTheDocument()
  fireEvent.keyDown(document.activeElement!, { key: 'Escape' })

  const spaceNotPrevented = fireEvent.keyDown(trigger, { key: ' ' })
  expect(spaceNotPrevented).toBe(false)
  expect(screen.getByRole('menu')).toBeInTheDocument()
})

test('the arrows move focus and clamp at the ends', async () => {
  const { user, trigger } = setup()
  await user.click(trigger)
  const [first, second] = items()
  fireEvent.keyDown(first, { key: 'ArrowDown' })
  expect(second).toHaveFocus()
  for (let i = 0; i < 4; i++) fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
  expect(second).toHaveFocus()
  for (let i = 0; i < 4; i++) fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
  expect(first).toHaveFocus()
})

test('Home and End jump to the ends', async () => {
  const { user, trigger } = setup()
  await user.click(trigger)
  fireEvent.keyDown(document.activeElement!, { key: 'End' })
  expect(screen.getByRole('menuitem', { name: 'Full batch ZIP' })).toHaveFocus()
  fireEvent.keyDown(document.activeElement!, { key: 'Home' })
  expect(screen.getByRole('menuitem', { name: 'Combined JSONL' })).toHaveFocus()
})

test('a disabled item is announced, skipped, inert, and keeps its hint', async () => {
  const { user, trigger, onSelect } = setup()
  await user.click(trigger)
  const retired = screen.getByRole('menuitem', { name: 'Retired format' })
  expect(retired).toHaveAttribute('aria-disabled', 'true')
  // `aria-disabled`, not `disabled`: a disabled button shows no tooltip, and
  // the reason it is unavailable is the one thing the row still has to say.
  expect(retired).toHaveAttribute('title', 'Nothing to export yet')
  fireEvent.keyDown(document.activeElement!, { key: 'End' })
  expect(retired).not.toHaveFocus()
  await user.click(retired)
  expect(onSelect).not.toHaveBeenCalled()
  expect(screen.getByRole('menu')).toBeInTheDocument()
})

test('choosing an item runs it once, closes, and puts focus back on the trigger', async () => {
  const { user, trigger, onSelect } = setup()
  await user.click(trigger)
  await user.click(screen.getByRole('menuitem', { name: 'Full batch ZIP' }))
  expect(onSelect).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  // Real focus lives on the items here, so every close path owes the trigger
  // its focus back — otherwise the next Tab starts from the top of the page.
  expect(trigger).toHaveFocus()
})

test('Enter on a focused item chooses it', async () => {
  const { user, trigger, onSelect } = setup()
  await user.click(trigger)
  await user.keyboard('{Enter}')
  expect(onSelect).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('a link item is a real anchor and is not swallowed by the menu', async () => {
  const user = userEvent.setup()
  render(
    <Menu trigger={(p) => <DownloadButton {...p} label="Export" />}>
      <MenuItem href="/reports/1.csv" download>
        CSV
      </MenuItem>
      <MenuItem href="/reports/1.html" target="_blank" rel="noreferrer">
        HTML
      </MenuItem>
    </Menu>,
  )
  await user.click(screen.getByRole('button', { name: 'Export' }))
  const csv = screen.getByRole('menuitem', { name: 'CSV' })
  expect(csv.tagName).toBe('A')
  expect(csv).toHaveAttribute('href', '/reports/1.csv')
  expect(csv).toHaveAttribute('download')
  const html = screen.getByRole('menuitem', { name: 'HTML' })
  expect(html).toHaveAttribute('target', '_blank')
  expect(html).toHaveAttribute('rel', 'noreferrer')
  // Not prevented: the browser's own download and popup handling is the whole
  // reason these stay anchors instead of buttons calling location.assign.
  expect(fireEvent.click(csv)).toBe(true)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('closeOnSelect={false} leaves the panel open', async () => {
  const onSelect = vi.fn()
  const user = userEvent.setup()
  render(
    <Menu trigger={(p) => <DownloadButton {...p} label="Clear" />}>
      <MenuItem closeOnSelect={false} onSelect={onSelect}>
        Clear finished
      </MenuItem>
    </Menu>,
  )
  await user.click(screen.getByRole('button', { name: 'Clear' }))
  await user.click(screen.getByRole('menuitem', { name: 'Clear finished' }))
  expect(onSelect).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('menu')).toBeInTheDocument()
})

test('Escape closes, restores focus, and does not travel past the menu', async () => {
  const onAncestorKey = vi.fn()
  const user = userEvent.setup()
  render(
    <div onKeyDown={onAncestorKey}>
      <Menu trigger={(p) => <DownloadButton {...p} label="Export" />}>
        <MenuItem onSelect={vi.fn()}>Combined JSONL</MenuItem>
      </Menu>
    </div>,
  )
  const trigger = screen.getByRole('button', { name: 'Export' })
  await user.click(trigger)
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
  // One press dismisses one layer — not this menu plus the dialog holding it.
  expect(onAncestorKey).not.toHaveBeenCalled()
})

test('Tab closes the menu and leaves the browser somewhere to continue from', async () => {
  const user = userEvent.setup()
  render(
    <>
      <Menu trigger={(p) => <DownloadButton {...p} label="Export" />}>
        <MenuItem onSelect={vi.fn()}>Combined JSONL</MenuItem>
      </Menu>
      <button type="button">New</button>
    </>,
  )
  const trigger = screen.getByRole('button', { name: 'Export' })
  await user.click(trigger)
  // `fireEvent`, not `user.tab()`: user-event resolves Tab against the event
  // target *after* the handler has run, and by then the row is detached, so it
  // lands on <body> whatever the component does. The contract worth pinning is
  // this component's half of it.
  const notPrevented = fireEvent.keyDown(screen.getByRole('menuitem'), { key: 'Tab' })
  expect(notPrevented).toBe(true)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  // The row Tab is leaving is about to unmount, so focus goes back to the
  // trigger first and the browser's own Tab carries on from there. Without it
  // focus is stranded on a detached node and the next Tab restarts the page.
  expect(trigger).toHaveFocus()
})

test('an outside mousedown closes without stealing focus back', async () => {
  const user = userEvent.setup()
  render(
    <div>
      <button type="button">elsewhere</button>
      <Menu trigger={(p) => <DownloadButton {...p} label="Export" />}>
        <MenuItem onSelect={vi.fn()}>Combined JSONL</MenuItem>
      </Menu>
    </div>,
  )
  await user.click(screen.getByRole('button', { name: 'Export' }))
  const elsewhere = screen.getByRole('button', { name: 'elsewhere' })
  await user.click(elsewhere)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  // Pulling focus back to the trigger would yank it out of whatever the user
  // just clicked. Escape restores focus; a click elsewhere must not.
  expect(screen.getByRole('button', { name: 'Export' })).not.toHaveFocus()
})

test('the outside-click listener is removed when the open menu unmounts', async () => {
  const add = vi.spyOn(document, 'addEventListener')
  const remove = vi.spyOn(document, 'removeEventListener')
  const user = userEvent.setup()
  const { unmount } = render(
    <Menu trigger={(p) => <DownloadButton {...p} label="Export" />}>
      <MenuItem onSelect={vi.fn()}>Combined JSONL</MenuItem>
    </Menu>,
  )
  await user.click(screen.getByRole('button', { name: 'Export' }))
  const added = add.mock.calls.find(([type]) => type === 'mousedown')
  expect(added).toBeTruthy()
  unmount()
  // The same *reference*: an inline arrow in the cleanup leaks a listener on
  // every open, invisible until a page mounts a row of these.
  expect(remove).toHaveBeenCalledWith('mousedown', added![1])
  add.mockRestore()
  remove.mockRestore()
})

test('onOpenChange reports every path in and out', async () => {
  const onOpenChange = vi.fn()
  const { user, trigger } = setup({ onOpenChange })
  await user.click(trigger)
  expect(onOpenChange).toHaveBeenLastCalledWith(true)
  await user.keyboard('{Escape}')
  expect(onOpenChange).toHaveBeenLastCalledWith(false)
  await user.click(trigger)
  await user.click(screen.getByRole('menuitem', { name: 'Combined JSONL' }))
  expect(onOpenChange).toHaveBeenLastCalledWith(false)
  expect(onOpenChange).toHaveBeenCalledTimes(4)
})

test('render-prop content can replace the items and close the menu itself', async () => {
  const onConfirm = vi.fn()
  const user = userEvent.setup()

  function ClearMenu() {
    const [confirming, setConfirming] = useState(false)
    return (
      <Menu
        trigger={(p) => <DownloadButton {...p} label="Clear" />}
        onOpenChange={(open) => !open && setConfirming(false)}
      >
        {({ close }) =>
          confirming ? (
            <div className="px-3 py-2">
              <p>Clear 4 jobs?</p>
              <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  onConfirm()
                  close()
                }}
              >
                Yes, clear
              </Button>
            </div>
          ) : (
            <MenuItem closeOnSelect={false} onSelect={() => setConfirming(true)}>
              Clear all
            </MenuItem>
          )
        }
      </Menu>
    )
  }

  render(<ClearMenu />)
  const trigger = screen.getByRole('button', { name: 'Clear' })
  await user.click(trigger)
  await user.click(screen.getByRole('menuitem', { name: 'Clear all' }))
  // The focused item just unmounted; without re-homing, focus lands on <body>
  // and the next Tab restarts from the top of the page.
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  await user.tab()
  expect(screen.getByRole('button', { name: 'Yes, clear' })).toHaveFocus()
  expect(screen.getByRole('menu')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Yes, clear' }))
  expect(onConfirm).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
  // Reopening must not show yesterday's confirmation.
  await user.click(trigger)
  expect(screen.getByRole('menuitem', { name: 'Clear all' })).toBeInTheDocument()
})

test('a danger item is told apart before the pointer reaches it', async () => {
  const user = userEvent.setup()
  render(
    <Menu trigger={(p) => <DownloadButton {...p} label="Clear" />}>
      <MenuItem onSelect={vi.fn()}>Clear finished</MenuItem>
      <MenuItem tone="danger" onSelect={vi.fn()}>
        Clear all
      </MenuItem>
    </Menu>,
  )
  await user.click(screen.getByRole('button', { name: 'Clear' }))
  expect(screen.getByRole('menuitem', { name: 'Clear all' })).toHaveClass('text-danger')
  expect(screen.getByRole('menuitem', { name: 'Clear finished' })).not.toHaveClass('text-danger')
})

test('the panel hangs from the requested edge and is not inside the trigger', async () => {
  const { user, trigger } = setup({ align: 'end' })
  await user.click(trigger)
  const panel = screen.getByRole('menu')
  expect(panel).toHaveClass('right-0')
  expect(panel).toHaveClass('text-sm')
  expect(trigger.contains(panel)).toBe(false)
})

test('a disabled or busy trigger opens nothing', async () => {
  const user = userEvent.setup()
  render(
    <Menu trigger={(p) => <DownloadButton {...p} label="Export" disabled />}>
      <MenuItem onSelect={vi.fn()}>Combined JSONL</MenuItem>
    </Menu>,
  )
  await user.click(screen.getByRole('button', { name: 'Export' }))
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('the pointer moves the highlight, so there is only ever one', async () => {
  const { user, trigger } = setup()
  await user.click(trigger)
  const zip = screen.getByRole('menuitem', { name: 'Full batch ZIP' })
  fireEvent.mouseMove(zip)
  expect(zip).toHaveFocus()
})

test('a MenuItem outside a Menu says so', () => {
  const err = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<MenuItem onSelect={vi.fn()}>Orphan</MenuItem>)).toThrow(/MenuItem/)
  err.mockRestore()
})
