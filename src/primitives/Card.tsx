import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../cn'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-border bg-muted/30 p-4', className)}
      {...props}
    />
  ),
)
Card.displayName = 'Card'
