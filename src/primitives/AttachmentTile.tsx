import { useId, useState, type ReactElement } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../cn'
import { AudioIcon, FileIcon, ImageIcon, VideoIcon, WarningIcon, type IconProps } from '../icons'
import { Badge } from './Badge'
import { RemoveButton } from './iconActions'
import { Spinner } from './Spinner'

export type AttachmentKind = 'image' | 'document' | 'video' | 'audio'
export type AttachmentTileStatus = 'uploading' | 'processing' | 'ready' | 'failed' | 'expired'

export interface AttachmentTileProps {
  /** The file's name: the tile's accessible name, and its tooltip. */
  name: string
  /** What the file is. Decides the tile's shape and its drawing. */
  kind: AttachmentKind
  /** Where the file is in its life. `ready` shows no marker. */
  status: AttachmentTileStatus
  /** A picture of the file, drawn only when `kind` is `image` and `status` is not `expired`. */
  thumbnailUrl?: string
  /** What to say under the name on a non-image tile: "2.4 MB", "24 slides", "01:12". */
  detail?: string
  /** A short caution about a ready file ("Very long: read only in parts"). Shown only while `status` is `ready`. */
  warning?: string
  /** The status marker's text. Defaults to Uploading, Processing, Failed or Expired. */
  statusLabel?: string
  /** Opens the file. The face is a `<button>` only when this is set. */
  onOpen?: () => void
  /** Takes the file out. Renders the remove button. */
  onRemove?: () => void
  /** The remove button's label. Defaults to `Remove ${name}`. */
  removeLabel?: string
  /** `sm` for a composer's row, `md` for a message's grid. Defaults to `sm`. */
  size?: 'sm' | 'md'
  /** Merged onto the root, last. */
  className?: string
}

const KIND_ICONS: Record<AttachmentKind, (props: IconProps) => ReactElement> = {
  image: ImageIcon,
  document: FileIcon,
  video: VideoIcon,
  audio: AudioIcon,
}

const DEFAULT_STATUS_LABELS: Record<Exclude<AttachmentTileStatus, 'ready'>, string> = {
  uploading: 'Uploading',
  processing: 'Processing',
  failed: 'Failed',
  expired: 'Expired',
}

/**
 * The tile's face. An image is a square cover; every other kind is a row with
 * its drawn kind, the name and the detail. The surface is opaque, so the tile
 * reads on the page and on `UserBubble`'s accent alike. An expired image at `sm`
 * is a row too: it has no picture left, and a 56px square cannot hold the badge.
 */
const face = cva(
  'relative flex items-center border bg-background text-left text-sm text-foreground',
  {
    variants: {
      kind: {
        image: 'justify-center overflow-hidden rounded-xl',
        other: 'gap-3 rounded-xl px-2',
      },
      size: { sm: '', md: '' },
    },
    compoundVariants: [
      { kind: 'image', size: 'sm', class: 'size-14' },
      { kind: 'image', size: 'md', class: 'size-28' },
      { kind: 'other', size: 'sm', class: 'h-14 w-56' },
      { kind: 'other', size: 'md', class: 'h-16 w-64' },
    ],
  },
)

