import { type ReactNode } from 'react'
import { cn } from '../cn'

export interface ShellProps {
  /** Heading rendered on the left of the sticky header. */
  title: ReactNode
  /** Optional right-aligned slot (e.g. a status bar or action buttons). */
  actions?: ReactNode
  /** Page body rendered inside the centered main container. */
  children?: ReactNode
  /** Extra classes merged onto the full-height root wrapper. */
  className?: string
}

/**
 * App shell: a full-height wrapper with a sticky top header (title + optional
 * actions slot) above a centered main content column. The header stays pinned
 * to the top and keeps an opaque `bg-background` so it remains visible — and
 * does not let content bleed through — while the page scrolls.
 */
export function Shell({ title, actions, children, className }: ShellProps) {
  return (
    <div className={cn('min-h-full', className)}>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
        <h1 className="text-lg font-semibold">{title}</h1>
        {actions}
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
