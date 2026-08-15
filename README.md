# @infra/ui

Shared design system (Tailwind v4 tokens + UI primitives) for the infra React SPAs.
Light/dark themeable, minimal, Nextext-derived. Consumed as a **commit-SHA-pinned**
pnpm tarball dependency.

## Install

Pin the codeload tarball of the commit a release tag points to — never the tag
itself, and never the `github:` shorthand:

```json
"@infra/ui": "https://codeload.github.com/nos-tromo/infra-ui/tar.gz/<full-40-hex-sha>"
```

A tag is a mutable ref: whoever can move it controls the code every install
fetches, and pnpm records no integrity hash for tarball URLs, so the lockfile
would not notice. The SHA URL is content-addressed — same policy as the
federation's SHA-pinned GitHub Actions refs, and enforced the same way: the
shared `python-app-ci` lint job runs `validate_infra_ui_pin.py` against every
consumer. (The `github:` shorthand is additionally off-limits because
Dependabot rewrites it to a git+SSH lockfile entry that breaks keyless CI and
git-less Docker builds.) The version stays readable in the consumer lockfile's
resolved `version:` field.

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
`SelectMenu` (custom value picker, for when a native popup cannot be styled) ·
`Badge` (neutral/accent/danger) · `Spinner` · `Banner` (info/danger) ·
`IconButton`/`IconLink` and the named icon actions below.

### SelectMenu

Native first. `Select` is a real `<select>` and gets the platform's keyboard,
type-ahead and touch picker for free — reach for `SelectMenu` only when the
*closed* control must be styled past what the platform will honor. The case that
forced it: a `<select>` sized as a page title at `text-2xl` opens a 24px popup
that covers the header, because a native popup inherits its control's font size.
`SelectMenu`'s panel is a sibling of the trigger and declares `text-sm` on
itself.

```tsx
<SelectMenu
  label="Select report"
  options={reports.map((r) => ({ value: String(r.id), label: `${r.title} (${r.item_count})` }))}
  value={activeId != null ? String(activeId) : null}
  onChange={(v) => setActiveId(Number(v))}
  placeholder="Choose a report…"
  emptyLabel="No reports yet."
  className="min-w-0 max-w-[40rem]"
  triggerClassName="text-2xl font-semibold"
/>
```

`className` styles the positioning wrapper (width, margins); `triggerClassName`
styles the button. **Font size belongs on `triggerClassName`** — the panel
restates `text-sm` regardless, so a `text-*` on the wrapper is a lie about what
it does.

`onChange` is called with the `value`, never the label, and never with `null`:
there is no un-choosing, which is what a native `<select>` with a disabled
placeholder option also gives you. An empty `options` renders `emptyLabel` on the
trigger and opens nothing, so "nothing to pick" stays where a native select put
it — the closed control's own text.

Keyboard: `↓`/`↑`/`Enter`/`Space` open · `↓`/`↑` move and clamp at the ends ·
`Home`/`End` jump · `Enter`/`Space` commit · `Esc` closes · `Tab` closes and
moves on. Focus never leaves the trigger (`aria-activedescendant`), so `Tab`
behaves like a native select's rather than stranding focus in the panel.
**Type-ahead is not implemented** and is the one real thing this gives up: it
needs a keystroke buffer with a reset timer and an `Intl.Collator` for the German
catalogs, and half of it is worse than none, because it looks like it works until
the first umlaut.

### Icon actions

`IconButton` is the always-visible icon control (`HoverIconAction` is the
sibling that hides until its row is hovered). It is `ghost` by default —
transparent at rest, taking a background only under the pointer — and requires
a `label`, which drives both `aria-label` and `title` since the icon carries no
text of its own. Pass `children` for a short adornment beside the icon (a
format, a count, a caret) where several sit side by side; pass `busy` to swap in
a `Spinner` and block the second click. `IconLink` is the same shell over an
`<a>`, for a file the server streams.

Import the *action*, not the icon plus a button — that is what keeps four apps
looking alike:

```tsx
import {
  DownloadButton, DownloadLink, NewButton, RemoveButton, DeleteButton,
  MoveUpButton, MoveDownButton, SendButton, SearchButton, RefreshButton,
} from '@infra/ui'

<DownloadButton label="Download transcript" onClick={save} />
<DownloadLink label="Export CSV" href="/export/documents.csv" />
<DownloadButton label="Export GraphML" onClick={save}>GraphML</DownloadButton>
<NewButton label="New chat" onClick={start} />
<RemoveButton label="Remove filter rule" onClick={drop} />
<DeleteButton label="Delete collection" busy={pending} onClick={destroy} />
<MoveUpButton label="Move up" disabled={first} onClick={() => move(-1)} />
<MoveDownButton label="Move down" disabled={last} onClick={() => move(1)} />
<SendButton label="Send" type="submit" variant="primary" busy={inflight} />
<SearchButton label="Search" type="submit" />
<RefreshButton label="Refresh summary" busy={rebuilding} onClick={rebuild} />
```

