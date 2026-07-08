import { render, screen, fireEvent } from '@testing-library/react'
import { FileList } from './FileList'

function file(name: string, size = 1024): File {
  return new File(['x'.repeat(size)], name, { type: 'audio/mpeg' })
}

test('renders nothing when there are no files', () => {
  const { container } = render(<FileList files={[]} />)
  expect(container).toBeEmptyDOMElement()
})

test('shows a count summary and one row per file', () => {
  render(<FileList files={[file('a.mp3'), file('b.mp3')]} />)
  expect(screen.getByText(/2 files/)).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByText('a.mp3')).toBeInTheDocument()
  expect(screen.getByText('b.mp3')).toBeInTheDocument()
})

test('singularizes the count for a single file', () => {
  render(<FileList files={[file('a.mp3')]} />)
  expect(screen.getByText('1 file')).toBeInTheDocument()
})

test('calls onRemove with the clicked row index', () => {
  const onRemove = vi.fn()
  render(<FileList files={[file('a.mp3'), file('b.mp3')]} onRemove={onRemove} />)
  fireEvent.click(screen.getByRole('button', { name: 'Remove b.mp3' }))
  expect(onRemove).toHaveBeenCalledWith(1)
})

test('hides the remove control when onRemove is omitted', () => {
  render(<FileList files={[file('a.mp3')]} />)
  expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull()
})

test('calls onClear from the header action', () => {
  const onClear = vi.fn()
  render(<FileList files={[file('a.mp3')]} onClear={onClear} />)
  fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
  expect(onClear).toHaveBeenCalledTimes(1)
})

test('hides the clear control when onClear is omitted', () => {
  render(<FileList files={[file('a.mp3')]} />)
  expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull()
})
