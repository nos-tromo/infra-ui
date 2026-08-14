import type { SVGProps } from 'react'

/**
 * The design system's icon set.
 *
 * **Icons are drawn, never typed.** A character such as `×`, `▾`, `⤓` or `☀`
 * renders from whatever font the browser and OS happen to fall back to, so its
 * weight, size and baseline differ on every machine — and in a control that
 * carries no text of its own, that drawing *is* the whole affordance. Only
 * fixed geometry renders the same everywhere.
 *
 * The set lives here rather than inside the components that use it so an icon
 * is added once and every app gets it: adding a new icon action means one entry
 * below plus a small wrapper over {@link IconButton}, never a fresh hand-rolled
 * SVG in an app.
 *
 * Every icon is `aria-hidden` — each is mounted inside a control that carries
 * its own accessible name — inherits `currentColor`, and is sized by the caller
 * through `className` (default `h-4 w-4`).
 */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export type IconProps = SVGProps<SVGSVGElement>

/**
 * Save a file to the machine.
 *
 * Deliberately the conventional arrow-into-a-tray and nothing cleverer: this is
 * the icon that has to be understood without a label, on first sight, by
 * someone who has never opened the app before.
 */
export const DownloadIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M12 3v12" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
)

/**
 * Bring one more into being: a chat, a report, a row.
 *
 * The same two strokes {@link XIcon} draws on the diagonal, which is why the
 * angle has to stay square — tilted, an invitation to add reads as an offer to
 * take away.
 */
export const PlusIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

/** Take this out of the list, the selection, or the view. Nothing is destroyed. */
export const XIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

/** Destroy stored data. Reserved for what does not come back. */
export const TrashIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

/** Disclosure caret. Rotate it with a class rather than swapping the icon. */
export const ChevronDownIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

/** The up caret — a sort ascending, or a move toward the top of a list. */
export const ChevronUpIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="m6 15 6-6 6 6" />
  </svg>
)

/**
 * Sortable, but not currently sorted.
 *
 * Both directions at once, so a column header can advertise that it *can* sort
 * without claiming a direction it does not have.
 */
export const ChevronsUpDownIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </svg>
)

/** Something needs attention but nothing has failed outright. */
export const WarningIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
)

/**
 * Context, offered rather than demanded.
 *
 * Deliberately {@link WarningIcon}'s stack inverted — dot above, bar below — so
 * the two read as one family and differ only where it matters: the triangle
 * interrupts, the circle does not.
 */
export const InfoIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-5M12 8h.01" />
  </svg>
)

/**
 * It worked, it passed, it is already in.
 *
 * The pass half of a pair whose fail half is {@link XIcon} — the two get read
 * side by side as one status vocabulary, so they must keep the same stroke
 * weight and optical size or a run's outcome starts depending on which marker
 * it drew.
 */
export const CheckIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

/**
 * This link leaves — a new tab, or the app entirely.
 *
 * The arrow escaping the frame is the whole message, so it belongs beside the
 * label rather than replacing it: unlike a row action, a link that opens
 * elsewhere still needs to say *where* it goes.
 */
export const ExternalLinkIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
  </svg>
)

/**
 * Time *taken*, not time of day.
 *
 * A dial with a crown, deliberately not a clock face: this marks a duration —
 * how long a run has been going, or how long it took — and a clock beside a
 * counter reads as a timestamp instead.
 */
export const StopwatchIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <circle cx="12" cy="14" r="8" />
    <path d="M12 14v-4" />
    <path d="M9 2h6" />
    <path d="M12 2v4" />
  </svg>
)
