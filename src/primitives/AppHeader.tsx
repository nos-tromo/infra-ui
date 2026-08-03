import { type HTMLAttributes } from 'react'
import { cn } from '../cn'
import { useTheme } from '../theme/useTheme'

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

// Inline SVGs instead of Unicode glyphs (◐ ☀ ☾): glyph size for those
// codepoints depends on the platform's fallback font (tiny in DejaVu Sans on
// Linux, large on macOS), so only fixed geometry renders the same everywhere.
const ICON_PROPS = {
  viewBox: '0 0 16 16',
  className: 'h-4 w-4',
  'aria-hidden': true,
} as const

const MODE_ICON = {
  system: (
    <svg {...ICON_PROPS}>
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1.75a6.25 6.25 0 0 0 0 12.5Z" fill="currentColor" />
    </svg>
  ),
  light: (
    <svg {...ICON_PROPS}>
      <circle cx="8" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 .75v2.5M8 12.75v2.5M.75 8h2.5M12.75 8h2.5M2.87 2.87l1.77 1.77M11.36 11.36l1.77 1.77M13.13 2.87l-1.77 1.77M4.64 11.36l-1.77 1.77"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  dark: (
    <svg {...ICON_PROPS}>
      <path
        d="M13.54 9.83A6.25 6.25 0 1 1 6.17 2.46a5 5 0 0 0 7.37 7.37Z"
        fill="currentColor"
      />
    </svg>
  ),
} as const

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
  const { mode, cycle } = useTheme()
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
      <button
        type="button"
        onClick={cycle}
        aria-label={`Theme: ${themeLabels[mode]}`}
        title={`Theme: ${themeLabels[mode]}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[--radius] text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {MODE_ICON[mode]}
      </button>
    </header>
  )
}
