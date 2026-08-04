# infra-ui v0.9.0 — AppShell / UserMenu / PageHeader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@infra/ui` v0.9.0 — the inset-canvas `AppShell`, `UserMenu`,
`PageHeader`, the portal-aligned `Card`, and the new `--color-chrome` token —
per `docs/2026-08-04-app-shell-federation-design.md`.

**Architecture:** All work is inside this repo. New components follow the
existing primitive pattern (one file + one colocated vitest file, exported
from `src/index.ts`, semantic tokens only). The dead `Shell` layout is
removed; `AppHeader` stays exported for the consumer transition. This is
plan 1 of the federation rollout; per-app plans follow once v0.9.0 is tagged.

**Tech Stack:** React 19, Tailwind v4 tokens, tsup, vitest +
@testing-library/react, pnpm.

## Global Constraints

- Primitives use **semantic tokens only** (`bg-muted`, `border-border`, …) —
  never raw Tailwind palette colors.
- `react`/`react-dom` stay **peer deps**; no new runtime dependencies
  (dropdown is hand-built — no radix/headlessui).
- **Every exported component has a unit test.**
- Dimensional tokens stay pinned to Tailwind defaults; every font-size /
  radius in new code uses `--text-*` / `--radius-*` utilities.
- `dist/` is committed; **the PR must contain a fresh `pnpm build` output**
  (done once in Task 8 — intermediate commits may leave `dist/` stale).
- `dist/tokens.css` is generated — never hand-edited.
- No shadows anywhere; separation is fill + 1px borders.
- Synthetic data only in tests/docs (e.g. user `jane.doe`); no local
  machine paths anywhere git sees.
- Working branch: `feature/app-shell-design` (holds the design doc).

---

### Task 1: `--color-chrome` token + contrast coverage

**Files:**
- Modify: `src/theme.css` (all three palette blocks)
- Modify: `src/contrast.test.ts:39-46` (PAIRS table)

**Interfaces:**
- Produces: CSS custom property `--color-chrome` → Tailwind utilities
  `bg-chrome` etc., light `hsl(240 5% 96%)`, dark `hsl(240 4% 12%)`.
  Consumed by Task 6 (`AppShell`) and later by the edge-plane portal.

- [ ] **Step 1: Sync with origin** (local main is at 0.8.0; v0.8.1 exists)

```bash
git checkout main && git pull
git checkout feature/app-shell-design && git rebase main
```

- [ ] **Step 2: Add the failing contrast pairs**

In `src/contrast.test.ts`, extend `PAIRS`:

```ts
const PAIRS: Array<[string, string]> = [
  ['--color-foreground', '--color-background'],
  ['--color-foreground', '--color-muted'],
  ['--color-foreground', '--color-chrome'],
  ['--color-muted-foreground', '--color-background'],
  ['--color-muted-foreground', '--color-muted'],
  ['--color-muted-foreground', '--color-chrome'],
  ['--color-danger', '--color-background'],
  ['--color-danger', '--color-muted'],
]
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm test src/contrast.test.ts`
Expected: FAIL — `--color-chrome` undefined in both palettes.

- [ ] **Step 4: Declare the token in all three blocks of `src/theme.css`**

In the `@theme` block, after `--color-border`:

```css
  /* shell chrome (AppShell header + sidebar); canvas insets into it */
  --color-chrome: hsl(240 5% 96%);
```

In `:root[data-theme='dark']` **and** the value-identical
`@media (prefers-color-scheme: dark)` block, after `--color-border`:

```css
  --color-chrome: hsl(240 4% 12%);
```

- [ ] **Step 5: Run the full test suite**

Run: `pnpm test`
Expected: contrast PASS; `src/tokens.test.ts` FAIL (committed
`dist/tokens.css` now drifts — expected until the Task 8 rebuild). If
tokens.test compares against `src/theme.css` at runtime and fails, run
`pnpm build` now and include `dist/tokens.css` in this commit instead.

- [ ] **Step 6: Commit**

```bash
git add src/theme.css src/contrast.test.ts
git commit -m "feat(tokens): add --color-chrome for the AppShell frame"
```

---

### Task 2: `Card` aligned to the portal tile

**Files:**
- Modify: `src/primitives/Card.tsx`
- Modify: `src/primitives/Card.test.tsx`

