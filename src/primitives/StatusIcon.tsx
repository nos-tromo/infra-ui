import { cn } from '../cn'
import { CheckIcon, StopwatchIcon, XIcon } from '../icons'
import { Spinner } from './Spinner'

/**
 * The states a queued unit of work can be in.
 *
 * Deliberately five and no more: apps name their statuses differently
 * (`queued`/`pending`, `completed`/`complete`/`done`), so callers map their own
 * union onto this one and the drawing stays the same across the federation.
 */
export type StatusIconStatus = 'idle' | 'running' | 'done' | 'failed' | 'cancelled'

export interface StatusIconProps {
  /** Which state to draw. */
  status: StatusIconStatus
  /**
   * Accessible name and tooltip — the caller's own translated wording
   * ("Queued", "Läuft", "Abgeschlossen"). Required: the marker carries no text,
   * so this is the only thing a screen reader or a hovering pointer gets.
   */
  label: string
  /** Sizing and colour overrides, applied last. */
  className?: string
}

/** Per-state drawing and tint. Terminal states mark themselves; live ones spin. */
const MARKERS = {
  idle: { Icon: StopwatchIcon, tint: 'text-muted-foreground' },
  done: { Icon: CheckIcon, tint: 'text-primary' },
  failed: { Icon: XIcon, tint: 'text-danger' },
  cancelled: { Icon: XIcon, tint: 'text-muted-foreground' },
} as const

/**
 * The state of one job, task or upload, drawn rather than spelled out.
 *
 * A row of these is read down a list at a glance, which a column of words is
 * not — and the words are the part that changes length per language, pushing
 * the controls beside them around. The label is not lost: it becomes the
 * accessible name and the tooltip, so the wording still reaches a screen reader
 * and a hovering pointer.
 *
 * The vocabulary is the set's existing status pair plus the stopwatch —
 * `CheckIcon` and `XIcon` are already read as pass/fail, and `StopwatchIcon`
 * already means time taken, so nothing new is invented here. `failed` and
 * `cancelled` share the cross and differ by tint: one is an error the user
 * should look at, the other is a thing they themselves stopped.
 *
 * `running` is the `Spinner`, not an icon — motion is what says "still going",
 * and a static drawing for it would be indistinguishable from `idle` at a
 * glance. It keeps the spinner's own `role="status"`, so assistive tech
 * announces it as live rather than as an image.
 *
 * @param props - `status` picks the drawing; `label` names it.
 * @returns The status marker.
 */
export function StatusIcon({ status, label, className }: StatusIconProps) {
  if (status === 'running') {
    // The Spinner already carries role="status" + the accessible name; the
    // wrapper exists only to hang the tooltip on, so it takes no role of its
    // own — nesting role="img" around a live region would announce twice.
    return (
      <span title={label} className="inline-flex shrink-0">
        <Spinner label={label} className={cn('h-4 w-4', className)} />
      </span>
    )
  }
  const { Icon, tint } = MARKERS[status]
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-flex shrink-0 items-center justify-center"
    >
      <Icon className={cn('h-4 w-4', tint, className)} />
    </span>
  )
}
