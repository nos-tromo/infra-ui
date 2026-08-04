import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional tile heading, rendered accent-colored above the body. */
  title?: ReactNode
  /** Interactive tiles signal affordance with a hover-accent border. */
  interactive?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, interactive, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border bg-muted p-4',
        interactive && 'transition-colors hover:border-primary',
        className,
      )}
      {...props}
    >
      {title != null && <div className="text-lg font-semibold text-primary">{title}</div>}
      {children}
    </div>
  ),
)
Card.displayName = 'Card'
