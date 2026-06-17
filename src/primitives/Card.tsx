import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../cn'

export type CardProps = HTMLAttributes<HTMLDivElement>

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-border bg-muted/30 p-4', className)}
      {...props}
    />
  ),
)
Card.displayName = 'Card'
