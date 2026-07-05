import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../cn'
import { Button } from './Button'

export interface HoverIconActionProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The glyph to render. Passed as a node so the design system stays icon-library-agnostic. */
  icon: ReactNode
  /** Accessible name — drives both `aria-label` and `title`. Required (there is no text child). */
  label: string
}

/**
 * A ghost, square icon button that stays visually quiet until needed: it is
 * `opacity-0` until an ancestor marked `.group` is hovered or focus-within, or
 * the button itself receives keyboard focus. The consumer owns the `.group`
 * marker and the button's positioning.
 */
export const HoverIconAction = forwardRef<HTMLButtonElement, HoverIconActionProps>(
  ({ icon, label, className, ...props }, ref) => (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="sm"
      aria-label={label}
      title={label}
      className={cn(
        'aspect-square px-0 opacity-0 transition-opacity',
        'group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100',
        className,
      )}
      {...props}
    >
      {icon}
    </Button>
  ),
)
HoverIconAction.displayName = 'HoverIconAction'
