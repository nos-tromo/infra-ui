import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../cn'

/**
 * The foot of a block: the actions that commit its work — submit, apply,
 * discard, start.
 *
 * Runs the block's full width and shares it evenly, so the buttons line up
 * with the edges of what they act on instead of trailing off to one side.
 * Order the children with the primary last; the rest are `secondary`, never
 * `ghost`, which reads as plain text in a row of buttons. A label too long for
 * its share wraps the bar rather than being squeezed. Each child must be the
 * button itself (or a fragment of them), since the sizing applies to direct
 * children.
 *
 * @param props - The buttons, plus div props.
 * @returns The action bar.
 */
export const ActionBar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-wrap gap-2 *:flex-[1_1_8rem] *:whitespace-nowrap', className)}
      {...props}
    />
  ),
)
ActionBar.displayName = 'ActionBar'
