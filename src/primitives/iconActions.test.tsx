import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  DeleteButton,
  DownloadButton,
  DownloadLink,
  MoveDownButton,
  MoveUpButton,
  RemoveButton,
} from './iconActions'

test('each action names itself and draws an icon rather than a text character', () => {
  render(
    <>
      <DownloadButton label="Download" />
      <RemoveButton label="Remove rule" />
      <DeleteButton label="Delete collection" />
    </>,
  )
  for (const name of ['Download', 'Remove rule', 'Delete collection']) {
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
