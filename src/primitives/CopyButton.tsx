import { forwardRef, useEffect, useRef, useState } from 'react'
import { Button, type ButtonProps } from './Button'
import { cn } from '../cn'

export interface CopyButtonProps
  extends Omit<ButtonProps, 'children' | 'onClick' | 'aria-label' | 'title'> {
  /** Text written to the clipboard on click. */
  text: string
  /** Accessible label in the idle state. */
  label?: string
  /** Accessible label shown briefly after a successful copy. */
  copiedLabel?: string
  /** How long the copied state persists before reverting, in milliseconds. */
  resetDelayMs?: number
}

/**
 * Icon-only button that copies `text` to the clipboard and briefly swaps to a
 * check glyph for confirmation. The visible affordance is an icon; the label is
 * exposed to assistive tech via `aria-label`/`title`.
 */
export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      text,
      label = 'Copy',
      copiedLabel = 'Copied',
      resetDelayMs = 1500,
      variant = 'ghost',
      size = 'sm',
      className,
      ...props
    },
    ref,
  ) => {
    const [copied, setCopied] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Clear the revert timer on unmount so we never setState after teardown.
    useEffect(
      () => () => {
        if (timerRef.current !== null) clearTimeout(timerRef.current)
      },
      [],
    )

    async function copy() {
      if (!navigator.clipboard?.writeText) return
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setCopied(false)
        timerRef.current = null
      }, resetDelayMs)
    }

    const currentLabel = copied ? copiedLabel : label

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        aria-label={currentLabel}
        title={currentLabel}
        onClick={() => void copy()}
        className={cn('aspect-square px-0', className)}
        {...props}
      >
        {copied ? <CheckGlyph /> : <CopyGlyph />}
      </Button>
    )
  },
)
CopyButton.displayName = 'CopyButton'

/** Lucide "copy" glyph — two overlapping rounded squares. */
function CopyGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="8" y="8" width="14" height="14" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

/** Lucide "check" glyph, shown briefly after a successful copy. */
function CheckGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
