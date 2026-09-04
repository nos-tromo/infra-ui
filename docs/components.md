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

The federation's value picker, and the reason `Select` is deprecated. A native
`<select>`'s popup is OS chrome: it ignores `--app-accent`, it cannot mark the
chosen row in the app's own terms, and it inherits the control's font size — a
`<select>` sized as a page title at `text-2xl` opens a 24px popup that covers
the header. `SelectMenu`'s panel is a sibling of the trigger and declares
`text-sm` on itself. What a native select still has and this does not: a touch
picker, and participation in form submission.

Two shapes. `variant="inline"` (the default) is the bare trigger — transparent
and unboxed, sized by `triggerClassName`, for a page title or a control sitting
in a line of text. `variant="field"` wears `Input`'s box (`h-10`, bordered,
`bg-background`) for a form row, and opens a panel at least as wide as the
field. Everything else is identical.

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

Grouped options carry a `group`, which draws an `<optgroup>`-style heading over
the run that shares it:

```tsx
options={[
  { value: 'own:transcripts', label: 'transcripts' },
  { value: 'a:archive', label: 'archive', group: 'a.beispiel' },
  { value: 'a:notes', label: 'field-notes', group: 'a.beispiel' },
]}
```

Options sharing a group must be **adjacent** — nothing is sorted, so a repeated
name after a gap draws a second heading. Headings are not options: they take no
index and no id, so the arrows, `Home`/`End` and the type-ahead step over them
without knowing they exist. Ungrouped options render at the top level, which is
how "mine first, then one heading per owner" falls out.

Keyboard: `↓`/`↑`/`Enter`/`Space` open · `↓`/`↑` move and clamp at the ends ·
`Home`/`End` jump · `Enter` commits · `Esc` closes · `Tab` closes and moves on.
Focus never leaves the trigger (`aria-activedescendant`), so `Tab` behaves like
a native select's rather than stranding focus in the panel.

Type-ahead: printable keys build a word that resets after 500 ms, a repeated
letter steps through the run of options sharing that initial, and an
`Intl.Collator` at base sensitivity folds case and diacritics, so `u` finds
"Übergabe". The scan **wraps** where the arrows **clamp** — the arrows are a
step and have ends, a search is a lookup and has none; that asymmetry is
deliberate and matches a native select. `Space` therefore commits only on an
empty buffer: mid-word it is a space, or the two-word names in these catalogs
would be unreachable. Typing on a _closed_ picker changes the value where it
stands, without opening anything, as a native select does.

## Menu

The action menu: a button that opens a list of things to _do_. `SelectMenu`'s
sibling and its opposite — that one names a value (`role="listbox"`), this one
runs an action (`role="menu"`) — sharing the same panel and rows so a page of
both reads as one control repeated.

```tsx
<Menu trigger={(props) => <DownloadButton {...props} label="Export" className="gap-1 px-2" />}>
  <MenuItem onSelect={runExport}>Combined JSONL</MenuItem>
  <MenuItem href={csvHref} download>
    CSV
  </MenuItem>
  <MenuItem href={htmlHref} target="_blank" rel="noreferrer">
    HTML
  </MenuItem>
</Menu>
```

`trigger` is a render prop rather than an element to clone, so the caller keeps
its own control — an `IconButton` with `busy`, `disabled` and `hint`, or a text
button — and **spreads the props last**: they carry the ref and the
`aria-*`/handler wiring, and a caller's own `id` or `onClick` placed after them
would silently win.

An item is a `<button>` (`onSelect`) or an `<a>` (`href`), and a link stays a
real link so the browser's own download and new-tab handling applies. `disabled`
is `aria-disabled`, never the attribute, so `hint` still shows the reason.
`tone="danger"` tints a destructive row at rest, before the pointer reaches it.
`closeOnSelect={false}` keeps the panel open for an item that opens a second
step:

```tsx
<Menu
  trigger={(props) => <DeleteButton {...props} label="Clear jobs" />}
  onOpenChange={(open) => !open && setConfirming(false)}
>
  {({ close }) =>
    confirming ? (
      <ConfirmPrompt onCancel={() => setConfirming(false)} onConfirm={close} />
    ) : (
      <MenuItem tone="danger" closeOnSelect={false} onSelect={() => setConfirming(true)}>
        Clear all
      </MenuItem>
    )
  }
</Menu>
```

`children` as a function receives `close`, which is what lets a confirmation
live inside the panel it was asked from. `onOpenChange` fires on every path in
and out — it is where that second step resets, so a menu never reopens
mid-question.

Unlike `SelectMenu`, real focus moves onto the rows: a `role="menu"` is not a
descendant of its trigger, a link must actually be focused for Enter to run the
browser's navigation, and a confirmation's buttons are not addressable by
`aria-activedescendant`. So every close path hands focus back to the trigger.

