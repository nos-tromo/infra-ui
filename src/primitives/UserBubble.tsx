import { type HTMLAttributes } from 'react'
import { cn } from '../cn'

export type UserBubbleProps = HTMLAttributes<HTMLDivElement>

/**
 * One message the user wrote, set apart from the answers: right-aligned, in the
 * app's accent with white text (`bg-bubble`, `text-bubble-foreground`).
 *
 * The bubble is as wide as its text, up to 85% of the column. What goes in it
 * (the text, chips of attached files) and any data attributes are the caller's;
 * something drawn inside reads on the accent with `bubble-foreground` at low
 * opacity, e.g. `border-bubble-foreground/30 bg-bubble-foreground/15`.
 */
export function UserBubble({ className, ...props }: UserBubbleProps) {
  return (
    <div
      className={cn(
        'ml-auto w-fit max-w-[85%] space-y-2 break-words rounded-2xl rounded-br-md bg-bubble px-4 py-2 text-sm text-bubble-foreground',
        className,
      )}
      {...props}
    />
  )
}
