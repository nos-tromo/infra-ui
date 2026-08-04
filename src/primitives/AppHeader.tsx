import { type HTMLAttributes } from 'react'
import { cn } from '../cn'
import { ThemeToggle } from './ThemeToggle'

export interface AppHeaderProps extends HTMLAttributes<HTMLElement> {
  /** App display name, rendered next to the home link. */
  title: string
  /** Signed-in user; block is omitted entirely when absent (e.g. standalone dev). */
  user?: string
  /** App version, rendered muted next to the title; omitted entirely when absent. */
  version?: string
  /** Portal URL; the gateway serves the portal at the origin root. */
  homeHref?: string
  /** i18n hook for the home link text. */
  homeLabel?: string
  /** i18n hook for the toggle's accessible names, keyed by mode. */
  themeLabels?: { system: string; light: string; dark: string }
}

export function AppHeader({
  title,
  user,
  version,
  homeHref = '/',
  homeLabel = 'Apps',
  themeLabels = { system: 'system', light: 'light', dark: 'dark' },
  className,
  ...props
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        'flex h-12 items-center gap-3 border-b border-border bg-background px-4 text-foreground',
        className,
      )}
      {...props}
    >
      <div className="flex items-baseline gap-3">
        <a
          href={homeHref}
          className="inline-flex items-center gap-1.5 rounded-[--radius] px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <span aria-hidden>←</span>
          {homeLabel}
        </a>
        <span className="text-sm font-semibold">{title}</span>
        {version && (
          <span data-testid="appheader-version" className="text-xs text-muted-foreground">
            {version}
          </span>
        )}
      </div>
      <span className="flex-1" />
      {user && (
        <span data-testid="appheader-user" className="text-sm text-muted-foreground">
          {user}
        </span>
      )}
      <ThemeToggle labels={themeLabels} />
    </header>
  )
}
