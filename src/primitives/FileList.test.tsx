import { render, screen, fireEvent } from '@testing-library/react'
import { mergeFiles, FileList, type FileLike } from './FileList'

const f = (name: string, size?: number): FileLike => ({ name, size })

describe('mergeFiles', () => {
  test('appends new files, preserving existing order', () => {
    expect(mergeFiles([f('a', 1)], [f('b', 2)])).toEqual([f('a', 1), f('b', 2)])
  })

  test('drops files already present (matched by name + size)', () => {
    const out = mergeFiles([f('a', 1), f('b', 2)], [f('a', 1), f('c', 3)])
    expect(out.map((x) => x.name)).toEqual(['a', 'b', 'c'])
  })

  test('treats the same name with a different size as a distinct file', () => {
    expect(mergeFiles([f('a', 1)], [f('a', 2)])).toHaveLength(2)
  })

  test('dedups duplicates within a single incoming batch', () => {
    expect(mergeFiles([], [f('a', 1), f('a', 1)])).toHaveLength(1)
  })

  test('handles empty inputs on either side', () => {
    expect(mergeFiles([], [f('a', 1)])).toEqual([f('a', 1)])
    expect(mergeFiles([f('a', 1)], [])).toEqual([f('a', 1)])
  })
})

describe('FileList', () => {
  test('renders nothing when there are no files', () => {
    const { container } = render(<FileList files={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  test('summarizes the count and total size', () => {
    render(<FileList files={[f('a.txt', 1024), f('b.txt', 1024)]} />)
    expect(screen.getByText(/2 files/)).toBeInTheDocument()
    expect(screen.getByText(/2 KB/)).toBeInTheDocument()
  })

  test('uses the singular form for one file', () => {
    render(<FileList files={[f('solo.pdf', 512)]} />)
    expect(screen.getByText(/1 file\b/)).toBeInTheDocument()
  })

  test('numbers the rows in order', () => {
    render(<FileList files={[f('a.txt', 1), f('b.txt', 1)]} />)
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('1')
    expect(rows[0]).toHaveTextContent('a.txt')
    expect(rows[1]).toHaveTextContent('2')
    expect(rows[1]).toHaveTextContent('b.txt')
  })

  test('exposes the full filename via a title attribute', () => {
    render(<FileList files={[f('a-very-long-filename.txt', 1)]} />)
    expect(screen.getByText('a-very-long-filename.txt')).toHaveAttribute(
      'title',
      'a-very-long-filename.txt',
    )
  })

  test('calls onRemove with the row index', () => {
    const onRemove = vi.fn()
    render(<FileList files={[f('a.txt', 1), f('b.txt', 1)]} onRemove={onRemove} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove b.txt' }))
    expect(onRemove).toHaveBeenCalledWith(1)
  })

  test('calls onClear from the header action', () => {
    const onClear = vi.fn()
    render(<FileList files={[f('a.txt', 1)]} onClear={onClear} />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(onClear).toHaveBeenCalled()
  })

  test('renders no remove control when onRemove is omitted', () => {
    render(<FileList files={[f('a.txt', 1)]} />)
    expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull()
  })

  test('honors label overrides', () => {
    render(
      <FileList
        files={[f('a.txt', 1), f('b.txt', 1)]}
        onRemove={() => {}}
        onClear={() => {}}
        labels={{ files: (n) => `${n} Dateien`, clearAll: 'Alle entfernen', remove: 'Entfernen' }}
      />,
    )
    expect(screen.getByText(/2 Dateien/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alle entfernen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entfernen a.txt' })).toBeInTheDocument()
  })

  test('caps the scroll body height', () => {
    render(<FileList files={[f('a.txt', 1)]} />)
    expect(screen.getByRole('list')).toHaveClass('max-h-64', 'overflow-y-auto')
  })

  test('rolls a size just under a 1024 power up to the next unit', () => {
    render(<FileList files={[f('big.bin', 1048575)]} />)
    expect(screen.getAllByText(/1 MB/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/1024 KB/)).toBeNull()
  })

  test('omits the size cell and total when a file has no size', () => {
    render(<FileList files={[f('unknown.dat')]} />)
    expect(screen.getByText('unknown.dat')).toBeInTheDocument()
    expect(screen.getByText('1 file')).toBeInTheDocument()
    expect(screen.queryByText(/\d+ (B|KB|MB|GB)/)).toBeNull()
  })
})
