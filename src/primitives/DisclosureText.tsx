import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../cn'

export interface DisclosureTextProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-expanded' | 'aria-controls'> {
  /** Whether the section this opens is open. Drives `aria-expanded`. */
  expanded: boolean
  /** `id` of the element this reveals, wired to `aria-controls`. */
  controls?: string
  /** The words the user clicks. They are the control's accessible name, so they say what opens. */
  children: ReactNode
}

/**
 * Show or hide what these words stand for: the steps behind a chat answer,
 * the code one step ran.
 *
 * The words are the button, with no chevron beside them. A line of this kind
 * sits inside running text, where a caret at the far edge would be a second
 * control for one gesture and a second tab stop. It takes the surrounding
 * colour (usually muted), brightens to the foreground on hover, and draws the
 * focus ring around the words. `aria-expanded` carries the state; the name
 * stays the words, which do not swap with it.
 *
 * Use {@link DisclosureButton} instead where the row has a title of its own
 * and the control sits at its far edge: a card, a report section, a search hit.
 *
 * @param props - `expanded` is required; `controls` names the revealed element.
 * @returns The disclosure, drawn as its text.
 */
export const DisclosureText = forwardRef<HTMLButtonElement, DisclosureTextProps>(
  ({ expanded, controls, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      className={cn(
        'max-w-full cursor-pointer break-words rounded-sm text-left transition-colors hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className,
      )}
      {...props}
    />
  ),
)
DisclosureText.displayName = 'DisclosureText'
