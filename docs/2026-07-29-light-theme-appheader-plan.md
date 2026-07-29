# Light Theme + AppHeader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@infra/ui` v0.6.0 with a WCAG-AA light theme (OS-preference default, tri-state override) and an AppHeader primitive (back-to-portal, title, identity, theme toggle), then adopt it in the four app frontends and the edge-plane portal.

**Architecture:** CSS-variable override — `@theme` keeps the semantic token names; light values become the `:root` defaults, dark values move to `:root[data-theme='dark']` plus a `prefers-color-scheme` block for the unset state. A headless `useTheme` hook owns the `infra-ui-theme` localStorage contract; AppHeader consumes it. Primitives don't change (semantic tokens only). Design: `docs/2026-07-29-light-theme-appheader-design.md`.

**Tech Stack:** React 19, Tailwind v4, cva/clsx/tailwind-merge, tsup, vitest (+ @testing-library/react for component tests, jsdom); app repos: Vite + pnpm + `make verify`; portal: vanilla JS in a Caddy-templated static file.

## Global Constraints

- localStorage key `infra-ui-theme`; values `'light'` | `'dark'`; **absent = follow system**. Nothing outside `useTheme` (and the portal's vanilla copy) touches the key or `data-theme`.
- Contrast bar: WCAG AA — ratio ≥ 4.5 for `foreground`, `muted-foreground`, `danger` against both `background` and `muted`, in BOTH palettes, enforced by test.
- Committed-`dist/` rule: any `src/` change ⇒ `pnpm build` + commit `dist/` in the same commit.
- Semantic tokens only in primitives — never raw Tailwind palette colors.
- infra-ui repo work happens on branch `feature/light-theme-appheader`; app/portal work on a fresh `feature/appheader-light-theme` branch per repo. Never push without the task saying so.
- Chores ride along: every repo's README/CLAUDE.md claims made stale by a task are fixed in that task.
- No real data or local dev-machine filepaths in any commit.
- infra-ui validation: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

---

### Task 1: Dual-palette tokens + contrast test

**Files:**
- Modify: `src/theme.css`
- Modify: `src/theme.test.ts`
- Create: `src/contrast.test.ts`
- Modify: `dist/*` (rebuild)

**Interfaces:**
- Produces: `theme.css` with light `:root` defaults and dark overrides under `:root[data-theme='dark']` and `@media (prefers-color-scheme: dark) { :root:not([data-theme]) … }`. Token names unchanged. Later tasks rely on exactly the attribute `data-theme` on `<html>`.

- [ ] **Step 1: Write the failing contrast test**

`src/contrast.test.ts` — parses both palettes out of `theme.css` and computes WCAG ratios:

```ts
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const css = readFileSync(fileURLToPath(new URL('./theme.css', import.meta.url)), 'utf8')

/** Extract `--name: hsl(H S% L%)` declarations from a CSS block. */
function tokens(block: string): Record<string, [number, number, number]> {
  const out: Record<string, [number, number, number]> = {}
  for (const m of block.matchAll(/(--[\w-]+):\s*hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/g)) {
    out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])]
  }
  return out
}

function hslToRgb([h, s, l]: [number, number, number]): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0), f(8), f(4)]
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(a: [number, number, number], b: [number, number, number]): number {
  const [l1, l2] = [luminance(hslToRgb(a)), luminance(hslToRgb(b))].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** The :root light block is everything before the first dark selector. */
const lightBlock = css.slice(0, css.indexOf("[data-theme='dark']"))
const darkBlock = css.slice(css.indexOf("[data-theme='dark']"))

const PAIRS: Array<[string, string]> = [
  ['--color-foreground', '--color-background'],
  ['--color-foreground', '--color-muted'],
  ['--color-muted-foreground', '--color-background'],
  ['--color-muted-foreground', '--color-muted'],
  ['--color-danger', '--color-background'],
  ['--color-danger', '--color-muted'],
]

for (const [name, block] of [
  ['light', lightBlock],
  ['dark', darkBlock],
] as const) {
  describe(`${name} palette`, () => {
    const t = tokens(block)
    test.each(PAIRS)('%s on %s meets WCAG AA (>= 4.5)', (fg, bg) => {
      expect(t[fg]).toBeDefined()
      expect(t[bg]).toBeDefined()
      expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5)
    })
  })
}
```

- [ ] **Step 2: Run it — must fail** (`pnpm vitest run src/contrast.test.ts`; fails: no dark selector / light tokens yet).

- [ ] **Step 3: Rewrite `src/theme.css`**

```css
@theme {
  /* semantic family neutrals — LIGHT defaults; dark overrides below.
     WCAG AA pairs enforced by src/contrast.test.ts — adjust L values
     minimally if a pair fails, never rename tokens. */
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(240 6% 10%);
  --color-muted: hsl(240 5% 96%);
  --color-muted-foreground: hsl(240 4% 38%);
  --color-border: hsl(240 5% 84%);
  --color-accent: hsl(240 5% 90%);
  --color-danger: hsl(0 72% 40%);

  /* the ONE per-app knob — falls back to the family blue if unset */
  --color-primary: var(--app-accent, hsl(217 91% 60%));
  --color-primary-foreground: hsl(0 0% 100%);

  /* type + shape */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  --radius: 0.5rem;
}

/* Dark palette — explicit choice via data-theme (set by useTheme /
   the FOUC snippet), or OS preference when no explicit choice is set.
   The two blocks below must stay value-identical. */
:root[data-theme='dark'] {
  --color-background: hsl(240 6% 8%);
  --color-foreground: hsl(0 0% 98%);
  --color-muted: hsl(240 4% 16%);
  --color-muted-foreground: hsl(240 5% 68%);
  --color-border: hsl(240 4% 22%);
  --color-accent: hsl(240 5% 26%);
  --color-danger: hsl(0 72% 58%);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --color-background: hsl(240 6% 8%);
    --color-foreground: hsl(0 0% 98%);
    --color-muted: hsl(240 4% 16%);
    --color-muted-foreground: hsl(240 5% 68%);
    --color-border: hsl(240 4% 22%);
    --color-accent: hsl(240 5% 26%);
    --color-danger: hsl(0 72% 58%);
  }
}
```

(`muted-foreground` 65%→68% and `danger` 55%→58% are deliberate nudges — the old dark values sit near the AA line; the test is the arbiter. If a pair still fails, adjust that token's lightness by the smallest step that passes and note it in the commit body.)

- [ ] **Step 4: Update `src/theme.test.ts`** — keep the token-presence and accent-hook tests; add:

```ts
test('dark palette exists under both the data-theme attribute and the media fallback', () => {
  expect(css).toContain(":root[data-theme='dark']")
  expect(css).toContain(':root:not([data-theme])')
})

test('attribute and media dark blocks are value-identical', () => {
  const attr = css.slice(css.indexOf(":root[data-theme='dark']"), css.indexOf('@media'))
  const media = css.slice(css.indexOf('@media'))
  const decls = (s: string) => [...s.matchAll(/--[\w-]+:\s*[^;]+;/g)].map((m) => m[0]).sort()
  expect(decls(media)).toEqual(decls(attr))
})
```

- [ ] **Step 5: Full check** — `pnpm test && pnpm typecheck && pnpm lint`; all green. `pnpm demo` and eyeball both themes (flip `data-theme` in devtools).

- [ ] **Step 6: Build + commit**

```bash
pnpm build
git add src/theme.css src/theme.test.ts src/contrast.test.ts dist/
git commit -m "feat: dual light/dark palette — light default, AA-enforced by test"
```

---

### Task 2: `useTheme` hook

**Files:**
- Create: `src/theme/useTheme.ts`
- Create: `src/theme/useTheme.test.tsx`
- Modify: `src/index.ts`
- Modify: `dist/*` (rebuild)

**Interfaces:**
- Produces: `useTheme(): { mode: 'light' | 'dark' | 'system'; resolved: 'light' | 'dark'; cycle: () => void }`, export `THEME_STORAGE_KEY = 'infra-ui-theme'`. Task 3's AppHeader consumes exactly this.

- [ ] **Step 1: Write the failing tests**

`src/theme/useTheme.test.tsx`:

```tsx
import { renderHook, act } from '@testing-library/react'
import { useTheme, THEME_STORAGE_KEY } from './useTheme'

function mockMatchMedia(prefersDark: boolean) {
  const listeners = new Set<(e: { matches: boolean }) => void>()
  const mql = {
    matches: prefersDark,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.delete(fn),
    fire(matches: boolean) {
      this.matches = matches
      listeners.forEach((fn) => fn({ matches }))
    },
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))
  return mql
}

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  vi.unstubAllGlobals()
})

test('defaults to system and resolves from prefers-color-scheme', () => {
  mockMatchMedia(true)
  const { result } = renderHook(() => useTheme())
  expect(result.current.mode).toBe('system')
  expect(result.current.resolved).toBe('dark')
  expect(document.documentElement.dataset.theme).toBeUndefined()
})

test('cycle steps system -> light -> dark -> system, stamping and persisting', () => {
  mockMatchMedia(false)
  const { result } = renderHook(() => useTheme())
  act(() => result.current.cycle())
  expect(result.current.mode).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  act(() => result.current.cycle())
  expect(result.current.mode).toBe('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  act(() => result.current.cycle())
  expect(result.current.mode).toBe('system')
  expect(document.documentElement.dataset.theme).toBeUndefined()
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
})

test('reads a persisted explicit choice on mount', () => {
  mockMatchMedia(true)
  localStorage.setItem(THEME_STORAGE_KEY, 'light')
  const { result } = renderHook(() => useTheme())
  expect(result.current.mode).toBe('light')
  expect(result.current.resolved).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')
})

test('in system mode, follows OS preference changes', () => {
  const mql = mockMatchMedia(false)
  const { result } = renderHook(() => useTheme())
  expect(result.current.resolved).toBe('light')
  act(() => mql.fire(true))
  expect(result.current.resolved).toBe('dark')
})

test('reacts to cross-tab storage events', () => {
  mockMatchMedia(false)
  const { result } = renderHook(() => useTheme())
  act(() => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'dark' }))
  })
  expect(result.current.mode).toBe('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
})
```

If `@testing-library/react` is not yet a devDependency, add it (`pnpm add -D @testing-library/react`) — check first; the component tests may already use it.

- [ ] **Step 2: Run — must fail** (`pnpm vitest run src/theme/useTheme.test.tsx`, module not found).

- [ ] **Step 3: Implement `src/theme/useTheme.ts`**

```ts
import { useCallback, useEffect, useState } from 'react'

export const THEME_STORAGE_KEY = 'infra-ui-theme'

export type ThemeMode = 'light' | 'dark' | 'system'

function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function systemPrefersDark(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
}

function apply(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'system') delete root.dataset.theme
  else root.dataset.theme = mode
}

/**
 * Owns the federation theme contract: localStorage `infra-ui-theme`
 * ('light' | 'dark'; absent = follow the OS), mirrored to `data-theme`
 * on <html>. Nothing else may touch the key or the attribute.
 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readMode)
  const [osDark, setOsDark] = useState(systemPrefersDark)

  useEffect(() => {
    apply(mode)
  }, [mode])

  useEffect(() => {
    const mql = matchMedia('(prefers-color-scheme: dark)')
    const onMedia = (e: { matches: boolean }) => setOsDark(e.matches)
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) setMode(readMode())
    }
    mql.addEventListener('change', onMedia)
    window.addEventListener('storage', onStorage)
    return () => {
      mql.removeEventListener('change', onMedia)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const cycle = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system'
      try {
        if (next === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
        else localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        /* storage unavailable — in-memory only */
      }
      return next
    })
  }, [])

  const resolved: 'light' | 'dark' = mode === 'system' ? (osDark ? 'dark' : 'light') : mode
  return { mode, resolved, cycle }
}
```

- [ ] **Step 4: Export** — append to `src/index.ts`:

```ts
export { useTheme, THEME_STORAGE_KEY, type ThemeMode } from './theme/useTheme'
```

- [ ] **Step 5: Run — must pass**, then `pnpm test && pnpm typecheck && pnpm lint`.

- [ ] **Step 6: Build + commit**

```bash
pnpm build
git add src/theme src/index.ts dist/ package.json pnpm-lock.yaml
git commit -m "feat: useTheme — tri-state theme contract (system default)"
```

---

### Task 3: AppHeader primitive

**Files:**
- Create: `src/primitives/AppHeader.tsx`
- Create: `src/primitives/AppHeader.test.tsx`
- Modify: `src/index.ts`
- Modify: `README.md` (component list + consumer docs: FOUC snippet)
- Modify: `CLAUDE.md` (primitive set line; "dark, minimal" wording → "light/dark, minimal")
- Modify: `dist/*` (rebuild)

**Interfaces:**
- Consumes: `useTheme` from Task 2.
- Produces: `AppHeader` + `AppHeaderProps { title: string; user?: string; homeHref?: string; homeLabel?: string; themeLabels?: { system: string; light: string; dark: string } }`. Adoption tasks mount exactly this.

- [ ] **Step 1: Write the failing tests**

`src/primitives/AppHeader.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { AppHeader } from './AppHeader'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

test('renders home link, title, and user', () => {
  render(<AppHeader title="docint" user="jane.doe" />)
  const home = screen.getByRole('link', { name: /apps/i })
  expect(home).toHaveAttribute('href', '/')
  expect(screen.getByText('docint')).toBeInTheDocument()
  expect(screen.getByText('jane.doe')).toBeInTheDocument()
})

test('hides the user block when user is absent', () => {
  render(<AppHeader title="docint" />)
  expect(screen.queryByTestId('appheader-user')).not.toBeInTheDocument()
})

test('theme toggle cycles and reflects the mode in its accessible name', () => {
  render(<AppHeader title="docint" />)
  const btn = screen.getByRole('button', { name: /system/i })
  fireEvent.click(btn)
  expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument()
  expect(document.documentElement.dataset.theme).toBe('light')
})

test('honors homeHref, homeLabel, and themeLabels overrides', () => {
  render(
    <AppHeader
      title="t"
      homeHref="/portal/"
      homeLabel="Übersicht"
      themeLabels={{ system: 'System', light: 'Hell', dark: 'Dunkel' }}
    />,
  )
  expect(screen.getByRole('link', { name: 'Übersicht' })).toHaveAttribute('href', '/portal/')
  expect(screen.getByRole('button', { name: /System/ })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run — must fail.**

- [ ] **Step 3: Implement `src/primitives/AppHeader.tsx`**

```tsx
import { type HTMLAttributes } from 'react'
import { cn } from '../cn'
import { useTheme } from '../theme/useTheme'

export interface AppHeaderProps extends HTMLAttributes<HTMLElement> {
  /** App display name, rendered next to the home link. */
  title: string
  /** Signed-in user; block is omitted entirely when absent (e.g. standalone dev). */
  user?: string
  /** Portal URL; the gateway serves the portal at the origin root. */
  homeHref?: string
  /** i18n hook for the home link text. */
  homeLabel?: string
  /** i18n hook for the toggle's accessible names, keyed by mode. */
  themeLabels?: { system: string; light: string; dark: string }
}

const MODE_ICON = { system: '◐', light: '☀', dark: '☾' } as const

export function AppHeader({
  title,
  user,
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
      <a
        href={homeHref}
        className="inline-flex items-center gap-1.5 rounded-[--radius] px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <span aria-hidden>←</span>
        {homeLabel}
      </a>
      <span className="text-sm font-semibold">{title}</span>
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
        <span aria-hidden>{MODE_ICON[mode]}</span>
      </button>
    </header>
  )
}
```

- [ ] **Step 4: Export** — `src/index.ts`:

```ts
export { AppHeader, type AppHeaderProps } from './primitives/AppHeader'
```

- [ ] **Step 5: Docs.** README: add AppHeader to the component list; add a "Theming" consumer section documenting the tri-state contract and this REQUIRED pre-bundle FOUC snippet for `index.html`:

```html
<script>
  /* infra-ui theme: stamp explicit choice before first paint (FOUC guard) */
  ;(function () {
    try {
      var t = localStorage.getItem('infra-ui-theme')
      if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t
    } catch (e) {}
  })()
</script>
```

CLAUDE.md: primitive set line gains `AppHeader`; reword "dark, minimal UI primitives" → "light/dark themeable, minimal UI primitives (OS-preference default)".

- [ ] **Step 6: Run everything** — `pnpm test && pnpm typecheck && pnpm lint`; `pnpm demo` visual pass (header renders, toggle flips live in both directions).

- [ ] **Step 7: Build + commit**

```bash
pnpm build
git add src/primitives/AppHeader.tsx src/primitives/AppHeader.test.tsx src/index.ts README.md CLAUDE.md dist/
git commit -m "feat: AppHeader — portal link, identity, tri-state theme toggle"
```

---

### Task 4: Release v0.6.0

**Files:**
- Modify: `package.json` (version 0.5.1 → 0.6.0)
- Modify: `dist/*` (final rebuild)

- [ ] **Step 1:** Set `"version": "0.6.0"` in `package.json`; `pnpm build`; `pnpm test && pnpm typecheck && pnpm lint` all green.
- [ ] **Step 2:** Commit `git add package.json dist/ && git commit -m "release: v0.6.0 — light theme + AppHeader"`; push branch `git push -u origin feature/light-theme-appheader`.
- [ ] **Step 3:** Open the PR to `main` (title `Light theme + AppHeader (v0.6.0)`, body summarizing design §1–3 + the contrast-test guarantee). **STOP after CI is green — the merge and the annotated `v0.6.0` tag on main are the owner's; adoption tasks are blocked until the tag exists.**

---

### Task 5: chorus adoption (+ dashboard nav fix)

**Files (in `../chorus`):**
- Modify: `frontend/package.json` (pin `github:nos-tromo/infra-ui#v0.6.0`) + `pnpm-lock.yaml`
- Modify: `frontend/index.html` (FOUC snippet from Task 3 Step 5, before the module script)
- Modify: the layout that renders the sidebar/topbar (`frontend/src/layout/Shell.tsx`) — mount `<AppHeader title="chorus" user={…} homeLabel={t(...)} themeLabels={…} />` above the existing shell; wire `user` from the app's existing identity/config source (find it: `grep -rn "X-Auth-User\|username\|identity" frontend/src/api frontend/src/config`); remove any now-duplicate identity display.
- Modify: `frontend/src/layout/Sidebar.tsx` — add the missing nav entry for the Landing/dashboard route (`/`), i18n key in `frontend/src/i18n/` both languages.
- Audit: `grep -rn "hsl(\|#[0-9a-fA-F]\{6\}\|bg-\[\|text-\[" frontend/src | grep -v test` — re-express hardcoded dark colors in tokens or add explicit light variants; check ForceGraph mappers `frontend/src/lib/explorerElements.ts` / `explorerActions.ts` node/edge colors are legible on the light background (adjust to token-derived or dual-lit values where not).
- Accent check: compute the AA ratio of chorus's `--app-accent` on `hsl(0 0% 100%)`; if < 4.5 where used as text, add a light-variant override in the app's root CSS: `:root:not([data-theme='dark']) { --app-accent: <darker variant>; }`.
- Chores: `CLAUDE.md`/README claims about dark-only UI/`@infra/ui#v0.x` pins updated.

**Steps:** branch `feature/appheader-light-theme` → pin bump + `pnpm install` → FOUC snippet → mount header (i18n'd labels) → sidebar entry → audit + fixes → `pnpm test` in `frontend/` + `make verify` → commit(s) (`feat: AppHeader + light theme (infra-ui v0.6.0); dashboard nav entry`) → push → PR. Each app PR body notes: theme default is now OS preference.

### Task 6: docint adoption

Same recipe as Task 5 minus the sidebar fix: pin bump, FOUC snippet, mount `<AppHeader title="docint" …>` in the app shell (locate: `grep -rn "Shell\|Layout" frontend/src/layout frontend/src`), identity wiring, hardcoded-color audit, accent AA check, chores, `pnpm test` + `make verify`, PR.

### Task 7: Nextext adoption

Same recipe, `title="Nextext"`.

### Task 8: translator adoption

Same recipe, `title="translator"`.

---

### Task 9: Portal ride-along (edge-plane)

**Files (in `../edge-plane`):**
- Modify: `landing/index.html`
- Modify: `authcode/index.html` (same dual palette — it duplicates the portal styling)
- Modify: `README.md` (portal description: light/dark note)
- Modify: `scripts/smoke.sh` — no changes expected; must stay green.

- [ ] **Step 1:** Remove the `infra-ui-theme` pre-seed block from the status-probe IIFE in `landing/index.html` (the `if (!localStorage.getItem('infra-ui-theme')) …` lines) — under the OS-default contract it would pin every user to dark.
- [ ] **Step 2:** Split the portal CSS variables into the dual palette, mirroring Task 1's values (portal is build-free; values duplicated by design — add the comment `/* mirrored from infra-ui theme.css — sync manually until tokens are exported (look-and-feel pass) */`). Structure: light values in `:root`, dark under `:root[data-theme='dark']` and `@media (prefers-color-scheme: dark) { :root:not([data-theme]) }`. Keep the portal-specific tokens (`--ok`, `--down`, `--neutral`) legible in both (light: darken `--ok`/`--down` ~10% lightness).
- [ ] **Step 3:** Add the FOUC stamp inline `<script>` in `<head>` (same snippet as Task 3 Step 5).
- [ ] **Step 4:** Add the cycling toggle button to the user section (en+de: `Design: System/Hell/Dunkel` — `Theme: system/light/dark`), vanilla JS mirror of `useTheme.cycle` semantics: read key → cycle system→light→dark→system → set/remove key + `data-theme`; listen for `storage` events and re-stamp. Reuse the page's existing IIFE style.
- [ ] **Step 5:** Apply the same dual palette + FOUC stamp to `authcode/index.html` (no toggle there — it inherits the choice).
- [ ] **Step 6:** Validate: `docker compose --env-file .env -f docker/compose.yaml config --quiet`; `make up-dev`; `EDGE_SMOKE_BASE=https://<EDGE_HOST> ./scripts/smoke.sh` → `SMOKE PASS` (all 7 checks); manual both-themes check of `/` and `/auth-code`.
- [ ] **Step 7:** README sync (chores); commit `feat: portal light theme — OS-preference default, shared tri-state toggle`; push; PR.

---

## Sequencing note

Task 4 is a hard gate: Tasks 5–8 install `#v0.6.0` and fail until the owner merges the infra-ui PR and cuts the tag. Task 9 has no dependency on the tag (vanilla mirror) and may run in parallel with 5–8.
