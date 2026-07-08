/**
 * Append `incoming` files to `existing`, dropping any incoming file that
 * duplicates one already present (including duplicates within `incoming`
 * itself). Two files are treated as the same when both their `name` and
 * `size` match — enough to dedup a re-selected file without reading its
 * contents. Order is stable: existing files keep their positions and new,
 * non-duplicate files are appended in selection order.
 *
 * @param existing - Files already selected.
 * @param incoming - Newly selected files to merge in.
 * @returns A new array; the input arrays are not mutated.
 */
export function mergeFiles(existing: File[], incoming: File[]): File[] {
  const key = (file: File) => `${file.name}::${file.size}`
  const seen = new Set(existing.map(key))
  const merged = [...existing]
  for (const file of incoming) {
    const fileKey = key(file)
    if (seen.has(fileKey)) continue
    seen.add(fileKey)
    merged.push(file)
  }
  return merged
}
