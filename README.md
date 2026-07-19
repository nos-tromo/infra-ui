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
import { Button, CopyButton, Card, Input, Select, Badge, Spinner, Banner, FileList, ForceGraph, cn } from '@infra/ui'
```

## Primitives

`Button` (primary/secondary/ghost/danger · sm/md) · `CopyButton` (icon-only,
copies text to the clipboard) · `Card` · `Input` · `Select` ·
`Badge` (neutral/accent/danger) · `Spinner` · `Banner` (info/danger).

All styling uses semantic design tokens only (`bg-primary`, `text-muted-foreground`,
`border-border`, …), so an app re-themes everything by setting `--app-accent`.

### ForceGraph

Interactive SVG force-directed graph with zoom, pan, drag, multi-node selection, and incremental merge support. Nodes and edges are token-themed, and the simulation layout is preserved across updates so expanding the graph with new nodes maintains the existing visual structure.

```tsx
<ForceGraph
  nodes={[{ id: 'a', label: 'Alpha', kind: 'author' }]}
  edges={[]}
  nodeStyles={{ author: { color: '#7c3aed' } }}
  selectedIds={selected}
  onSelectionChange={setSelected}
/>
```

The `nodes` prop accepts new nodes that merge into the existing layout without resetting. The `labels` prop provides translated UI control captions for pan/zoom/select modes. Per-kind styles accept an optional `labelColor` for label text distinct from the node fill.

Selection is a set (`selectedIds`/`onSelectionChange`), not a single id: a plain click replaces the selection with one node, shift+click toggles a node in/out of the set, shift+drag on the background draws a dashed marquee and selects every node inside it (unioned with whatever was already selected), and a plain click on empty canvas clears the selection. The Expand button (and double-click-to-expand) only appears when exactly one node is selected. An optional `onDeleteNodes` prop adds a Remove button — singular ("Remove node") at one selection, or the `removeSelectedMany` label (default "Remove {n} nodes") above that — plus Backspace/Delete support for the whole selected set. Supply multiple expand actions per node kind via `expandActions` and `onExpandAction` callbacks — double-click fires the first action.

## Develop

```bash
pnpm install      # install deps (dist is committed, not built on install)
pnpm test         # vitest (unit tests for every primitive)
pnpm demo         # Vite kitchen-sink for visual review
pnpm build        # tsup -> dist/  (commit dist/ whenever src/ changes)
```

## Design docs

See [`docs/`](docs/) for the design spec and the implementation plan this package was built from.
