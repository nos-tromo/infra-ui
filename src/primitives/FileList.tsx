export interface FileLike {
  name: string
  size?: number
}

/**
 * Append `incoming` to `existing`, skipping any file already present (matched
 * by `name` + `size`) and preserving the existing order. Use in a file-input
 * "add" handler so re-selecting the same file never produces duplicate rows.
 */
export function mergeFiles<T extends FileLike>(
  existing: T[],
  incoming: T[]
): T[] {
  const key = (file: FileLike) => `${file.name}:${file.size ?? ''}`
  const seen = new Set(existing.map(key))
  const result = [...existing]
  for (const file of incoming) {
    const k = key(file)
    if (seen.has(k)) continue
    seen.add(k)
    result.push(file)
  }
  return result
}
