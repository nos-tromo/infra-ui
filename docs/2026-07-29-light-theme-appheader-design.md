# Light theme + AppHeader — design

Date: 2026-07-29
Status: approved (design); implementation pending
Scope: `@infra/ui` v0.6.0 + four app adoption PRs + one edge-plane portal PR

## Context

First-rollout backlog, frontend wave 1. Two user-facing gaps: apps have no
way back to the portal except URL surgery, and the federation is dark-only —
a real accessibility issue (users needing light/high-contrast rendering get
no option), not cosmetics. Decisions locked with the owner:

- **Default = OS/browser preference** (`prefers-color-scheme`); an explicit
  toggle overrides. Tri-state: `light` / `dark` / unset (follow system).
- **AppHeader includes identity** (signed-in user), passed as a prop.
- **The portal rides along fully**: light palette + toggle, and its current
  `infra-ui-theme: 'dark'` localStorage pre-seed is REMOVED (it would
  permanently override every user's OS preference under the new model).

## 1. Tokens (`src/theme.css`)

Mechanism: CSS-variable override — the standard Tailwind v4 pattern, chosen
over `dark:` variants (would touch every primitive class) and stylesheet
swapping (flash-of-wrong-theme). Primitives change not at all; they already
consume semantic tokens exclusively.

- The current dark values move to a `:root[data-theme='dark']` block and an
  `@media (prefers-color-scheme: dark)` block guarded to apply only when
  `data-theme` is unset (`:root:not([data-theme])`).
- New light palette becomes the `:root` defaults — same token names
  (`--color-background`, `--color-foreground`, `--color-muted`,
  `--color-muted-foreground`, `--color-border`, `--color-accent`,
  `--color-danger`, `--color-primary-foreground`). Contrast bar: **WCAG AA**
  — ≥4.5:1 for `foreground`/`muted-foreground`/`danger` against
  `background` and `muted`, verified by test (§6).
- `--app-accent` remains the one per-app knob. Each app's accent is checked
  against both backgrounds during adoption; if one fails AA on the light
  background, that app sets a light-variant accent override
  (in its own CSS) — CORRECTED 2026-07-29: the naive `:root:not([data-theme='dark'])` selector also matches system-mode users whose OS prefers dark (no data-theme attribute is set in system mode), shipping the darkened light-accent onto dark backgrounds below AA. The correct pattern pairs the override with a media-guarded restore:

  ```css
  :root:not([data-theme='dark']) { --app-accent: <darker>; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme]) { --app-accent: <original>; }
  }
  ```
  —
  the package does not grow a second knob.

## 2. Theme state — `useTheme` (new, headless)

One hook owns the contract; nothing else touches `localStorage` or
`data-theme` directly.

- Key: `infra-ui-theme`; values `'light'` | `'dark'`; **absent = system**.
- On mount and on change: resolves the effective theme, sets
  `document.documentElement.dataset.theme` (or removes it when following
  system — the CSS media block then governs), persists explicit choices,
  removes the key when returning to system.
- Reacts to `matchMedia('(prefers-color-scheme: dark)')` changes (relevant
  only in system mode) and cross-tab `storage` events.
- API: `{ mode: 'light'|'dark'|'system', resolved: 'light'|'dark',
  cycle(): void }` — `cycle` steps system → light → dark → system.
- **FOUC guard:** consumers add a documented inline `<script>` in
  `index.html` (before the bundle) that reads the key and stamps
  `data-theme` pre-paint. Shipped as a copy-paste snippet in the README;
  applied in every adoption PR.

## 3. AppHeader (new primitive)

Slim top bar, mounted by each app above its existing layout:

```
[← Apps]   {title}                    {user}  [theme-toggle]
```

- Back link: `href="/"` (the gateway portal; harmless in standalone dev),
  house/arrow icon + i18n'able label via prop (default "Apps").
- `title: string` — the app's display name.
- `user?: string` — rendered when present, hidden when absent (dev without
  gateway). Apps pass what they already have (config/identity plumbing).
- Theme toggle: icon button driven by `useTheme`; cycles the three modes;
  current mode exposed via `aria-label`/`title` (e.g. "Theme: system —
  click for light"). Label strings overridable via props for app i18n.
- Styling: semantic tokens only; unit-tested like every primitive.

Ships as **v0.6.0** (minor bump; additive API). Committed-`dist/` rule
applies: `pnpm build`, commit `dist/` in the same change.

## 4. Adoption — four app PRs (chorus, docint, Nextext, translator)

Off the v0.6.0 tag, per app:

- Bump the git-pin; add the FOUC snippet to `index.html`.
- Mount `<AppHeader>` in the app's Shell/layout with title + username;
  remove now-redundant bespoke identity display.
- **Dark-color audit:** find hardcoded dark styling that bypasses tokens —
  including the ForceGraph element/style mappers (chorus
  `explorerElements.ts` etc.; the ForceGraph component itself is
  token-clean, colors arrive via props) — and re-express it in tokens or
  add explicit light variants. Verify each app's `--app-accent` on the
  light background (§1).
- chorus additionally: dashboard nav fix — the Landing/stats screen gets a
  sidebar entry (currently reachable only by URL).
- Chores ride along: README/CLAUDE.md claims about dark-only UI or theming
  updated in the same branch.

## 5. Portal ride-along — one edge-plane PR

- Remove the `infra-ui-theme` pre-seed from `landing/index.html`.
- Split the portal's copied CSS variables into the same light/dark dual
  palette: light on `:root`, dark under `[data-theme='dark']` + media-query
  fallback — token values mirrored from `theme.css` (the portal stays
  build-free; values are duplicated by design, sync burden noted inline).
- Same tri-state contract in vanilla JS: FOUC-stamp inline, cycling toggle
  in the user section (en+de), `storage`/`matchMedia` reaction.
- Smoke must stay green; README synced (chores rule).

## 6. Testing

- infra-ui: unit tests for `useTheme` (tri-state resolution, persistence,
  matchMedia + storage reaction) and AppHeader (render, props, toggle
  cycling); a **contrast test** computing WCAG ratios for the §1 pairs from
  the actual `theme.css` values in BOTH palettes — palette drift fails CI.
- Apps: existing suites + `make verify`; visual pass via `pnpm demo`
  (infra-ui kitchen sink, both themes) and each app's dev server.
- Portal: edge-plane smoke + manual both-themes check.

## Sequencing

1. infra-ui: tokens → useTheme → AppHeader → tests → v0.6.0 tag.
2. In parallel off the tag: 4 app adoption PRs + 1 edge-plane portal PR.

Out of scope (later waves): the broader look-and-feel pass ("uniform
app-like feel"), exporting tokens as a plain CSS file for the portal to
vendor (kills the §5 duplication — noted for the look-and-feel design).
