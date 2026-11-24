import type { ReactElement } from 'react'
import { cn } from '../cn'

export interface ContextMeterProps {
  /** How much is used, as a fraction from 0 to 1. Clamped to [0, 1]; NaN is 0. */
  value: number
  /** The accessible name and the tooltip, in the app's language: "about 62 % of the context used". */
  label: string
  /** The fraction from which the meter warns. Defaults to 0.8. */
  warnAt?: number
  /** Merged onto the root, last. */
  className?: string
}

/**
 * How much of a budget is used, such as a chat's context, as a small ring that
 * fills clockwise from the top.
 *
 * The number lives only in `label`, never in the drawing: the app words it and
 * rounds it in its own language, with its own "about", and the ring holds no
 * text that a translation or a font could change. The normal arc is muted, not
 * the accent, because the ring is a reading and not a control; from `warnAt` it
 * turns to the warning colour.
 *
 * `label` is also the value's text (`aria-valuetext`), so a screen reader
 * announces the app's wording, "about 62 % of the context used", and not a bare
 * "62" after the name.
 *
 * The level is decided on the value, not on the rounded percent, so an app that
 * shows a note from the same value and the same threshold agrees with the ring:
 * 0.799 reads as 80 and is still below 0.8. A value above 1 (an estimate over
 * its budget) draws a full ring, and a missing number (`NaN`) is 0. Nothing
 * that rounds to 0 draws an arc, so a round-capped dot never shows for an empty
 * budget.
 *
 * It has no transition and no animation: the ring is read, not watched, so
 * `prefers-reduced-motion` has nothing to turn off.
 */
export function ContextMeter({
  value,
  label,
  warnAt = 0.8,
  className,
}: ContextMeterProps): ReactElement {
  const fraction = Number.isNaN(value) ? 0 : Math.min(1, Math.max(0, value))
  const percent = Math.round(fraction * 100)
  const level = fraction >= warnAt ? 'warn' : 'normal'
  return (
    <span
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={label}
      aria-label={label}
      title={label}
      data-level={level}
      className={cn('inline-flex size-4.5 shrink-0', className)}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-full w-full -rotate-90">
        <circle
          data-part="track"
          cx={12}
          cy={12}
          r={9}
          stroke="currentColor"
          strokeWidth={3}
          className="text-border"
        />
        {percent > 0 && (
          <circle
            data-part="arc"
            cx={12}
            cy={12}
            r={9}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${percent} 100`}
            className={level === 'warn' ? 'text-warning' : 'text-muted-foreground'}
          />
        )}
      </svg>
    </span>
  )
}

ContextMeter.displayName = 'ContextMeter'
