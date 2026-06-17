# @infra/ui

Shared design system (Tailwind v4 tokens + UI primitives) for the infra React SPAs.
Dark, minimal, Nextext-derived. Consumed as a tag-pinned pnpm Git dependency.

## Install

```bash
pnpm add github:nos-tromo/infra-ui#v0.1.0
```

`react` and `react-dom` (v19) are peer dependencies. `dist/` is built automatically
on install via the `prepare` script.

## Wire it up (Tailwind v4)

In your app's root CSS (e.g. `src/styles/globals.css`):

```css
@import 'tailwindcss';
@import '@infra/ui/theme.css';                 /* shared tokens */

/* @source is resolved RELATIVE TO THIS CSS FILE. Point it at the installed
   package's dist so Tailwind generates the primitives' utility classes.
   Count the ../ from your CSS file to node_modules — e.g. an entry at
   src/styles/globals.css needs two levels up: */
@source '../../node_modules/@infra/ui/dist';

/* optional: brand this app with one accent color (omit to inherit the family blue) */
:root { --app-accent: hsl(160 84% 39%); }
```

> The `@source` line is required, at the correct depth for your CSS file's location — without it Tailwind generates none of the primitives' classes and they render unstyled.

## Use

```tsx
import { Button, Card, Input, Select, Badge, Spinner, Banner, cn } from '@infra/ui'
```

## Primitives

`Button` (primary/secondary/ghost/danger · sm/md) · `Card` · `Input` · `Select` ·
`Badge` (neutral/accent/danger) · `Spinner` · `Banner` (info/danger).

All styling uses semantic design tokens only (`bg-primary`, `text-muted-foreground`,
`border-border`, …), so an app re-themes everything by setting `--app-accent`.

## Develop

```bash
pnpm install      # builds dist via prepare
pnpm test         # vitest (unit tests for every primitive)
pnpm demo         # Vite kitchen-sink for visual review
pnpm build        # tsup -> dist/
```

## Design docs

See [`docs/`](docs/) for the design spec and the implementation plan this package was built from.
