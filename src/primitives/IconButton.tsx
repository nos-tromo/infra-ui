import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '../cn'
import { Button, button, type ButtonProps } from './Button'
import { Spinner } from './Spinner'

/**
 * The always-visible icon action, and the base every named action is built on.
 *
 * `HoverIconAction` is the quiet sibling — it hides at `opacity-0` until its
 * row is hovered. This one is always on screen, so it is `ghost` by default:
 * transparent, taking a background only under the pointer. A permanent border
 * and fill would make a toolbar of these read as a row of loud chips beside the
 * quiet icons they sit with.
 *
 * `label` is required and drives both `aria-label` and `title`, because the
 * icon carries no text of its own. `children` is an optional short adornment
 * beside the icon — a format ("CSV"), a count, a caret — for the case where
 * several of these sit side by side and the icon alone cannot tell them apart.
 */
type IconActionShape = {
  /** The icon to render. A node, so this package stays icon-library-agnostic. */
  icon: ReactNode
  /** Accessible name — drives both `aria-label` and `title`. Required. */
  label: string
  /**
   * Tooltip text replacing `label`'s, when there is something extra to say —
   * most often *why* the action is unavailable. The accessible name stays
   * `label`, because a disabled control must still say what it is: swapping the
   * name for the reason leaves a button called "No jobs completed yet".
   */
  hint?: string
  /** Optional short adornment beside the icon: a format, a count, a caret. */
  children?: ReactNode
  /** Tint the icon on hover — for actions that take something away. */
  tone?: 'default' | 'danger'
}

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'title'>,
    IconActionShape {
  /** Swaps the icon for a spinner and blocks further clicks while work is in flight. */
  busy?: boolean
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
}

/**
 * Shared layout for both shapes.
 *
 * @param adorned - Whether an adornment sits beside the icon.
 * @param tone - Hover tint.
 * @param className - Caller overrides, applied last.
 * @returns The merged class string.
 */
function shell(adorned: boolean, tone: 'default' | 'danger', className?: string): string {
  return cn(
    'shrink-0',
    adorned ? 'gap-1.5 px-2.5' : 'aspect-square px-0',
    tone === 'danger' && 'hover:text-danger',
    className,
  )
}

/**
 * An icon action the page performs itself.
 *
 * @param props - `icon` and `label` are required; `busy` swaps in a spinner.
 * @returns The button.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      hint,
      children,
      tone = 'default',
      busy = false,
      disabled,
      variant = 'ghost',
      size = 'sm',
      className,
      ...props
    },
    ref,
  ) => (
    <Button
      ref={ref}
      type="button"
      variant={variant}
      size={size}
      aria-label={label}
      title={hint ?? label}
      aria-busy={busy || undefined}
      // A second click while the first is in flight downloads twice or deletes
      // an already-deleted row; every caller would otherwise re-guard this.
      disabled={disabled || busy}
      className={shell(children != null, tone, className)}
      {...props}
    >
      {busy ? <Spinner className="h-4 w-4" label={label} /> : icon}
      {children}
    </Button>
  ),
)
IconButton.displayName = 'IconButton'

export interface IconLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'aria-label' | 'title'>,
    IconActionShape {
  /** Where the link points. */
  href: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
}

/**
 * An icon action the browser performs — a file the server streams is an anchor,
 * not a button, so it carries the same shell over an `<a>`.
 *
 * @param props - `icon`, `label` and `href` are required.
 * @returns The link, styled as the button it mirrors.
 */
export const IconLink = forwardRef<HTMLAnchorElement, IconLinkProps>(
  (
    {
      icon,
      label,
      hint,
      children,
      tone = 'default',
      variant = 'ghost',
      size = 'sm',
      className,
      ...props
    },
    ref,
  ) => (
    <a
      ref={ref}
      aria-label={label}
      title={hint ?? label}
      className={cn(button({ variant, size }), shell(children != null, tone, className))}
      {...props}
    >
      {icon}
      {children}
    </a>
  ),
)
IconLink.displayName = 'IconLink'
