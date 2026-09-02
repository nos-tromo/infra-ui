import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../cn'

/**
 * A native `<select>` in the package's box.
 *
 * @deprecated Prefer `<SelectMenu variant="field" />`, which wears this same
 * box and adds the things a native popup cannot be given: rows that follow the
 * app's accent, headings for grouped options, and a popup that is not sized by
 * the trigger's font. Kept for the one case it still wins — a real form
 * control that submits with the form around it.
 */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Select.displayName = 'Select'
