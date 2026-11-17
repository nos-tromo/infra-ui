import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '../cn'

export interface ChatComposerProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Actions before the text: attach, dictate. */
  start?: ReactNode
  /** Actions after the text: options, then send or stop. */
  end?: ReactNode
  /** Classes for the pill around the text and the actions; `className` styles the textarea. */
  boxClassName?: string
}

/**
 * A chat's message box: one rounded pill holding the actions and the text.
 *
 * The text starts on one line and grows upward as it is written, up to a cap,
 * then scrolls; the actions stay on the bottom line. Buttons inside the pill
 * are drawn round. The ref is the textarea's, and every textarea prop
 * (`value`, `onChange`, `onKeyDown`, `aria-label`, `placeholder`, …) goes to it.
 * Wrap it in the `<form>` that sends, and keep what sits above or below it
 * (chips of attached files, notes, errors) outside.
 */
export const ChatComposer = forwardRef<HTMLTextAreaElement, ChatComposerProps>(
  ({ start, end, boxClassName, className, rows = 1, ...props }, ref) => (
    <div
      className={cn(
        'flex items-end gap-1 rounded-3xl border border-border bg-muted px-2 py-1.5 focus-within:border-primary [&_button]:rounded-full',
        boxClassName,
      )}
    >
      {start !== undefined && <div className="flex shrink-0 items-center gap-1">{start}</div>}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'block max-h-48 min-h-8 min-w-0 flex-1 resize-none self-center bg-transparent px-2 py-1.5 text-sm outline-none field-sizing-content placeholder:text-muted-foreground',
          className,
        )}
        {...props}
      />
      {end !== undefined && <div className="flex shrink-0 items-center gap-1">{end}</div>}
    </div>
  ),
)
ChatComposer.displayName = 'ChatComposer'
