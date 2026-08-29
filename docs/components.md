# Component reference

Props, keyboard maps and worked examples for the four things that need more than
a one-line description: `AppShell`, `SelectMenu`, the icon actions and
`ForceGraph`. The other primitives take a prop or two and are listed, with what
each is for, in the top-level [README](../README.md#primitives), which also
carries the install and the Tailwind wiring; this file is the detail behind it.
Why the icons are drawn rather than typed, and what each named action means, is
in [icon-policy.md](icon-policy.md).

## AppShell

The app-wide chrome — collapsible sidebar, home link, theme toggle, and
`UserMenu` — wraps every route's content. Sidebar sections are composed from
`SidebarGroup`; apps without a sidebar (Nextext, translator) omit the `sidebar`
prop entirely for a header-only shell.

```tsx
<AppShell
  title="kitchen-sink"
  version={appVersion}
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

`version` is the _consuming app's_ own version string, not `@infra/ui`'s — the
apps read it from their config endpoint and pass it through (see
`frontend/src/layout/Shell.tsx` in chorus or docint). Omit the prop and the
chrome renders no version at all.

## SelectMenu

Native first. `Select` is a real `<select>` and gets the platform's keyboard,
type-ahead and touch picker for free — reach for `SelectMenu` only when the
_closed_ control must be styled past what the platform will honor. The case that
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

## Icon actions

`IconButton` is the always-visible icon control (`HoverIconAction` is the
sibling that hides until its row is hovered). It is `ghost` by default —
transparent at rest, taking a background only under the pointer — and requires
a `label`, which drives both `aria-label` and `title` since the icon carries no
text of its own. Pass `children` for a short adornment beside the icon (a
format, a count, a caret) where several sit side by side; pass `busy` to swap in
a `Spinner` and block the second click. `IconLink` is the same shell over an
`<a>`, for a file the server streams.

Import the _action_, not the icon plus a button — that is what keeps four apps
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

`SendButton` is the one action here that is usually a page's _primary_ control
rather than quiet chrome, so it is the common case for `variant="primary"`. It
and `SearchButton` normally close a form: pass `type="submit"` — `IconButton`
writes `type="button"` before spreading your props, so the override lands.

What each named action means — and why `RemoveButton` and `DeleteButton` are two
actions rather than one — is in [icon-policy.md](icon-policy.md#what-each-action-means).

### The icon set

The set lives in `src/icons/`, all exported: `DownloadIcon`, `PlusIcon`,
`XIcon`, `TrashIcon`, `ChevronDownIcon`, `ChevronUpIcon`, `ChevronsUpDownIcon`,
`WarningIcon`, `InfoIcon`, `CheckIcon`, `StopwatchIcon`, `ExternalLinkIcon`,
`ReportIcon`/`ReportCheckIcon`, `SendIcon`, `SearchIcon`, `RefreshIcon`,
`ArrowLeftIcon`, `BrainIcon`/`BrainActiveIcon`. They are inline SVG, `currentColor`, `aria-hidden`, sized by
the caller. Adding one is covered by
[icon-policy.md](icon-policy.md#icons-are-drawn-never-typed).

All styling uses semantic design tokens only (`bg-primary`, `text-muted-foreground`,
`border-border`, `bg-chrome` (the `AppShell` frame background), …), so an app
re-themes everything by setting `--app-accent`.

## ForceGraph

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
