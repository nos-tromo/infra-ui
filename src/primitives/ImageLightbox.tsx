import {
  useLayoutEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type SyntheticEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { XIcon } from '../icons'
import { IconButton } from './IconButton'
import { DownloadButton, DownloadLink } from './iconActions'

export interface ImageLightboxProps {
  /** Whether the picture is shown. While false the component renders nothing. */
  open: boolean
  /** The picture: an object URL or a data URL. The caller makes, owns and revokes it. */
  src: string
  /** What the picture is: the image's `alt` and the dialog's accessible name. */
  alt: string
  /** Called for every request to close: Close, Escape, a click beside the picture. */
  onClose: () => void
  /** The Close button's label, in the app's language. */
  closeLabel: string
  /** Renders a download link to this address, in place of the download button. */
  downloadHref?: string
  /**
   * The link's `download` attribute. An object URL would save under a random
   * name, so say the file's own. Without it the link still downloads.
   */
  downloadName?: string
  /** The download control's label. Defaults to `Download`. */
  downloadLabel?: string
  /** Renders a download button, for a file the page builds itself. Ignored with `downloadHref`. */
  onDownload?: () => void
}

type OpenImageLightboxProps = Omit<ImageLightboxProps, 'open'>

/**
 * The open lightbox. It exists only while the lightbox is open, so its mount and
 * unmount are the dialog's open and close, and an effect's cleanup runs while the
 * dialog is still in the document.
 *
 * @param props - The lightbox's props, without `open`.
 * @returns The dialog, portalled to the body.
 */
function OpenImageLightbox({
  src,
  alt,
  onClose,
  closeLabel,
  downloadHref,
  downloadName,
  downloadLabel = 'Download',
  onDownload,
}: OpenImageLightboxProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    // Whatever held focus gets it back: the tile, or the control that opened this.
    const active = document.activeElement
    const returnFocus = active instanceof HTMLElement && active !== document.body ? active : null
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }
    closeRef.current?.focus()
    return () => {
      // Closed natively first: while the dialog is modal the rest of the page
      // is inert, and focus could not go back to it.
      if (dialog?.open) dialog.close()
      if (returnFocus?.isConnected) returnFocus.focus()
    }
  }, [])

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDialogElement>) => {
    // Every key stops here, so a handler on the page behind never sees one.
    event.stopPropagation()
    if (event.key === 'Escape') {
      if (event.nativeEvent.isComposing) return
      // Handled here rather than left to the browser, so every engine closes
      // the same way and one press closes one layer.
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    // The controls are all links and buttons, so these are the Tab stops. A
    // browser's own Tab can leave a dialog for its chrome; wrapping here keeps
    // focus on the picture's controls whatever the engine does.
    const controls = event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    )
    const first = controls[0]
    const last = controls[controls.length - 1]
    // Shift+Tab on the first control goes to the last; Tab on the last, to the first.
    const [from, to] = event.shiftKey ? [first, last] : [last, first]
    if (!from || document.activeElement !== from) return
    event.preventDefault()
    to.focus()
  }

  const onClick = (event: ReactMouseEvent<HTMLDialogElement>) => {
    // The dialog is portalled, but React still bubbles its events through the
    // caller's ancestors: a menu, a row or a form around the lightbox must not
    // see a click meant for the picture.
    event.stopPropagation()
    // Beside the picture: the stage's own margin, or the dialog behind it.
    if (event.target === event.currentTarget || event.target === stageRef.current) onClose()
  }

  // The browser's own close request — a back gesture, or an Escape that
  // reached it — is a close too.
  const onCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()
    onClose()
  }

  const buttonClass = 'rounded-full bg-muted/80'

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-label={alt}
      onKeyDown={onKeyDown}
      onClick={onClick}
      onCancel={onCancel}
      className="fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none border-0 bg-background/95 p-0 text-foreground"
    >
      <div
        ref={stageRef}
        data-part="stage"
        className="flex h-full w-full items-center justify-center p-4 pt-14"
      >
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
        />
      </div>
      <div className="absolute right-3 top-3 flex gap-1">
        {downloadHref ? (
          // `download={undefined}` would cancel the attribute the link sets itself.
          <DownloadLink
            label={downloadLabel}
            href={downloadHref}
            {...(downloadName ? { download: downloadName } : {})}
            className={buttonClass}
          />
        ) : onDownload ? (
          <DownloadButton
            label={downloadLabel}
            onClick={() => onDownload()}
            className={buttonClass}
          />
        ) : null}
        {/* Not RemoveButton: closing a view takes nothing away, so no danger tint. */}
        <IconButton
          ref={closeRef}
          icon={<XIcon />}
          label={closeLabel}
          onClick={() => onClose()}
          className={buttonClass}
        />
      </div>
    </dialog>,
    document.body,
  )
}

/**
 * One picture at full view, in a modal dialog.
 *
 * A native modal `<dialog>` rather than a hand-rolled overlay: the browser makes
 * the rest of the page inert and puts the dialog in the top layer, above any
 * stacking context the page sits in. It fills the viewport on the page's own
 * tokens, so the light and dark themes follow, and the picture is contained: it
 * shrinks to fit and never crops or upscales past its size.
 *
 * Focus starts on Close and goes back to whatever held it, the tile that opened
 * the picture, when the dialog closes or unmounts. Escape, focus and the Tab
 * trap are handled here by hand and not left to the browser: happy-dom does not
 * implement them, and a browser's Tab can leave a dialog for its own chrome.
 * Escape and a click beside the picture close it; a click on the picture does not.
 *
 * Its events stop at the dialog. It is portalled to the body, but React still
 * bubbles its events through the caller's ancestors, so without this an Escape
 * or a click would also reach the menu, row or panel around the lightbox. One
 * press closes one layer, as in `Menu` and `PurposeBar`.
 *
 * `src` is an object URL (or a data URL) the caller makes, owns and revokes; the
 * lightbox fetches nothing. The caller owns `open`: it is false until a tile's
 * `onOpen` sets it, and `onClose` should clear it.
 *
 * @param props - `open`, `src`, `alt`, `onClose` and `closeLabel` are required;
 *   `downloadHref` with `downloadName` adds a download link, `onDownload` a button.
 * @returns The dialog while `open`, otherwise nothing.
 */
export function ImageLightbox({ open, ...props }: ImageLightboxProps): ReactElement | null {
  return open ? <OpenImageLightbox {...props} /> : null
}
ImageLightbox.displayName = 'ImageLightbox'
