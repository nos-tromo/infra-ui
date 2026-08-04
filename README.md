# @infra/ui

Shared design system (Tailwind v4 tokens + UI primitives) for the infra React SPAs.
Light/dark themeable, minimal, Nextext-derived. Consumed as a tag-pinned pnpm Git dependency.

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
import {
  AppShell,
  SidebarGroup,
  PageHeader,
  UserMenu,
  AppHeader,
  Button,
  CopyButton,
  Card,
  Input,
  Select,
  Badge,
  Spinner,
  Banner,
  FileList,
  ForceGraph,
  cn,
} from '@infra/ui'
```

### AppShell

The app-wide chrome — collapsible sidebar, home link, theme toggle, and
`UserMenu` — wraps every route's content. Sidebar sections are composed from
`SidebarGroup`; apps without a sidebar (Nextext, translator) omit the `sidebar`
prop entirely for a header-only shell.

```tsx
<AppShell
  title="kitchen-sink"
  version="v0.9.0"
  user="jane.doe"
  sidebar={
    <SidebarGroup label="Sections">
      <a
        className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        href="#primitives"
      >
        Primitives
      </a>
    </SidebarGroup>
  }
>
  <div className="p-8">
    <PageHeader title="Primitives" caption="Every exported component, both themes" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card title="Documents" interactive>
        1,284
      </Card>
      <Card title="Chunks">48,102</Card>
    </div>
  </div>
</AppShell>
```

## Primitives

`AppShell` (chrome frame: sidebar, home link, theme toggle, `UserMenu`) ·
`SidebarGroup` (labeled sidebar section) · `PageHeader` (route title + caption,
one per route) · `UserMenu` (identity + sign-out dropdown) ·
`AppHeader` (portal link, identity, tri-state theme toggle) · `Button` (primary/secondary/ghost/danger · sm/md) · `CopyButton` (icon-only,
copies text to the clipboard) · `Card` (plain or tile-style with `title`/`interactive`) · `Input` · `Select` ·
`Badge` (neutral/accent/danger) · `Spinner` · `Banner` (info/danger).

All styling uses semantic design tokens only (`bg-primary`, `text-muted-foreground`,
`border-border`, `bg-chrome` (the `AppShell` frame background), …), so an app
re-themes everything by setting `--app-accent`.

### Theming

The `useTheme` hook provides a tri-state theme cycle (system → light → dark → system) and reflects the user's choice in `document.documentElement.dataset.theme`. To prevent flash-of-unstyled-content (FOUC) on page load, add this snippet to `index.html` before your app entrypoint:

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

The `AppHeader` primitive includes this toggle built in (three-way button with accessible names keyed by mode). Apps without a header can use the hook directly to build their own toggle.

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

Graph exporters (JSON/GraphML/self-contained interactive HTML) ship with the package (`toGraphJson`, `toGraphML`, `toGraphHtml`, `downloadText`).

## Non-React consumers

Federation members that serve build-free static HTML (no Tailwind, no
bundler — e.g. edge-plane's portal pages) can't use `@import '@infra/ui/theme.css'`,
since that file is a Tailwind v4 `@theme` block and only becomes real CSS
custom properties once Tailwind processes it. For those consumers, `@infra/ui`
also ships `dist/tokens.css`: the same semantic tokens as plain
`:root { --color-... }` / `:root[data-theme='dark'] { ... }` /
`@media (prefers-color-scheme: dark)` rules, no build step required.

```html
<link rel="stylesheet" href="tokens.css" />
```

Vendor the file into the consuming repo (see edge-plane's portal for the
pattern: a committed copy plus a documented re-vendor step, the same
approach used for other cross-repo shared files like `bundle-lib.sh`).
`dist/tokens.css` is generated from `src/theme.css` by
`scripts/build-tokens.mjs` as part of `pnpm build` — never hand-edit it, and
never hand-copy token values into a consumer either; `src/tokens.test.ts`
fails CI if the committed file drifts from `src/theme.css`.

## Develop

```bash
pnpm install      # install deps (dist is committed, not built on install)
pnpm test         # vitest (unit tests for every primitive)
pnpm demo         # Vite kitchen-sink for visual review
pnpm build        # tsup -> dist/, then scripts/build-tokens.mjs -> dist/tokens.css
                  # (commit dist/ whenever src/ changes)
```

## Design docs

See [`docs/`](docs/) for the design spec and the implementation plan this package was built from.
