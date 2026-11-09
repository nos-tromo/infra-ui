import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../cn'
import { SectionHeader } from './SectionHeader'

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Tile heading, an accent `h2` (or `h3` via `titleLevel`) on the card's header row. */
  title?: ReactNode
  /** Muted line under the title. */
  caption?: ReactNode
  /** Quiet controls on the right of the header row (icon actions). */
  actions?: ReactNode
  /** `id` on the heading, for a region that names itself with `aria-labelledby`. */
  titleId?: string
  /** Heading level of `title`; `2` by default. */
  titleLevel?: 2 | 3
  /** Interactive tiles signal affordance with a hover-accent border. */
  interactive?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { className, title, caption, actions, titleId, titleLevel, interactive, children, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border bg-muted p-4',
        interactive && 'transition-colors hover:border-primary',
        className,
      )}
      {...props}
    >
      <SectionHeader
        className="mb-4"
        title={title}
        caption={caption}
        actions={actions}
        level={titleLevel ?? 2}
        titleId={titleId}
      />
      {children}
    </div>
  ),
)
Card.displayName = 'Card'
