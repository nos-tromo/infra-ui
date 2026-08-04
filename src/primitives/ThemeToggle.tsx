import { useTheme } from '../theme/useTheme'

export interface ThemeToggleLabels {
  system: string
  light: string
  dark: string
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

export function ThemeToggle({
  labels = { system: 'system', light: 'light', dark: 'dark' },
}: {
  labels?: ThemeToggleLabels
}) {
  const { mode, cycle } = useTheme()
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${labels[mode]}`}
      title={`Theme: ${labels[mode]}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {MODE_ICON[mode]}
    </button>
  )
}
