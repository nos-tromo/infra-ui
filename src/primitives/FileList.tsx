import { cn } from '../cn'
import { Button } from './Button'
import { HoverIconAction } from './HoverIconAction'

export interface FileLike {
  name: string
  size?: number
}

/**
 * Append `incoming` to `existing`, skipping any file already present (matched
 * by `name` + `size`) and preserving the existing order. Use in a file-input
 * "add" handler so re-selecting the same file never produces duplicate rows.
 */
export function mergeFiles<T extends FileLike>(existing: T[], incoming: T[]): T[] {
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

export interface FileListLabels {
  /** Summary count text. Default: `n => `${n} file${n === 1 ? '' : 's'}``. */
  files?: (count: number) => string
  /** Header "Clear all" action label. Default: `'Clear all'`. */
  clearAll?: string
  /** Remove verb; used as the row aria-label `${remove} ${name}`. Default: `'Remove'`. */
  remove?: string
}

export interface FileListProps {
  /** Files to display. A `File[]` satisfies `FileLike[]` and may be passed directly. */
  files: FileLike[]
  /** Per-row remove handler. Omit to render read-only rows (no remove control). */
  onRemove?: (index: number) => void
  /** Header "Clear all" handler. Omit to hide the action. */
  onClear?: () => void
  /** Localized label overrides; English defaults are used when absent. */
  labels?: FileListLabels
  /** Extra classes merged onto the outer panel. */
  className?: string
}

const KB = 1024
const SIZE_UNITS = ['KB', 'MB', 'GB', 'TB']

/** Humanize a byte count as B / KB / MB / GB / TB with ~1 significant decimal. */
function formatBytes(bytes: number): string {
  if (bytes < KB) return `${bytes} B`
  let value = bytes / KB
  let unit = 0
  while (value >= KB && unit < SIZE_UNITS.length - 1) {
    value /= KB
    unit += 1
  }
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10
  return `${rounded} ${SIZE_UNITS[unit]}`
}

function XGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

/**
 * A self-contained panel that displays a list of selected files: a pinned
 * summary header (count + total size + optional "Clear all") over a
 * height-capped, internally-scrolling body of numbered rows. Each row shows an
 * index, the (truncated) filename, its humanized size, and — when `onRemove`
 * is provided — a hover/focus-revealed remove control.
 *
 * Renders nothing when `files` is empty, so callers need no length guard.
 * Stable row keys assume `files` is deduped by name+size (see `mergeFiles`).
 */
export function FileList({ files, onRemove, onClear, labels, className }: FileListProps) {
  if (files.length === 0) return null

  const filesLabel = labels?.files ?? ((n: number) => `${n} file${n === 1 ? '' : 's'}`)
  const clearAllLabel = labels?.clearAll ?? 'Clear all'
  const removeLabel = labels?.remove ?? 'Remove'
  const totalBytes = files.reduce((sum, file) => sum + (file.size ?? 0), 0)

  return (
    <div className={cn('rounded-lg border border-border bg-muted/30', className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-sm text-muted-foreground">
          {filesLabel(files.length)}
          {totalBytes > 0 && <> · {formatBytes(totalBytes)}</>}
        </span>
        {onClear && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            {clearAllLabel}
          </Button>
        )}
      </div>
      <ul className="max-h-64 divide-y divide-border overflow-y-auto">
        {files.map((file, index) => (
          <li
            key={`${file.name}:${file.size ?? ''}`}
            className="group flex items-center gap-3 px-3 py-1.5 text-sm"
          >
            <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <span className="flex-1 truncate text-foreground" title={file.name}>
              {file.name}
            </span>
            {file.size !== undefined && (
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatBytes(file.size)}
              </span>
            )}
            {onRemove && (
              <HoverIconAction
                icon={<XGlyph />}
                label={`${removeLabel} ${file.name}`}
                onClick={() => onRemove(index)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
FileList.displayName = 'FileList'
