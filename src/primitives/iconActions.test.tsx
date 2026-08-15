import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  DeleteButton,
  DownloadButton,
  DownloadLink,
  MoveDownButton,
  MoveUpButton,
  NewButton,
  RefreshButton,
  RemoveButton,
  SearchButton,
  SendButton,
} from './iconActions'

test('each action names itself and draws an icon rather than a text character', () => {
  render(
    <>
      <DownloadButton label="Download" />
      <NewButton label="New chat" />
      <RemoveButton label="Remove rule" />
      <DeleteButton label="Delete collection" />
    </>,
  )
  for (const name of ['Download', 'New chat', 'Remove rule', 'Delete collection']) {
    const btn = screen.getByRole('button', { name })
    expect(btn).toHaveAttribute('title', name)
    // The affordance is a drawn SVG. A character like × or ⤓ would render from
    // whatever font the OS falls back to, differently on every machine.
    expect(btn.querySelector('svg')).toBeInTheDocument()
    expect(btn).toHaveTextContent('')
  }
})

test('DownloadLink lets the browser save a server-streamed file', () => {
  render(<DownloadLink label="Export CSV" href="/collections/a/export/documents.csv" />)
  const link = screen.getByRole('link', { name: 'Export CSV' })
  expect(link).toHaveAttribute('href', '/collections/a/export/documents.csv')
  expect(link).toHaveAttribute('download')
})

test('DownloadLink lets the caller name the saved file', () => {
  render(<DownloadLink label="Download sources" href="/s/1/sources.zip" download="sources.zip" />)
  expect(screen.getByRole('link', { name: 'Download sources' })).toHaveAttribute(
    'download',
    'sources.zip',
  )
})

test('an adornment tells side-by-side downloads apart', () => {
  render(
    <>
      <DownloadButton label="Export JSON">JSON</DownloadButton>
      <DownloadButton label="Export GraphML">GraphML</DownloadButton>
    </>,
  )
  expect(screen.getByRole('button', { name: 'Export JSON' })).toHaveTextContent('JSON')
  expect(screen.getByRole('button', { name: 'Export GraphML' })).toHaveTextContent('GraphML')
})

test('both removal actions warn on hover but differ in reach', () => {
  render(
    <>
      <RemoveButton label="Remove" />
      <DeleteButton label="Delete" />
    </>,
  )
  const remove = screen.getByRole('button', { name: 'Remove' })
  const del = screen.getByRole('button', { name: 'Delete' })
  expect(remove).toHaveClass('hover:text-danger')
  expect(del).toHaveClass('hover:text-danger')
  // Different drawings: × takes something out of a view, the trash destroys it.
  expect(remove.innerHTML).not.toBe(del.innerHTML)
})

test('the constructive action carries no danger tint', () => {
  render(
    <>
      <NewButton label="New chat" />
      <RemoveButton label="Remove chat" />
    </>,
  )
  // The hover tint is reserved for actions that take something away; wearing it
  // here would make starting a chat look like losing one.
  expect(screen.getByRole('button', { name: 'New chat' })).not.toHaveClass('hover:text-danger')
  expect(screen.getByRole('button', { name: 'Remove chat' })).toHaveClass('hover:text-danger')
})

test('a busy action blocks the second click that would delete twice', async () => {
  const onClick = vi.fn()
  render(<DeleteButton label="Delete" busy onClick={onClick} />)
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
  expect(onClick).not.toHaveBeenCalled()
})

test('the reorder pair names each direction and disables at the ends', () => {
  render(
    <>
      <MoveUpButton label="Move up" disabled />
      <MoveDownButton label="Move down" />
    </>,
  )
  // Disabled rather than hidden at the end of the run, so the row's controls
  // do not shift under the pointer.
  expect(screen.getByRole('button', { name: 'Move up' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Move down' })).toBeEnabled()
})

test('the composer trio draw distinct icons and name themselves', () => {
  render(
    <>
      <SendButton label="Send" />
      <SearchButton label="Search" />
      <RefreshButton label="Refresh" />
    </>,
  )
  const drawings = ['Send', 'Search', 'Refresh'].map((name) => {
    const btn = screen.getByRole('button', { name })
    // The label is the whole affordance in a control with no text of its own,
    // so it has to reach both the accessibility tree and the tooltip.
    expect(btn).toHaveAttribute('title', name)
    return btn.querySelector('svg')!.innerHTML
  })
  expect(new Set(drawings).size).toBe(3)
})

test('a submit action can close the form it sits in', () => {
  const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
  render(
    <form onSubmit={onSubmit}>
      <SendButton label="Send" type="submit" />
    </form>,
  )
  // IconButton writes type="button" before spreading the caller's props, so
  // this override is what lets Enter and the click submit rather than no-op.
  expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit')
})

test('a busy send blocks the double-send', async () => {
  const onClick = vi.fn()
  render(<SendButton label="Send" busy onClick={onClick} />)
  await userEvent.click(screen.getByRole('button', { name: 'Send' }))
  expect(onClick).not.toHaveBeenCalled()
})
