import { type HTMLAttributes } from 'react'
import { cn } from '../cn'

/** Format a byte count for display, e.g. 1536 → "1.5 KB". */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(1)} ${units[unit]}`
}

export interface FileListProps extends HTMLAttributes<HTMLDivElement> {
  /** The selected files to display, in order. */
  files: File[]
  /**
   * Called with a file's index to remove it. Omit to hide the per-row remove
   * controls (e.g. while an upload is in flight).
   */
  onRemove?: (index: number) => void
  /** Called to clear every file. Omit to hide the "Clear all" control. */
  onClear?: () => void
}

/**
 * Render a selected-files panel: a count header with an optional "Clear all"
 * action, and one row per file showing its name, size, and an optional remove
 * control. Renders nothing when `files` is empty.
 *
 * Each control appears only when its handler is supplied, so a disabled or
 * pending caller can pass `undefined` to hide the remove/clear affordances
 * without changing the layout otherwise.
 */
export function FileList({ files, onRemove, onClear, className, ...props }: FileListProps) {
  if (files.length === 0) return null

  return (
    <div
      className={cn('rounded-md border border-border bg-muted/30 text-sm', className)}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-medium text-foreground">
          {files.length} file{files.length === 1 ? '' : 's'}
        </span>
        {onClear && (
          <button
            type="button"
            className="text-muted-foreground transition-colors hover:text-foreground"
            onClick={onClear}
          >
            Clear all
          </button>
        )}
      </div>
      <ul className="divide-y divide-border">
        {files.map((file, index) => (
          <li
            key={`${file.name}::${file.size}`}
            className="flex items-center justify-between gap-3 px-3 py-2"
          >
            <span className="min-w-0 truncate text-foreground">{file.name}</span>
            <span className="flex shrink-0 items-center gap-3">
              <span className="text-muted-foreground">{formatBytes(file.size)}</span>
              {onRemove && (
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  className="text-muted-foreground transition-colors hover:text-danger"
                  onClick={() => onRemove(index)}
                >
                  ✕
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
