import { mergeFiles, type FileLike } from './FileList'

const f = (name: string, size?: number): FileLike => ({ name, size })

describe('mergeFiles', () => {
  test('appends new files, preserving existing order', () => {
    expect(mergeFiles([f('a', 1)], [f('b', 2)])).toEqual([
      f('a', 1),
      f('b', 2),
    ])
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