**Interfaces:**
- Produces:
  `CardProps = HTMLAttributes<HTMLDivElement> & { title?: ReactNode; interactive?: boolean }`;
  export `Card`, `type CardProps`. Base classes become
  `rounded-lg border border-border bg-muted p-4` (opaque fill — the portal
  tile), `title` renders an accent heading, `interactive` adds
  `transition-colors hover:border-primary`.

- [ ] **Step 1: Extend the tests**

Replace `src/primitives/Card.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react'
import { Card } from './Card'

test('renders children on an opaque tile surface', () => {
  render(<Card>body</Card>)
  expect(screen.getByText('body')).toHaveClass('rounded-lg', 'bg-muted')
})

test('merges a custom className', () => {
  render(<Card className="p-8">x</Card>)
  expect(screen.getByText('x')).toHaveClass('p-8')
})

test('renders an accent title above the body', () => {
  render(<Card title="Documents">1,284</Card>)
  const heading = screen.getByText('Documents')
  expect(heading).toHaveClass('text-primary', 'font-semibold')
})

test('interactive cards get the hover-accent border', () => {
  render(<Card interactive>x</Card>)
  expect(screen.getByText('x')).toHaveClass('hover:border-primary')
})
```

- [ ] **Step 2: Run to verify the new cases fail**

Run: `pnpm test src/primitives/Card.test.tsx`
Expected: first two PASS-ish (bg-muted assertion fails), last two FAIL.

- [ ] **Step 3: Implement**

Replace `src/primitives/Card.tsx` with:

```tsx
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional tile heading, rendered accent-colored above the body. */
  title?: ReactNode
  /** Interactive tiles signal affordance with a hover-accent border. */
  interactive?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, interactive, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border bg-muted p-4',
        interactive && 'transition-colors hover:border-primary',
        className,
      )}
      {...props}
    >
      {title != null && <div className="text-lg font-semibold text-primary">{title}</div>}
      {children}
    </div>
  ),
)
Card.displayName = 'Card'
```

Note: `title?: ReactNode` shadows the native `title` string attribute —
acceptable; the tooltip use disappears, matching the portal tile anatomy.

- [ ] **Step 4: Export the type from `src/index.ts`**

```ts
export { Card, type CardProps } from './primitives/Card'
```

- [ ] **Step 5: Run tests, then commit**

Run: `pnpm test src/primitives/Card.test.tsx` — Expected: PASS

```bash
git add src/primitives/Card.tsx src/primitives/Card.test.tsx src/index.ts
git commit -m "feat(card): align Card to the portal tile language"
```

---

### Task 3: `PageHeader`

**Files:**
- Create: `src/primitives/PageHeader.tsx`
- Create: `src/primitives/PageHeader.test.tsx`
- Modify: `src/index.ts`

**Interfaces:**
- Produces:
  `PageHeaderProps = { title: string; caption?: string; actions?: ReactNode } & HTMLAttributes<HTMLElement>`;
  export `PageHeader`, `type PageHeaderProps`. Renders
  `h1.text-2xl.font-semibold` + muted `text-sm` caption; `actions` sits
  right-aligned on the title row.

- [ ] **Step 1: Write the failing test** — `src/primitives/PageHeader.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'

test('renders the title as the page h1', () => {
  render(<PageHeader title="Dashboard" />)
  expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
})

test('renders a muted caption when given', () => {
  render(<PageHeader title="Dashboard" caption="Corpus overview" />)
  expect(screen.getByText('Corpus overview')).toHaveClass('text-muted-foreground')
})

test('omits the caption node entirely when absent', () => {
  render(<PageHeader title="Dashboard" />)
  expect(screen.queryByTestId('pageheader-caption')).not.toBeInTheDocument()
})

test('renders actions on the title row', () => {
  render(<PageHeader title="Jobs" actions={<button>New</button>} />)
  expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/primitives/PageHeader.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `src/primitives/PageHeader.tsx`:

```tsx
import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../cn'

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  /** Route title — exactly one PageHeader (one h1) per route. */
  title: string
  /** One-line muted subtitle under the title. */
  caption?: string
  /** Right-aligned controls on the title row (e.g. a primary Button). */
  actions?: ReactNode
}

