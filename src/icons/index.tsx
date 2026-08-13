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
