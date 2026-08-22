# Icon policy

Why this package draws its icons instead of typing them, and what each named
icon action is allowed to mean. This is the human-facing canonical copy of the
rule; `CLAUDE.md` states the same constraint in the shorter form agents read.
The props and the icon inventory are in
[components.md](components.md#icon-actions).

## Icons are drawn, never typed

The set lives in `src/icons/` as inline SVG — the inventory is in
[components.md](components.md#the-icon-set), and every icon is exported. A
character like `×`, `▾` or `⤓` renders from whatever font the browser and OS
fall back to, so it differs on
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

## What each action means

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