`SendButton` is the one action here that is usually a page's *primary* control
rather than quiet chrome, so it is the common case for `variant="primary"`. It
and `SearchButton` normally close a form: pass `type="submit"` — `IconButton`
writes `type="button"` before spreading your props, so the override lands.

`RefreshButton` is for a *re*build — something is on screen and this replaces
it. A view with nothing in it yet wants a labelled create button instead, which
can say what it will make; a bare pair of arrows over an empty panel cannot.

`MoveUpButton`/`MoveDownButton` reorder an item within a list. Disable them at
the ends of the run rather than hiding them, so a row's controls do not shift
under the pointer.

`NewButton` (`+`) creates a new one of whatever the surrounding list holds — a
chat, a report, a row — and is the one constructive action in the set, so it
takes no `danger` tint. It stays a single action rather than splitting into an
"add" and a "new": the two removals are distinct because their drawings are,
and a plus asked to mean two things would look the same either way.

The two removal actions differ on purpose: `RemoveButton` (`×`) takes something
out of a list, a selection or a view and nothing is destroyed; `DeleteButton`
(trash) destroys stored data — reserve it for what does not come back, and pair
it with a confirmation. Both tint `danger` on hover.

**Icons are drawn, never typed.** The set lives in `src/icons/` as inline SVG
(`DownloadIcon`, `PlusIcon`, `XIcon`, `TrashIcon`, `ChevronDownIcon`,
`ChevronUpIcon`, `ChevronsUpDownIcon`, `WarningIcon`, `InfoIcon`, `CheckIcon`,
`StopwatchIcon`, `ExternalLinkIcon`, `ReportIcon`/`ReportCheckIcon`, `SendIcon`,
`SearchIcon`, `RefreshIcon`, `ArrowLeftIcon`, all exported). A character like `×`, `▾` or
`⤓` renders from whatever font the browser and OS fall back to, so it differs on
every machine — and in a label-less control the drawing *is* the affordance.
Adding an action means one icon in `src/icons/` plus a wrapper the size of the
ones in `src/primitives/iconActions.tsx`, never a hand-rolled SVG in an app.

The rule covers status markers as much as controls, which is what the last five
are for: `CheckIcon`/`XIcon` as a pass/fail pair, `WarningIcon`/`InfoIcon` as an
interrupts/does-not-interrupt pair, `StopwatchIcon` for an elapsed duration (a
stopwatch, not a clock — this marks time *taken*, not time of day), and
`ExternalLinkIcon` for a link that leaves. `⏱`, `ⓘ` and `↗` are the worst
offenders under the typed-character rule: they carry emoji presentation on some
platforms, so they can arrive full-colour beside otherwise monochrome chrome.

The rule binds this package's own chrome hardest, because a slip here ships to
every app at once: `UserMenu` drew its caret as `▾` and `AppShell`/`AppHeader`
drew the back link as `←` until `v0.14.0`, so four federation headers rendered
their arrows in whatever font each machine fell back to.

`ReportIcon`/`ReportCheckIcon` are a *state* pair rather than a semantic one:
one page, drawn empty and drawn with a tick, for the "add to report" / "in
report" toggle an app builds over `IconButton`. It stays two icons instead of
one action wrapper because which of them shows is decided by the app's own
state, and the sheet must not move between them — a page that shifted would
read as the icon being swapped, not as the toggle being pressed.

An icon is exported **once** and imported everywhere, including by this
package's own primitives — `CopyButton` and `FileList` each kept a private
inline copy from before `src/icons/` existed, and a design system holding two
different checkmarks is exactly what that costs. Reach for the export before
drawing anything.

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

## Releasing

`main` is the trunk; a release is an annotated `vX.Y.Z` tag minted **on merge**
by the shared `release-tag` workflow, which reads `package.json`'s `version`
(bumping it in the release PR is the whole release action — tags are not
hand-cut). Release tags are immutability-protected by a repository ruleset
(no update, no delete), and Dependabot is deliberately out of the consumer
bump loop, so rolling a new release out is manual:

```bash
# 1. Resolve the new tag to its commit SHA
git ls-remote https://github.com/nos-tromo/infra-ui refs/tags/vX.Y.Z

# 2. In each consumer frontend (chorus, docint, Nextext, translator):
#    replace the SHA in package.json's @infra/ui codeload URL, then
pnpm install --no-frozen-lockfile   # refresh the lockfile
pnpm build && pnpm test             # verify before the PR
```

Each consumer's CI re-checks the pin form (`validate_infra_ui_pin.py`), so a
tag-named or `github:`-form pin cannot land.

## Design docs

See [`docs/`](docs/) for the design spec and the implementation plan this package was built from.
