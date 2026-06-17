import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../cn'

const banner = cva('rounded-md border px-4 py-3 text-sm', {
  variants: {
    variant: {
      info: 'border-border bg-muted/40 text-foreground',
      danger: 'border-danger/40 bg-danger/10 text-foreground',
    },
  },
  defaultVariants: { variant: 'info' },
})

export interface BannerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof banner> {}

export function Banner({ className, variant, ...props }: BannerProps) {
  const role = variant === 'danger' ? 'alert' : 'status'
  return <div role={role} className={cn(banner({ variant }), className)} {...props} />
}
