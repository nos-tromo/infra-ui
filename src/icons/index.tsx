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

/**
 * A report — a page of written findings.
 *
 * Drawn as a sheet with a folded corner and two lines of text, because a report
 * in these apps is a *document being assembled*, not a chart or a clipboard: the
 * lines say it holds prose someone wrote, and the fold says it is one page of
 * it. It is the only page in the set, so nothing else in a row can be mistaken
 * for it.
 */
export const ReportIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h6" />
  </svg>
)

/**
 * The same report, with this artifact already in it.
 *
 * The pair exists because "add to report" is a *toggle* that carries no text:
 * one drawing pressed and unpressed would leave its two states to be told apart
 * by a background tint alone. So the page stays exactly where it is and only
 * its contents change — the lines become a tick — which reads as the sheet
 * being filled rather than swapped for a different icon.
 *
 * The tick is part of a composite drawing, sized to sit inside the page;
 * {@link CheckIcon} remains the system's one standalone checkmark.
 */
export const ReportCheckIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="m9 15 2 2 4-4" />
  </svg>
)

/**
 * Send the message that has been typed.
 *
 * The paper plane every chat composer uses — a triangle with the fold line
 * that turns it from an arrowhead into a sheet in flight. Drawn rather than
 * borrowed from an arrow because the two say different things: an arrow points
 * somewhere, this one leaves.
 */
export const SendIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M21.5 2.5 11 13" />
    <path d="M21.5 2.5 15 21.5 11 13 2.5 9z" />
  </svg>
)

/**
 * Search whatever the surrounding field takes as its query.
 *
 * A magnifier, and deliberately nothing cleverer: like {@link DownloadIcon} it
 * has to be understood on first sight, without a label, by someone who has
 * never opened the app.
 */
export const SearchIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </svg>
)

/**
 * Rebuild something already on screen.
 *
 * **Two** arcs chasing each other, each with its own arrowhead — not one
 * circular arrow. A single arrow curving back on itself is the undo/revert
 * drawing; the closed pair is what reads as *again*. The gaps between them are
 * what leaves room for the heads, so an arc that swept the full circle would
 * cost the icon its meaning rather than tidy it.
 */
export const RefreshIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M20.5 12a8.5 8.5 0 0 1-14.6 5.9L3 15" />
    <path d="M3.5 12a8.5 8.5 0 0 1 14.6-5.9L21 9" />
    <path d="M3 20.5V15h5.5" />
    <path d="M21 3.5V9h-5.5" />
  </svg>
)

/**
 * Back to where this page was reached from.
 *
 * A full arrow rather than a chevron: a chevron is a disclosure or a step
 * within a list, and this leaves the page. It sits beside its label — a link
 * that goes back still has to say what it goes back to.
 */
export const ArrowLeftIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
)

/**
 * Reasoning mode, off.
 *
 * A brain in outline: two lobes meeting at a fissure. It is the glyph chat
 * products have converged on for "let the model think before answering", so it
 * is read without a label — which a label-less toggle needs. Drawn as two
 * mirrored lobes rather than a single blob because the fissure is what stops a
 * rounded outline from reading as a cloud or a thought bubble.
 */
export const BrainIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M12 5a3 3 0 1 0-5.9.6A3 3 0 0 0 4 9.5a3 3 0 0 0 .5 5A3 3 0 0 0 7 19a3 3 0 0 0 5-1.5" />
    <path d="M12 5a3 3 0 1 1 5.9.6A3 3 0 0 1 20 9.5a3 3 0 0 1-.5 5A3 3 0 0 1 17 19a3 3 0 0 1-5-1.5" />
    <path d="M12 5v12.5" />
  </svg>
)

/**
 * The same brain, with reasoning switched on.
 *
 * The second *state* pair in the set, after {@link ReportIcon} /
 * {@link ReportCheckIcon}, and for the same reason: "reasoning on/off" is a
 * toggle that carries no text, so one drawing pressed and unpressed would leave
 * its two states to a background tint alone. The outline stays exactly where it
 * is and a spark appears inside it — the head lighting up, not a different
 * icon. The idle drawing's fissure gives way to the spark so the two do not
 * fight over the same few pixels.
 */
export const BrainActiveIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M12 5a3 3 0 1 0-5.9.6A3 3 0 0 0 4 9.5a3 3 0 0 0 .5 5A3 3 0 0 0 7 19a3 3 0 0 0 5-1.5" />
    <path d="M12 5a3 3 0 1 1 5.9.6A3 3 0 0 1 20 9.5a3 3 0 0 1-.5 5A3 3 0 0 1 17 19a3 3 0 0 1-5-1.5" />
    <path d="M12 5v2.5M12 15v2.5" />
    <path d="M12 8.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
  </svg>
)

/**
 * Start or open playback of a recording.
 *
 * A right-pointing triangle, closed with `z` — the one drawing every media
 * surface has agreed on, so it needs no label to be understood. Drawn as a
 * path on the shared stroke like the rest of the set, never the `▶` character,
 * which arrives in whatever font the machine falls back to and carries emoji
 * presentation on some platforms.
 *
 * It is deliberately not a chevron — that is disclosure or a step within a
 * list, see {@link ChevronDownIcon} — and not {@link SendIcon}'s plane, which
 * is the other closed triangle-ish shape in the set and can sit a few pixels
 * away in the same toolbar.
 */
export const PlayIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M7 5v14l12-7z" />
  </svg>
)

/**
 * Every source at once — the whole corpus, whatever it is made of.
 *
 * Stacked sheets seen edge-on: the drawing says "all of these together", which
 * is what distinguishes it from the two icons it cycles with. It is not a
 * document ({@link DocumentsIcon} is a page with a corner) and not a picture —
 * it is the union, so it must not look like either half.
 */
export const LayersIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 12 9 5 9-5" />
    <path d="m3 16 9 5 9-5" />
  </svg>
)

/**
 * The written documents — a stack of pages, not one page.
 *
 * Deliberately not {@link ReportIcon}: that is a single sheet *with lines*, one
 * document someone is assembling. This is a page with a second behind it, which
 * reads as the corpus rather than a particular file. The two can appear in the
 * same app, so the second sheet is what keeps them apart at 16px.
 */
export const DocumentsIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M9 3h6l4 4v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M15 3v4h4" />
    <path d="M4 8v11a2 2 0 0 0 2 2h9" />
  </svg>
)

/**
 * Stored imagery — pictures, keyframes, scanned figures.
 *
 * The framed sun-over-a-hill every file browser and editor draws for an image,
 * so it needs no label. Kept literal on purpose: a camera would say "take a
 * photo" and a gallery grid would say "browse", where this one names a *kind of
 * source*.
 */
export const ImageIcon = ({ className = 'h-4 w-4', ...props }: IconProps) => (
  <svg {...base} className={className} {...props}>
    <path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <circle cx="9" cy="9.5" r="1.5" />
    <path d="m21 15-5-5-9 9" />
  </svg>
)
