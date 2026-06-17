import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../cn'

const badge = cva('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      neutral: 'bg-muted text-muted-foreground',
      accent: 'bg-primary/15 text-primary',
      danger: 'bg-danger/15 text-danger',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badge({ variant }), className)} {...props} />
}