/**
 * An attached file in a chat: its picture, or its drawn kind, and where it is.
 *
 * An image shows its `thumbnailUrl` as a square cover. Every other kind is a
 * row of its drawing, the name and a `detail`, and ignores the URL. While a file
 * is `uploading` or `processing` a spinner marks it; `failed` is drawn with the
 * warning sign and a red border, and `expired` shows the drawing with a badge in
 * place of the picture, which is gone by then. Without a URL, or when the
 * picture does not load, an image falls back to its drawing. At `sm` an expired
 * image is drawn as a row, like every other kind, so its badge reads whole; at
 * `md` it keeps the square.
 *
 * The face and the remove button are siblings, never nested: a button inside a
 * button is invalid, and the remove action must be its own stop in the tab
 * order that never opens the file. The face is a `<button>` only when `onOpen`
 * is set, so the face of a tile that opens nothing is not focusable (its remove
 * button still is).
 *
 * A failure is drawn with the warning sign, not the cross. The cross in the corner is
 * the remove action, and two crosses on one tile would mean two things. It is
 * small (20px drawn, a 12px cross, a 24px target) and, where a pointer can hover,
 * shows only while the pointer is over the tile or the keyboard's focus is in it,
 * so a row of files reads as files; on a touch screen, which cannot hover, it
 * always shows. It stays its own stop in the tab order, and shows as soon as the
 * keyboard reaches it.
 *
 * A `warning` is a caution about a file that works: "Very long: read only in
 * parts". It shows only while the tile is `ready`: a failed or expired tile has
 * its own marker, and a busy tile's warning waits until it is ready, so the two
 * never stack. It is tinted `warning`, not `danger`, and the border stays as it
 * was, since nothing has failed. A row gives it a third line under the detail,
 * cut with an ellipsis and whole in its tooltip. A square has no room for a line
 * and the picture must stay clear, so it draws the sign alone in the bottom-left
 * corner, away from the remove cross; its text is the tooltip and, for a screen
 * reader, part of the description.
 *
 * The caller makes, owns and revokes the thumbnail's object URL; the tile
 * fetches nothing. Put tiles above `ChatComposer`'s pill, not inside it: its
 * `[&_button]:rounded-full` would round the face.
 *
 * @param props - `name`, `kind` and `status` are required.
 * @returns The tile.
 */
