# @infra/ui

Shared design system (Tailwind v4 tokens + UI primitives) for the infra React SPAs.
Dark, minimal, Nextext-derived. Consumed as a tag-pinned pnpm Git dependency.

## Install

```bash
pnpm add github:nos-tromo/infra-ui#v0.1.0
```

`react` and `react-dom` (v19) are peer dependencies. The built `dist/` (JS + `.d.ts`)
is **committed to the repo**, so every consumer gets the same prebuilt, deterministic
types — there is no install-time rebuild. (Rebuilding per-consumer under `prepare` proved
unreliable: a tag-pinned git dependency rebuilt in some CI environments emitted a degraded
`.d.ts`, silently making the primitives `any`.) After changing `src/`, run `pnpm build`
and commit `dist/`.

## Wire it up (Tailwind v4)

In your app's root CSS (e.g. `src/styles/globals.css`):

```css
@import 'tailwindcss';
@import '@infra/ui/theme.css';                 /* shared tokens */
@source '../node_modules/@infra/ui/dist';      /* so Tailwind sees the primitives' classes */

/* optional: brand this app with one accent color (omit to inherit the family blue) */
:root { --app-accent: hsl(160 84% 39%); }
```

> The `@source` line is required — without it Tailwind won't generate the utility
> classes the primitives reference, and they'll render unstyled.

## Use

```tsx
import { Button, CopyButton, Card, Input, Select, Badge, Spinner, Banner, cn } from '@infra/ui'
```

## Primitives

`Button` (primary/secondary/ghost/danger · sm/md) · `CopyButton` (icon-only,
copies text to the clipboard) · `Card` · `Input` · `Select` ·
`Badge` (neutral/accent/danger) · `Spinner` · `Banner` (info/danger).

All styling uses semantic design tokens only (`bg-primary`, `text-muted-foreground`,
`border-border`, …), so an app re-themes everything by setting `--app-accent`.

## Develop

```bash
pnpm install      # install deps (dist is committed, not built on install)
pnpm test         # vitest (unit tests for every primitive)
pnpm demo         # Vite kitchen-sink for visual review
pnpm build        # tsup -> dist/  (commit dist/ whenever src/ changes)
```

## Design docs

See [`docs/`](docs/) for the design spec and the implementation plan this package was built from.
