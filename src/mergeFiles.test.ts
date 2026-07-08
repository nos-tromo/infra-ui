import { mergeFiles } from './mergeFiles'

function file(name: string, size = 1024): File {
  return new File(['x'.repeat(size)], name, { type: 'audio/mpeg' })
}

test('appends new files to the existing selection', () => {
  const result = mergeFiles([file('a.mp3')], [file('b.mp3')])
  expect(result.map((f) => f.name)).toEqual(['a.mp3', 'b.mp3'])
})

test('drops an incoming file that duplicates name and size', () => {
  const result = mergeFiles([file('a.mp3', 10)], [file('a.mp3', 10), file('b.mp3')])
  expect(result.map((f) => f.name)).toEqual(['a.mp3', 'b.mp3'])
})

test('keeps a same-named file when the size differs', () => {
  const result = mergeFiles([file('a.mp3', 10)], [file('a.mp3', 20)])
  expect(result).toHaveLength(2)
})

test('dedups repeats within a single incoming batch', () => {
  const result = mergeFiles([], [file('a.mp3', 5), file('a.mp3', 5)])
  expect(result).toHaveLength(1)
})

test('does not mutate the input arrays', () => {
  const existing = [file('a.mp3')]
  const incoming = [file('b.mp3')]
  mergeFiles(existing, incoming)
  expect(existing).toHaveLength(1)
  expect(incoming).toHaveLength(1)
})
