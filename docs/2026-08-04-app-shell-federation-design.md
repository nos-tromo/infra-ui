# App-like look and feel — federation frontend overhaul (design)

Date: 2026-08-04
Status: **implemented, then corrected** — infra-ui v0.9.0/v0.9.1 and all four
app adoptions landed 2026-08-04 (chorus #117, docint #404, Nextext #128,
translator #97); the page-layout prescriptions below were then rejected in
operator review the same day and replaced across a second round of PRs
(chorus #118, docint #408, Nextext #129, translator #98). See Outcome at the
end — the shell, tiles, user menu, and tokens survived unchanged; the layout
half of this document did not.

## Goal

Give all four app SPAs (chorus, docint, Nextext, translator) and the
edge-plane portal one uniform, modern, application-like design — restrained
rather than flashy — while preserving every existing function (dark/light
toggle, user display, all app features) and adding a sign-out control inside
the apps. The portal's tile redesign is the aesthetic reference; the
[AI SDK chatbot demo](https://chatbot.ai-sdk.dev/demo) informs the shell and
chat treatment.

## Decisions (from the brainstorming session)

1. **One canonical `AppShell` in `@infra/ui`, sidebar optional.** docint and
   chorus pass a sidebar; Nextext and translator stay header-only. No app
   keeps a hand-rolled shell.
2. **Tiles are the panel language everywhere.** The portal tile (surface
   fill, 1px border, `radius-lg`, optional accent title, hover-accent border
   when interactive, no shadows) becomes the standard panel via the `Card`
   primitive. No competing hand-rolled panels.
3. **User menu in the header.** The plain username becomes a bordered
   `name ▾` menu button; the dropdown holds Sign out (`/auth/logout`).
   Hidden when no user is present (dev without edge-plane).
4. **Fill width, clamp only text.** Work surfaces (grids, tables, panes,
   job lists) fill the canvas with responsive grids. Only reading and
   conversation content (chat threads, reports, transcripts) sits on a
   centered measure.
   *Corrected in practice: the second sentence did not survive. Nothing sits
   on a centered measure — conversation screens are left-bound and full-width
   like every other surface; the only width clamp that survived operator
   review is the individual message bubble (`max-w-prose`). See Outcome.*
5. **Portal fully in scope.** It adopts the same frame and header pattern,
   not just token ride-alongs.
6. **Shell direction: "inset canvas" (B2).** Chrome (header + sidebar) on a
   tinted layer; the work area is a rounded inset canvas; soft-fill cards on
   the canvas. Confirmed in dark and light mockups.

## Visual system

Three surface levels:

| Level | Token | Dark | Light |
|---|---|---|---|
| Chrome (header + sidebar) | `--color-chrome` (new) | `hsl(240 4% 12%)` | `hsl(240 5% 96%)` |
| Canvas (work area) | `--color-background` | `hsl(240 6% 8%)` | `hsl(0 0% 100%)` |
| Card / tile | `--color-muted` fill + `--color-border` 1px | as today | as today |

- Chrome and sidebar are one L-shaped frame with no border between them.
  The canvas insets into it with a `--radius-lg` top-left corner and a
  hairline `--color-border` edge (top + left only).
- No shadows anywhere. Separation is fill + 1px borders, as in the portal.
- Dimensional-token discipline unchanged: every font-size and border-radius
  is a `--text-*` / `--radius-*` token (edge-plane CI guard stays).
- Accent stays the single per-app knob (`--app-accent`), now uniformly
  declared as base value + explicit `[data-theme='dark']` override (the
  docint pattern). chorus gains its missing dark variant.
- Adopted from the AI SDK demo: collapsible sidebar, ghost icon controls,
  soft-fill rounded "composer card" work surfaces, right-aligned muted user
  bubbles with assistant text plain on the canvas.

## `@infra/ui` v0.9.0

New / changed exports:

- **`AppShell`** — replaces the unused `Shell` (removed). Renders the chrome
  header row (portal link "← Apps", app title, version, theme toggle,
  `UserMenu`), an optional collapsible sidebar (`☰` toggle in the header,
  collapsed state persisted to localStorage), and the inset canvas `main`.
  Sidebar content comes in via props/children; supports flat items, grouped
  items with uppercase section labels (chorus), and arbitrary stateful
  blocks (docint's collection picker and session list). Sidebar width is
  standardized at 18rem (today's docint `w-72`, so its stateful blocks fit;
  chorus widens from `w-64`).
- **`UserMenu`** — bordered `name ▾` button opening a small dropdown styled
  like the portal dialogs (surface fill, 1px border, `radius-lg`) containing
  Sign out → `/auth/logout`. Rendered only when `user` is set. Built
  in-house; no new runtime dependency.
- **`PageHeader`** — `h1` + muted caption line; used on every route of every
  app (the chorus title+caption rhythm).
- **`Card`** — aligned to the portal tile: `bg-muted` fill (not `/30`),
  `radius-lg`, 1px border; optional accent-colored title slot; optional
  interactive variant with hover-accent border.
- **`AppHeader`** — kept as an export during the transition, absorbed by
  `AppShell`; removed in a later major.
- Tokens: `--color-chrome` added to `theme.css` / `dist/tokens.css`;
  contrast test extended to chrome/foreground pairs.

Kitchen-sink demo updated; `pnpm build` and committed `dist/` per repo rule.

## Per-app changes

Common to all four: adopt `AppShell` + `PageHeader`, delete hand-rolled
shells, unify accent CSS declaration, route all panels/errors through
`Card`/`Banner`, keep routes and features identical.

**docint** (largest):
- Shell moves out of the router (adopt chorus nesting); sidebar nav plus its
  stateful blocks become `AppShell` sidebar children; add `*` → `/` route.
- Ingest rebuilt: drop the left-hugging `max-w-3xl` clamp; full-width
  two-column canvas — upload card (dropzone + collection field) beside a
  live jobs/status card; status boxes and the raw reconnect button become
  `Card`/`Banner`/`Button`.
  *Rejected in practice — the side-by-side arrangement was replaced by a
  stacked one (see Outcome).*
- Dashboard: hand-rolled sections → tiles; `grid-cols-4` gains breakpoints.
- Chat/Report keep two-pane `h-full` layouts; Chat gets the AI-SDK
  treatment (centered thread measure, user bubbles, composer card).

**chorus** (smallest):
- Adopt shell; drop the duplicate sidebar `VersionBadge` and Landing's
  duplicate `h1`; grouped nav uses the shared sidebar pattern; dark accent
  variant added.

**Nextext**:
- Drop hand-rolled shell and the always-reserved StatusBar strip (status
  renders only when present, inside the jobs area); replace home-grown
  button/select/spinner/card with the primitives.
- Home becomes a full-width canvas: upload card beside the jobs list;
  results open as a proper panel on the reading measure instead of
  unbounded inline growth (existing tab bar kept).
  *Rejected in practice — "beside" was replaced by stacked (see Outcome).*

**translator**:
- Adopt shell (header finally sticky); input/output panes become equal
  soft-fill cards growing into the canvas height; banners move next to the
  controls that produce them.
  *Corrected in practice — unbounded growth buried the translate action at
  the viewport edge; the pane row is capped at 32rem (see Outcome).*

## Portal (edge-plane)

- Page background becomes the chrome tint; the Apps/Settings column sits on
  an inset rounded canvas. Tiles unchanged.
- Top bar aligns to the `AppShell` header; the outlined sign-out link is
  replaced by the same `name ▾` user-menu pattern (vanilla JS, reusing the
  portal's dialog styling).
- Vendored `tokens.css` bumps to the new infra-ui tag;
  `check-no-literal-dimensions.sh` and `check-tokens-vendor.sh` stay green.

## Rollout

One PR per repo, GitHub Flow, version bump mints the tag:

1. `infra-ui` v0.9.0 (tokens, Card, AppShell, UserMenu, PageHeader).
2. Apps smallest-first, each pinning the new tag:
   translator → Nextext → docint → chorus. Lessons from translator feed
   forward before the docint rebuild.
3. `edge-plane` portal PR last, once the header pattern is final.

## Verification

- infra-ui: vitest for the new components; contrast test covers the chrome
  pairs; tokens-drift guard unchanged.
- Apps: `make verify` (includes `pnpm lint` + `pnpm build`); existing
  frontend tests updated where shells changed.
- Per-app visual pass on the dev bring-up before merge: dark + light, wide +
  narrow viewports.

## Out of scope

Backend changes, route changes, new features beyond the user menu/sign-out,
ForceGraph work, i18n changes, generic-error work.

## Outcome (2026-08-04, post-rollout operator review)

The shell, tiles, tokens, user menu, and sign-out shipped as designed and
survived review unchanged. The **page-layout half of this document was
rejected in practice** — in every case where it constrained the width or
height of primary content. It took three rounds to converge, so the final
rules are recorded here as the authority for the next rollout; where the
body text above conflicts, this section wins.

What was rejected, and what replaced it:

- **Form-beside-status (docint Ingest, Nextext home).** As shipped, the
  form column was pinned to `minmax(~26rem,~28rem)` — narrower than the
  pre-overhaul pages — beside a status column that is empty whenever
  nothing runs. Rejected. An equal 50/50 split was tried next and also
  rejected: two half-width regions read as two sparse islands (the
  dropzone stretched into emptiness while job rows — progress bar,
  actions, downloads — were cramped). **Final: stacked.** The form card
  and the jobs/status area are siblings in one column, both spanning the
  full content width so their edges align (docint #408, Nextext #129).
- **Centered conversation measure (chorus chat).** The chat column was the
  only `mx-auto`-centered route while every tool screen was left-bound, so
  alignment jumped when navigating. Rejected. **Final: full-width,
  left-bound, docint-style** — the page is a full-height flex column, the
  transcript scrolls (`flex-1 overflow-auto`), the composer is pinned at
  the bottom, and the clear control lives in the `PageHeader` actions
  slot. The tool screens' `max-w-lg` form clamps fell at the same time
  (chorus #118). The only clamp that survived is the per-message bubble
  (`max-w-prose`).
- **Panes "growing into the canvas height" (translator).** Unbounded
  growth pushed the translate action to the viewport edge, and the upload
  link inside the input column threw the two pane bottoms out of
  alignment. **Final: the pane row is capped at 32rem, both panes are
  direct children of one grid row, and the upload control sits on a
  shared action row beside the translate button** (translator #98).

The generalizable lessons, stated once:

1. **Never cap primary content narrower than the canvas.** No fixed narrow
   columns, no centered measures, no `max-w-*` on the screen's main work
   surface. Panels stacked on one page must share the same width so their
   edges align.
2. **Don't reserve horizontal space for conditional content.** A
   side-by-side region that is usually empty (job status, results) strands
   its neighbor in whitespace; stack it below instead and let it appear
   when it has something to show.
3. **Cap heights, not widths.** Where content would otherwise grow to the
   viewport edge, bound the height so primary actions stay in view.

Where this document went wrong procedurally: the mockup round validated the
shell direction but never showed the four pages at real viewport width in
their common state (nothing running, empty status). All three rejections
were visible only there.