export function AttachmentTile({
  name,
  kind,
  status,
  thumbnailUrl,
  detail,
  warning,
  statusLabel,
  onOpen,
  onRemove,
  removeLabel,
  size = 'sm',
  className,
}: AttachmentTileProps): ReactElement {
  const id = useId()
  const markerId = `${id}-status`
  const detailId = `${id}-detail`
  const warningId = `${id}-warning`
  // The URL that failed, not a flag: a new URL is tried with no effect to reset it.
  const [failedUrl, setFailedUrl] = useState<string>()

  const isImage = kind === 'image'
  const picture =
    isImage && status !== 'expired' && thumbnailUrl && failedUrl !== thumbnailUrl
      ? thumbnailUrl
      : undefined
  const busy = status === 'uploading' || status === 'processing'
  const failed = status === 'failed'
  const expired = status === 'expired'
  const hasMarker = busy || failed || expired
  const label = status === 'ready' ? '' : (statusLabel ?? DEFAULT_STATUS_LABELS[status])
  // The row shape: every other kind, and an expired image at `sm`, where the
  // square has no room for the badge ("Ex…") and there is no picture to show.
  const row = !isImage || (expired && size === 'sm')
  const hasDetail = !isImage && Boolean(detail)
  // A failed or expired tile has its marker, and a busy one's warning waits.
  const showWarning = Boolean(warning) && status === 'ready'
  const describedBy =
    [hasDetail && detailId, hasMarker && markerId, showWarning && warningId]
      .filter(Boolean)
      .join(' ') || undefined

  const big = size === 'md'
  const spinner = <Spinner label={label} className={big ? 'h-7 w-7' : 'h-5 w-5'} />
  const failureMark = (iconClass: string) => (
    <span role="img" aria-label={label} title={label} className="inline-flex text-danger">
      <WarningIcon className={iconClass} />
    </span>
  )
  // `block`: an ellipsis needs a block container, which `Badge`'s inline-flex is not.
  const badge = <Badge className="block max-w-full truncate">{label}</Badge>
  // The button's contents are presentational, so what describes it is this text,
  // not the labelled spinner or warning beside it. A div face has no description
  // to give, and there the spinner or warning already names the state.
  const said = onOpen ? (
    <span id={markerId} className="sr-only">
      {label}
    </span>
  ) : null

  const Icon = KIND_ICONS[kind]
  let content: ReactElement
  if (!row) {
    // Inside the button the button carries the name; otherwise the picture, or
    // the drawing that stands in for it, must.
    const drawing = <ImageIcon className="h-6 w-6 text-muted-foreground" />
    const stand = onOpen ? (
      drawing
    ) : (
      <span role="img" aria-label={name} title={name} className="inline-flex">
        {drawing}
      </span>
    )
    content = (
      <>
        {picture ? (
          <img
            src={picture}
            alt={onOpen ? '' : name}
            title={name}
            onError={() => setFailedUrl(picture)}
            className="h-full w-full object-cover"
          />
        ) : expired ? (
          <span className="flex max-w-full min-w-0 flex-col items-center gap-1 px-1">
            {stand}
            <span id={markerId} className="flex max-w-full min-w-0">
              {badge}
            </span>
          </span>
        ) : busy || failed ? (
          // No picture: the marker takes the drawing's place, so the two never stack.
          <span className="flex items-center justify-center" title={name}>
            {busy ? spinner : failureMark(big ? 'h-7 w-7' : 'h-5 w-5')}
            {said}
            {!onOpen && <span className="sr-only">{name}</span>}
          </span>
        ) : (
          stand
        )}
        {picture && (busy || failed) && (
          // A picture is veiled, so the marker reads on any of them.
          <span className="absolute inset-0 flex items-center justify-center bg-background/50">
            {busy ? spinner : failureMark(big ? 'h-7 w-7' : 'h-5 w-5')}
            {said}
          </span>
        )}
        {showWarning && (
          // No room for a line: the drawing alone, bottom left, clear of the remove cross.
          <span
            title={warning}
            className="absolute bottom-1 left-1 inline-flex rounded-full bg-background p-0.5 text-warning"
          >
            <WarningIcon className="h-3.5 w-3.5" />
            <span id={warningId} className="sr-only">
              {warning}
            </span>
          </span>
        )}
      </>
    )
  } else {
    content = (
      <>
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            expired ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary',
          )}
        >
          {busy ? (
            <>
              <Spinner label={label} className="h-5 w-5" />
              {said}
            </>
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium" title={name}>
            {name}
          </span>
          {hasDetail && (
            <span id={detailId} className="truncate text-xs text-muted-foreground">
              {detail}
            </span>
          )}
          {showWarning && (
            <span className="flex min-w-0 items-center gap-1 text-xs text-warning">
              <WarningIcon className="h-3 w-3 shrink-0" />
              <span id={warningId} title={warning} className="truncate">
                {warning}
              </span>
            </span>
          )}
        </span>
        {failed && (
          <span className="flex shrink-0">
            {failureMark('h-5 w-5')}
            {said}
          </span>
        )}
        {expired && (
          <span id={markerId} className="flex max-w-[40%] min-w-0">
            {badge}
          </span>
        )}
      </>
    )
  }

  const faceClass = cn(
    face({ kind: row ? 'other' : 'image', size }),
    failed ? 'border-danger' : 'border-border',
    // The offset keeps the ring apart from the face: on `UserBubble` the accent is
    // the primary colour, and a ring in it would vanish.
    onOpen &&
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  )

  return (
    <div
      data-kind={kind}
      data-status={status}
      data-size={size}
      className={cn('group/tile relative w-fit', className)}
    >
      {onOpen ? (
        <button
          type="button"
          data-part="face"
          aria-label={name}
          aria-describedby={describedBy}
          onClick={() => onOpen()}
          className={faceClass}
        >
          {content}
        </button>
      ) : (
        <div data-part="face" className={faceClass}>
          {content}
        </div>
      )}
      {onRemove && (
        <RemoveButton
          label={removeLabel ?? `Remove ${name}`}
          onClick={() => onRemove()}
          className={cn(
            'absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full border border-border bg-background shadow-sm [&_svg]:h-3 [&_svg]:w-3',
            // Drawn at 20px, a target of 24px (WCAG 2.2, 2.5.8).
            "after:absolute after:-inset-0.5 after:content-['']",
            // Shown on hover or keyboard focus where a pointer can hover; always on a touch screen. The hover and focus
            // classes outrank the hiding one by specificity, not by order.
            'transition-opacity [@media(hover:hover)]:opacity-0 group-hover/tile:opacity-100 group-has-[:focus-visible]/tile:opacity-100',
          )}
        />
      )}
    </div>
  )
}
AttachmentTile.displayName = 'AttachmentTile'
