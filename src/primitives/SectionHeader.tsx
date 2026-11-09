import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../cn'

export interface SectionHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Section heading. Omit for a caption-only row, e.g. a list's count. */
  title?: ReactNode
  /** Muted line under the title, or the row's only text when there is no title. */
  caption?: ReactNode
  /** Quiet controls on the right: icon actions, or a `ghost sm` button where no icon fits. */
  actions?: ReactNode
  /** `2` (default) for a card or section, `3` for a subsection inside one. */
  level?: 2 | 3
  /** `id` on the heading, so a region can name itself with `aria-labelledby`. */
  titleId?: string
}

/** Whether a slot has anything to render; `cond && <X/>` passes `false`. */
const filled = (node: ReactNode) => node != null && node !== false && node !== ''

/**
 * The one header row every block uses: title and caption on the left, the
 * block's actions on the right.
 *
 * Actions stay right-aligned when the row wraps on a narrow screen (`ml-auto`).
 * Filled buttons do not belong here — a block's commit actions go in an
 * `ActionBar` at its foot. Renders a `<div>`, never `<header>`: outside `<main>`
 * a `<header>` becomes a banner landmark, which the app chrome already owns.
 *
 * @param props - `title`, `caption`, `actions`, `level` and `titleId`, plus div props.
 * @returns The header row, or nothing when every slot is empty.
 */
export function SectionHeader({
  title,
  caption,
  actions,
  level = 2,
  titleId,
  className,
  ...props
}: SectionHeaderProps) {
  const hasText = filled(title) || filled(caption)
  if (!hasText && !filled(actions)) return null
  const Heading = level === 3 ? 'h3' : 'h2'
  // Actions centre on the title's first line: a 32px button against a 28px (h2)
  // or 20px (h3) line is pulled up by half the difference.
  const hasTitle = filled(title)
  const pull = hasTitle ? (level === 3 ? '-mt-1.5' : '-mt-0.5') : undefined
  return (
    <div
      className={cn(
        'flex flex-wrap gap-x-3 gap-y-2',
        hasTitle ? 'items-start' : 'items-center',
        className,
      )}
      {...props}
    >
      {hasText && (
        <div className="min-w-0 grow basis-40">
          {filled(title) && (
            <Heading
              id={titleId}
              className={
                level === 3 ? 'text-sm font-semibold' : 'text-lg font-semibold text-primary'
              }
            >
              {title}
            </Heading>
          )}
          {filled(caption) && (
            <div className={cn('text-muted-foreground', level === 3 ? 'text-xs' : 'text-sm')}>
              {caption}
            </div>
          )}
        </div>
      )}
      {filled(actions) && (
        <div className={cn('ml-auto flex shrink-0 items-center gap-1', pull)}>{actions}</div>
      )}
    </div>
  )
}
