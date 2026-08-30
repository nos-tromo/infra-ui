import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../cn'
import { button } from './Button'

export interface ToggleButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, Pick<VariantProps<typeof button>, 'size'> {
  /** Whether the option is on. Controlled — the caller owns the flip. */
  pressed: boolean
}

/**
 * A labelled option that is on or off, and says which by its colour.
 *
 * A checkbox spends its width on a box and puts the answer in a mark small
 * enough to hunt for; this fills with the app's accent instead, so a row of
 * options reads as a set of lit and unlit panels at a glance. The two states
 * are the `Button` recipe's `primary` and `secondary` variants, so a selected
 * toggle is pixel-identical to the form's submit button and the focus ring,
 * disabled treatment and colour transition all come from the same place.
 *
 * The state is a required prop and the component holds none of its own: what
 * is selected is the caller's data, not this button's business.
 *
 * The label must say what the option *is* — "Summary", not "Add summary" or
 * "Remove summary". `aria-pressed` is what carries on-ness to a screen reader,
 * and a name that swaps with the state would announce the change twice and
 * disagree with the colour. (That is the opposite of `DisclosureButton`, whose
 * label names the next click because a disclosure has no persistent identity.)
 *
 * @param props - Native `<button>` props, plus `pressed` and the `Button` size.
 * @returns A toggle button rendered as a real `<button>` with `aria-pressed`.
 */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ pressed, size, className, ...props }, ref) => (
    <button
      ref={ref}
      // Never a submit: these sit inside forms, and a click means "choose
      // this option", never "send the form".
      type="button"
      aria-pressed={pressed}
      className={cn(button({ variant: pressed ? 'primary' : 'secondary', size }), className)}
      {...props}
    />
  ),
)
ToggleButton.displayName = 'ToggleButton'
