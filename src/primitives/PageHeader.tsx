import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../cn'

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  /** Route title — exactly one PageHeader (one h1) per route. */
  title: string
  /** One-line muted subtitle under the title. */
  caption?: string
  /**
   * Quiet icon actions on the title row, right-aligned — never a filled
   * button (see components.md § Where actions go).
   */
  actions?: ReactNode
}

export function PageHeader({ title, caption, actions, className, ...props }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)} {...props}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
      {caption && (
        <p data-testid="pageheader-caption" className="mt-1 text-sm text-muted-foreground">
          {caption}
        </p>
      )}
    </div>
  )
}