export function PageHeader({ title, caption, actions, className, ...props }: PageHeaderProps) {
  return (
    <header className={cn('mb-6', className)} {...props}>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
      {caption && (
        <p data-testid="pageheader-caption" className="mt-1 text-sm text-muted-foreground">
          {caption}
        </p>
      )}
    </header>
  )
}
```

- [ ] **Step 4: Export** — in `src/index.ts` after the `Banner` line:

```ts
export { PageHeader, type PageHeaderProps } from './primitives/PageHeader'
```

- [ ] **Step 5: Run tests, commit**

Run: `pnpm test src/primitives/PageHeader.test.tsx` — Expected: PASS

```bash
git add src/primitives/PageHeader.tsx src/primitives/PageHeader.test.tsx src/index.ts
git commit -m "feat: add PageHeader (title + caption page rhythm)"
```

---

### Task 4: Extract `ThemeToggle` (internal, shared by AppHeader and AppShell)

**Files:**
- Create: `src/primitives/ThemeToggle.tsx`
- Modify: `src/primitives/AppHeader.tsx` (replace inline button)

**Interfaces:**
- Produces (internal, NOT exported from `src/index.ts`):
  `ThemeToggle({ labels }: { labels?: { system: string; light: string; dark: string } })`
  — the existing 2rem square tri-state cycle button, verbatim behavior.
- Consumed by: `AppHeader` (this task) and `AppShell` (Task 6).

- [ ] **Step 1: Create `src/primitives/ThemeToggle.tsx`** by moving the
  toggle `<button>` markup and the mode-icon map out of `AppHeader.tsx`
  **exactly as they exist after the Task 1 rebase** (v0.8.1 replaced the
  `◐/☀/☾` text glyphs with inline SVGs — move whatever is there, do not
  reintroduce glyphs):

```tsx
import { useTheme } from '../theme/useTheme'

export interface ThemeToggleLabels {
  system: string
  light: string
  dark: string
}

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
      className="inline-flex h-8 w-8 items-center justify-center rounded-[--radius] text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {/* icon rendering moved verbatim from AppHeader (SVGs as of v0.8.1) */}
    </button>
  )
}
```

- [ ] **Step 2: Use it in `AppHeader.tsx`** — delete the inline button and
  icon map, render `<ThemeToggle labels={themeLabels} />`; drop the now
  unused `useTheme` import.

- [ ] **Step 3: Run the existing AppHeader tests (they are the spec here)**

Run: `pnpm test src/primitives/AppHeader.test.tsx`
Expected: PASS unchanged — pure refactor.

- [ ] **Step 4: Commit**

```bash
git add src/primitives/ThemeToggle.tsx src/primitives/AppHeader.tsx
git commit -m "refactor: extract ThemeToggle for reuse by AppShell"
```

---

### Task 5: `UserMenu`

**Files:**
- Create: `src/primitives/UserMenu.tsx`
- Create: `src/primitives/UserMenu.test.tsx`
- Modify: `src/index.ts`

**Interfaces:**
- Produces:
  `UserMenuProps = { user: string; signOutHref?: string; signOutLabel?: string; menuLabel?: string }`;
  export `UserMenu`, `type UserMenuProps`. Defaults:
  `signOutHref='/auth/logout'`, `signOutLabel='Sign out'`,
  `menuLabel='Account'`. Bordered `name ▾` button; dropdown panel styled
  like the portal dialogs (`bg-muted border border-border rounded-lg`).
- Consumed by: `AppShell` (Task 6) when `user` is set.

- [ ] **Step 1: Write the failing test** — `src/primitives/UserMenu.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { UserMenu } from './UserMenu'