Keyboard: `↓`/`↑`/`Enter`/`Space` open (Down from the top, Up from the bottom) ·
`↓`/`↑` move and clamp · `Home`/`End` jump · `Enter`/`Space` choose · `Esc`
closes and restores focus · `Tab` closes and moves on. Escape is caught on the
menu, never on `document`, so one press dismisses one layer rather than this
menu plus the dialog holding it — an app that listens for Escape on `document`
itself will still see the key.

`UserMenu` is this component with one item; an app that needs a fourth popover
should reach here rather than hand-roll one.

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
  PlayButton, DisclosureButton,
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
<PlayButton label="Open player" onClick={play} />
<DisclosureButton
  expanded={open}
  controls={panelId}
  label={open ? 'Hide results' : 'Show results'}
  onClick={() => setOpen((v) => !v)}
/>
```

`DisclosureButton` is the one action carrying state: pass `expanded` and it
writes `aria-expanded` and turns the caret over — one chevron rotated, never a
swapped pair. Give the revealed element an `id` and pass it as `controls`, and
swap `label` with the state so the name always says what the next click does.

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
`ArrowLeftIcon`, `BrainIcon`/`BrainActiveIcon`, `PlayIcon`, `LayersIcon`,
`DocumentsIcon`, `ImageIcon`. They are inline SVG, `currentColor`, `aria-hidden`, sized by
the caller. Adding one is covered by
[icon-policy.md](icon-policy.md#icons-are-drawn-never-typed).

### Status icon

`StatusIcon` draws the state of one job, task or upload instead of spelling it
out, so a list of them is read down a column at a glance and the row's controls
stop shifting as translated words change length:

```tsx
<StatusIcon status="running" label={t('jobs.status_running')} />
```

`status` is one of `idle | running | done | failed | cancelled` — map the app's
own union onto it. `label` is required and is the whole accessible name: the
marker carries no text, so the wording reaches a screen reader and a hovering
pointer through `aria-label` and `title`. `running` renders the `Spinner` (its
`role="status"` announces it as ongoing); the rest are the set's existing
pass/fail/duration drawings, with `failed` and `cancelled` sharing the cross and
differing only in tint.

All styling uses semantic design tokens only (`bg-primary`, `text-muted-foreground`,
`border-border`, `bg-chrome` (the `AppShell` frame background), …), so an app
re-themes everything by setting `--app-accent`.

### Toggle button

`ToggleButton` is one option that is on or off, saying which by its colour. A
checkbox spends its width on a box and hides the answer in a mark you have to
hunt for; a row of these reads as lit and unlit panels instead:

```tsx
<ToggleButton pressed={summary} onClick={() => setSummary((v) => !v)} className="flex-1">
  {t('options.summary')}
</ToggleButton>
```

`pressed` is required and the component holds no state of its own — what is
selected is the caller's data. The two states are the `Button` recipe's
`primary` and `secondary` variants, so a selected toggle is pixel-identical to
the form's submit button, and the focus ring, disabled treatment and colour
transition all come from one place. `size` takes the same `sm`/`md`; anything
else is a native `<button>` prop, and `type` defaults to `button` so a toggle
inside a form never submits it.

Label it with what the option **is** — "Summary", not "Add summary". On-ness
travels to a screen reader through `aria-pressed`, and a name that swapped with
the state would announce the change twice and contradict the colour. (That is
the opposite of `DisclosureButton`, whose label names the next click because a
disclosure has no persistent identity of its own.)

Stretch a set of them across a form with `className="flex-1"` inside a
`flex flex-wrap` row; give them a `min-w-*` so they wrap rather than crush.

### Cycle button

`CycleButton` is one 32px icon button that steps through a short run of values —
the shape `ThemeToggle` already had, exported so an app stops reaching for a
dropdown:

```tsx
<CycleButton
  name={t('chat.retrieval_target')}
  options={RETRIEVAL_TARGETS.map((value) => ({
    value,
    icon: TARGET_ICON[value],
    label: t(`chat.retrieval_target.${value}`),
  }))}
  value={target}
  onChange={setTarget}
/>
```

Every option carries its own drawing, and the accessible name and tooltip read
`"Name: Value"` — so what is selected reaches a screen reader and the pointer
alike. One icon merely tinted would leave the state to a background colour, and
a state legible only on hover is a state people leave set wrong. Note the name
says what the value *is*, not what the next click does: the opposite of
`DisclosureButton`, which has no persistent value to report.

Controlled, like `ToggleButton` — the caller owns the step, and `onChange`
receives the next value in the run, wrapping at the end. A `value` outside
`options` renders the first option rather than nothing. Everything else is an
`IconButton` prop (`disabled`, `className`, `hint`), so it sits at the same
height as the icon actions beside it.

Reach for it only where every value has a drawing someone can tell apart, and
where the setting is changed rarely enough that stepping is no burden. A binary
on/off is `IconButton` with `aria-pressed` and a two-icon state pair; a labelled
choice is `ToggleButton`; more than about four values, or a form row, is
`SelectMenu` — which can be read without clicking through it.

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
