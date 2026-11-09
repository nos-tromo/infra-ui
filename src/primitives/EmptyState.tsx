import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../cn'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** The one labelled primary action that creates the block's first item. */
  action?: ReactNode
}

/**
 * What a block shows while it has nothing in it: a short message, centred in
 * a dashed box, and at most one labelled action that says what it will make.
 *
 * Use it only where empty can actually happen; a view that is never empty
 * needs no placeholder.
 *
 * @param props - `children` is the message; `action` the call to action.
 * @returns The empty state.
 */
export function EmptyState({ action, className, children, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center',
        className,
      )}
      {...props}
    >
      <div className="text-sm text-muted-foreground">{children}</div>
      {action}
    </div>
  )
}