test('renders a closed menu button with the user name', () => {
  render(<UserMenu user="jane.doe" />)
  const btn = screen.getByRole('button', { name: /jane\.doe/ })
  expect(btn).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('opens on click and shows the sign-out item', () => {
  render(<UserMenu user="jane.doe" />)
  fireEvent.click(screen.getByRole('button', { name: /jane\.doe/ }))
  const item = screen.getByRole('menuitem', { name: 'Sign out' })
  expect(item).toHaveAttribute('href', '/auth/logout')
})

test('honors signOutHref and signOutLabel overrides', () => {
  render(<UserMenu user="j" signOutHref="/logout" signOutLabel="Abmelden" />)
  fireEvent.click(screen.getByRole('button', { name: /j/ }))
  expect(screen.getByRole('menuitem', { name: 'Abmelden' })).toHaveAttribute('href', '/logout')
})

test('closes on Escape and on outside click', () => {
  render(
    <div>
      <span>outside</span>
      <UserMenu user="jane.doe" />
    </div>,
  )
  const btn = screen.getByRole('button', { name: /jane\.doe/ })
  fireEvent.click(btn)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  fireEvent.click(btn)
  fireEvent.mouseDown(screen.getByText('outside'))
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/primitives/UserMenu.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `src/primitives/UserMenu.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { cn } from '../cn'

export interface UserMenuProps {
  /** Signed-in user name (from the trusted X-Auth-User header). */
  user: string
  /** Gateway logout endpoint. */
  signOutHref?: string
  /** i18n hooks. */
  signOutLabel?: string
  menuLabel?: string
}

export function UserMenu({
  user,
  signOutHref = '/auth/logout',
  signOutLabel = 'Sign out',
  menuLabel = 'Account',
}: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${menuLabel}: ${user}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm',
          'hover:border-primary hover:text-foreground',
          open ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {user}
        <span aria-hidden className="text-xs">▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-40 rounded-lg border border-border bg-muted p-1"
        >
          <a
            role="menuitem"
            href={signOutHref}
            className="block rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-accent"
          >
            {signOutLabel}
          </a>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Export** — in `src/index.ts` after the `AppHeader` line:

```ts
export { UserMenu, type UserMenuProps } from './primitives/UserMenu'
```

- [ ] **Step 5: Run tests, commit**

Run: `pnpm test src/primitives/UserMenu.test.tsx` — Expected: PASS

```bash
git add src/primitives/UserMenu.tsx src/primitives/UserMenu.test.tsx src/index.ts
git commit -m "feat: add UserMenu with sign-out dropdown"
```

---

### Task 6: `AppShell` + `SidebarGroup`

**Files:**
- Create: `src/layout/AppShell.tsx`
- Create: `src/layout/AppShell.test.tsx`
- Modify: `src/index.ts`

**Interfaces:**
- Consumes: `ThemeToggle` (Task 4), `UserMenu` (Task 5), `--color-chrome`
  (Task 1), `useTheme` storage conventions.
- Produces — the contract every app plan builds on:

```ts
export interface AppShellProps {
  title: string
  version?: string
  user?: string
  homeHref?: string        // default '/'
  homeLabel?: string       // default 'Apps'
  themeLabels?: { system: string; light: string; dark: string }
  signOutHref?: string     // forwarded to UserMenu, default '/auth/logout'
  signOutLabel?: string
  /** Sidebar content (nav + arbitrary blocks). Omit for header-only apps. */
  sidebar?: ReactNode
  sidebarToggleLabel?: string // default 'Toggle sidebar'
  children: ReactNode      // canvas content
}
export function AppShell(props: AppShellProps): JSX.Element
export function SidebarGroup(props: {
  label?: string
  children: ReactNode
}): JSX.Element
export const SIDEBAR_STORAGE_KEY = 'infra-ui-sidebar'
```

  Structure: chrome root (`h-screen flex flex-col bg-chrome
  text-foreground`), header row (`h-12 flex items-center gap-3 px-4`,
  no bottom border — chrome is one L-frame), body (`flex flex-1 min-h-0`),
  sidebar `w-72 shrink-0 overflow-y-auto p-4 flex flex-col gap-4`,
  canvas `main` = `flex-1 min-w-0 overflow-auto bg-background` plus
  `border-t border-border` always and `rounded-tl-lg border-l` only when
  the sidebar is present (no stray edge line for header-only apps).
  `☰` toggle renders only when `sidebar` is given; collapsed state hides
  the sidebar and persists `'1'` to `localStorage['infra-ui-sidebar']`.

- [ ] **Step 1: Write the failing test** — `src/layout/AppShell.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { AppShell, SidebarGroup, SIDEBAR_STORAGE_KEY } from './AppShell'
import { __resetStoreForTesting } from '../theme/useTheme'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  __resetStoreForTesting()
})

test('renders header chrome: home link, title, version, theme toggle', () => {
  render(
    <AppShell title="docint" version="v0.9.0">
      body
    </AppShell>,
  )
  expect(screen.getByRole('link', { name: /apps/i })).toHaveAttribute('href', '/')
  expect(screen.getByText('docint')).toBeInTheDocument()
  expect(screen.getByText('v0.9.0')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument()
})

test('renders UserMenu when user is set, nothing when absent', () => {
  const { rerender } = render(<AppShell title="t">x</AppShell>)
  expect(screen.queryByRole('button', { name: /account/i })).not.toBeInTheDocument()
  rerender(
    <AppShell title="t" user="jane.doe">
      x
    </AppShell>,
  )
  expect(screen.getByRole('button', { name: /jane\.doe/ })).toBeInTheDocument()
})

test('children render inside the canvas main landmark', () => {
  render(<AppShell title="t">canvas-content</AppShell>)
  expect(screen.getByRole('main')).toHaveTextContent('canvas-content')
})

test('sidebar renders with a working collapse toggle that persists', () => {
  render(
    <AppShell title="t" sidebar={<nav>side-nav</nav>}>
      x
    </AppShell>,
  )
  expect(screen.getByText('side-nav')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }))
  expect(screen.queryByText('side-nav')).not.toBeInTheDocument()
  expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('1')
})

test('no sidebar toggle for header-only apps', () => {
  render(<AppShell title="t">x</AppShell>)
  expect(screen.queryByRole('button', { name: /toggle sidebar/i })).not.toBeInTheDocument()
})

test('SidebarGroup renders an uppercase section label', () => {
  render(<SidebarGroup label="Entities">items</SidebarGroup>)
  expect(screen.getByText('Entities')).toHaveClass('uppercase')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/layout/AppShell.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `src/layout/AppShell.tsx`:

```tsx
import { useState, type ReactNode } from 'react'
import { cn } from '../cn'
import { ThemeToggle, type ThemeToggleLabels } from '../primitives/ThemeToggle'
import { UserMenu } from '../primitives/UserMenu'

export const SIDEBAR_STORAGE_KEY = 'infra-ui-sidebar'

export interface AppShellProps {
  /** App display name in the chrome header. */
  title: string
  version?: string
  /** Signed-in user; UserMenu is omitted entirely when absent. */
  user?: string
  homeHref?: string
  homeLabel?: string
  themeLabels?: ThemeToggleLabels
  signOutHref?: string
  signOutLabel?: string
  /** Sidebar content; omit for header-only apps (Nextext, translator). */
  sidebar?: ReactNode
  sidebarToggleLabel?: string
  children: ReactNode
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function AppShell({
  title,
  version,
  user,
  homeHref = '/',
  homeLabel = 'Apps',
  themeLabels,
  signOutHref,
  signOutLabel,
  sidebar,
  sidebarToggleLabel = 'Toggle sidebar',
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const toggleSidebar = () => {
    setCollapsed((v) => {
      const next = !v
      try {
        if (next) localStorage.setItem(SIDEBAR_STORAGE_KEY, '1')
        else localStorage.removeItem(SIDEBAR_STORAGE_KEY)
      } catch {
        /* storage unavailable — in-memory only */
      }
      return next
    })
  }

  return (
    <div className="flex h-screen flex-col bg-chrome text-foreground">
      <header className="flex h-12 items-center gap-3 px-4">
        {sidebar && (
          <button
            type="button"
            aria-label={sidebarToggleLabel}
            aria-expanded={!collapsed}
            onClick={toggleSidebar}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span aria-hidden>☰</span>
          </button>
        )}
        <a
          href={homeHref}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <span aria-hidden>←</span>
          {homeLabel}
        </a>
        <span className="text-sm font-semibold">{title}</span>
        {version && <span className="text-xs text-muted-foreground">{version}</span>}
        <span className="flex-1" />
        <ThemeToggle labels={themeLabels} />
        {user && <UserMenu user={user} signOutHref={signOutHref} signOutLabel={signOutLabel} />}
      </header>
      <div className="flex min-h-0 flex-1">
        {sidebar && !collapsed && (
          <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto p-4">{sidebar}</aside>
        )}
        <main
          className={cn(
            'min-w-0 flex-1 overflow-auto border-t border-border bg-background',
            sidebar && 'rounded-tl-lg border-l',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export function SidebarGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      )}
      {children}
    </div>
  )
}
```

Note: when a sidebar exists but is collapsed, the canvas intentionally
keeps its rounded corner and left border (`sidebar` prop, not visibility,
drives the classes) so toggling doesn't reflow the corner treatment.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/layout/AppShell.test.tsx` — Expected: PASS

- [ ] **Step 5: Export** — in `src/index.ts` replace nothing yet, just add
  after the `Shell` line:

```ts
export {
  AppShell,
  SidebarGroup,
  SIDEBAR_STORAGE_KEY,
  type AppShellProps,
} from './layout/AppShell'
```

- [ ] **Step 6: Full test run, commit**

Run: `pnpm test` — Expected: PASS (except the known tokens drift if left
for Task 8).

```bash
git add src/layout/AppShell.tsx src/layout/AppShell.test.tsx src/index.ts
git commit -m "feat: add AppShell — inset-canvas shell with optional sidebar"
```

---

### Task 7: Remove dead `Shell`

**Files:**
- Delete: `src/layout/Shell.tsx`, `src/layout/Shell.test.tsx`
- Modify: `src/index.ts` (drop the `Shell` export line)

**Interfaces:**
- Produces: `Shell`/`ShellProps` are gone from the public API (verified
  unused by all five consumers — chorus, docint, Nextext, translator,
  edge-plane). `AppHeader` remains exported for the migration window.

- [ ] **Step 1: Delete and unexport**

```bash
git rm src/layout/Shell.tsx src/layout/Shell.test.tsx
```

Remove from `src/index.ts`:

```ts
export { Shell, type ShellProps } from './layout/Shell'
```

- [ ] **Step 2: Verify nothing references it**

Run: `grep -rn "Shell" src demo --include='*.ts*' | grep -v AppShell`
Expected: no hits. Then `pnpm typecheck && pnpm test` — PASS.

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat!: remove unused Shell layout (superseded by AppShell)"
```

---

### Task 8: Demo, docs, version, dist — release readiness

**Files:**
- Modify: `demo/main.tsx` (wrap the kitchen sink in `AppShell`; add
  `PageHeader`, `UserMenu`, tile-`Card` sections)
- Modify: `README.md` (primitive list + AppShell usage snippet)
- Modify: `CLAUDE.md` (primitive-set line)
- Modify: `package.json` (`"version": "0.9.0"`)
- Modify: `dist/` (rebuild)

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces: the release artifact consumers pin as `#v0.9.0`.

- [ ] **Step 1: Rework `demo/main.tsx`** — wrap the existing kitchen-sink
  content in the new shell so the demo exercises the real chrome:

```tsx
<AppShell
  title="kitchen-sink"
  version="v0.9.0"
  user="jane.doe"
  sidebar={
    <SidebarGroup label="Sections">
      <a className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted" href="#primitives">
        Primitives
      </a>
    </SidebarGroup>
  }
>
  <div className="p-8">
    <PageHeader title="Primitives" caption="Every exported component, both themes" />
    {/* existing demo sections, plus: */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card title="Documents" interactive>
        1,284
      </Card>
      <Card title="Chunks">48,102</Card>
    </div>
  </div>
</AppShell>
```

- [ ] **Step 2: Visual review**

Run: `pnpm demo` — check dark and light (toggle in the demo header),
sidebar collapse, UserMenu open/close, canvas corner treatment, at wide
and narrow widths. Fix any visual defects found before proceeding.

- [ ] **Step 3: Update `README.md` and `CLAUDE.md`** — add `AppShell`,
  `SidebarGroup`, `UserMenu`, `PageHeader` to the component lists; remove
  `Shell`; README gains the AppShell snippet from Step 1 as the consumer
  example; note the new `--color-chrome` token next to the existing token
  documentation.

- [ ] **Step 4: Bump version** — `package.json` → `"version": "0.9.0"`.

- [ ] **Step 5: Build and commit dist**

Run: `pnpm build && pnpm test && pnpm typecheck && pnpm lint`
Expected: all PASS — including `src/tokens.test.ts`, now that
`dist/tokens.css` is regenerated with `--color-chrome`.

```bash
git add demo/main.tsx README.md CLAUDE.md package.json dist
git commit -m "chore: v0.9.0 — demo, docs, rebuilt dist"
```

- [ ] **Step 6: Push, PR, release**

Push `feature/app-shell-design`, open the PR (design doc + plan ride
along), CI green, merge. Then per CLAUDE.md § Releasing, cut the annotated
tag `v0.9.0` on main. Consumers bump their pin in the per-app plans.

---

## After this plan

Per-app plans (translator → Nextext → docint → chorus, then the edge-plane
portal) are written one at a time as each rollout slot arrives, against the
tagged v0.9.0 API above.
