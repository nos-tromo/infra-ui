# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Data confidentiality — hard rule

**NEVER expose actual production or testing data in any file committed or
pushed to git.** This covers not only file contents but also metadata that
references real data: filenames, file descriptions, social-media account
names or handles, user identifications, sample records, log excerpts, and
screenshots. It applies everywhere git sees — source code, tests, fixtures,
docs, examples, configs, commit messages, and CI files. Use fully synthetic,
invented placeholders instead.

**Likewise, NEVER expose local filepaths from development machines** —
absolute paths or home directories such as `/Users/<name>/...`,
`/home/<name>/...`, or `C:\Users\...` — anywhere git sees. The only
permitted paths are relative project paths starting from the project's
root (e.g. `docker/compose.yaml`).

## What this repo is

`@infra/ui` — the shared React design system for the nos-tromo federation:
Tailwind v4 tokens (`src/theme.css`) plus light/dark themeable, minimal UI primitives (OS-preference default), consumed
by the four app frontends (chorus, docint, Nextext, translator) as a
**commit-SHA-pinned pnpm tarball dependency**
(`https://codeload.github.com/nos-tromo/infra-ui/tar.gz/<full-40-hex-sha>`) —
never a tag, never the `github:` shorthand; each consumer's CI enforces the
pin form with `validate_infra_ui_pin.py`. Rationale: `docs/pinning.md`.
Build-time only — never a runtime service; it joins no Docker network and ships
no image. React 19 + Tailwind v4 + tsup + vitest, on its own ESLint + Prettier
toolchain (not the Python apps' ruff/pyrefly/common.mk conventions).

## The committed-`dist/` rule

The built `dist/` (JS + `.d.ts` + `tokens.css`) is **committed to the repo** so
every consumer gets the same prebuilt, deterministic output — there is no
install-time rebuild (per-consumer `prepare` rebuilds proved unreliable and
silently degraded the `.d.ts` to `any` in some CI environments). **After any
change to `src/`, run `pnpm build` and commit the resulting `dist/` in the
same change.** A PR that touches `src/` but not `dist/` is incomplete.

## Commands

```bash
pnpm install      # install deps (dist is committed, not built on install)
pnpm test         # vitest run — unit tests for every primitive
pnpm test:watch   # vitest watch mode
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm format       # prettier --write
pnpm demo         # Vite kitchen-sink demo for visual review
pnpm build        # tsup -> dist/, then scripts/build-tokens.mjs -> dist/tokens.css
                  # (commit dist/ whenever src/ changes)
```

## Design constraints

- **Semantic tokens only.** Primitives style themselves exclusively via the
  semantic design tokens defined in `src/theme.css` (`bg-primary`,
  `text-muted-foreground`, `border-border`, …) — never raw Tailwind palette
  colors. Apps re-theme everything by setting `--app-accent`.
- **Consumers need the `@source` line.** Apps must add
  `@source '../node_modules/@infra/ui/dist'` to their root CSS or Tailwind
  won't generate the utility classes the primitives reference. Keep this in
  mind when changing which classes the primitives emit.
- **Peer deps, not deps.** `react`/`react-dom` (v19) stay peer dependencies;
  runtime deps are limited to the styling utilities (cva, clsx,
  tailwind-merge).
- Primitive set: `AppShell`, `SidebarGroup`, `PageHeader`, `UserMenu`, `AppHeader`,
  `Button`, `CopyButton`, `Card`, `Input`, `Select`, `SelectMenu`, `Badge`,
  `Spinner`, `Banner`, `FileList`, `ForceGraph`, `IconButton`/`IconLink` and the
  named icon actions, plus the `cn` helper. `SelectMenu` is the custom picker for
  when a native `<select>` popup cannot be styled — reach for `Select` first.
  Every primitive has a unit test — keep that invariant when adding one.
- **Icons are drawn, never typed.** The shared set is `src/icons/` — inline SVG,
  `currentColor`, `aria-hidden`, sized by the caller. Never a character such as
  `×`, `▾`, `⤓` or `☀`: those render from whatever font the browser and OS fall
  back to, so weight and size differ on every machine, and in a control with no
  text of its own that drawing *is* the affordance. `ThemeToggle` carries the
  same rule in its own comment; the icon set is where new ones go.
- **Icon actions are imported, not composed.** `IconButton` (always visible,
  `ghost` by default so it has no background until hovered) and `IconLink` (the
  `<a>` shell, for a file the server streams) are the base; `DownloadButton`,
  `DownloadLink`, `NewButton`, `RemoveButton`, `DeleteButton`, `MoveUpButton` and
  `MoveDownButton` in `src/primitives/iconActions.tsx` bind one icon to one meaning so four apps do
  not each arrive somewhere slightly different. Adding one — print, refresh,
  share — is an icon in `src/icons/` plus a wrapper of the same few lines; do
  not answer a new need by hand-rolling a button in an app. `RemoveButton` (`×`)
  takes something out of a list or view, `DeleteButton` (trash) destroys stored
  data — the icon is what tells the user how far the action goes, so keep them
  distinct. `NewButton` (`+`) is the one constructive action and so wears no
  `danger` tint; it stays undivided (no separate "add") because a plus meaning
  two things would draw the same either way. `label` is required on all of them
  (it is the accessible name and the tooltip), `children` adorns the icon where
  several sit side by side, and `busy` swaps in a `Spinner` and blocks the
  second click.
- `AppShell` is the chrome frame apps wrap their routed content in (sidebar via
  `SidebarGroup`, `PageHeader` per route, `UserMenu` for identity) and styles
  its frame background from the `--color-chrome` token — declared in
  `src/theme.css` alongside the other semantic tokens.
- **`dist/tokens.css` is generated, never hand-edited.** It's a plain-CSS
  (non-Tailwind) export of the same tokens in `src/theme.css`, for build-free
  static-HTML consumers (e.g. edge-plane's portal) that can't process a
  Tailwind `@theme` block. `scripts/build-tokens.mjs` emits it from
  `src/theme.css` as part of `pnpm build`; `src/tokens.test.ts` fails CI if the
  committed file drifts from the source. Changing a token value only ever
  means editing `src/theme.css` and rebuilding — never touching
  `dist/tokens.css` directly.
- **The dimensional tokens are pinned to Tailwind's defaults — they are not a
  design choice.** `@theme` declares eight of them (`--text-xs`, `--text-sm`,
  `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`, `--radius-md`,
  `--radius-lg`) at exactly the values Tailwind already uses. The point is not
  to set a scale but to *export* one: build-free consumers can't reach
  Tailwind's defaults, so without these they hand-type every size and radius.
  Because `@theme` merges with the default theme rather than replacing it,
  re-declaring a default emits nothing new for the four Tailwind consumers —
  which is what makes changing one dangerous. Editing a value here silently
  restyles every SPA. `src/dimensional-tokens.test.ts` pins each to
  `node_modules/tailwindcss/theme.css` and fails if they diverge, including
  after a Tailwind upgrade that changes a default upstream.

  Deliberately absent, and worth leaving absent: `--text-*--line-height`
  (Tailwind keys these separately, so declaring them would change rendering)
  and `--spacing` (a multiplier base — `p-4` compiles to
  `calc(var(--spacing) * 4)` — so no hand-written rule would read it).
  Background: `docs/2026-07-31-dimensional-tokens-design.md`.

## Releasing

`main` is the trunk. A release is an annotated `vX.Y.Z` tag minted **on merge**
by the shared `release-tag` workflow, which reads `package.json`'s `version` —
tags are not hand-cut. So: bump `version` in `package.json`, ensure `dist/` is
rebuilt and committed, and merge; bumping the version in the release PR is the
whole release action. Rolling the release out to consumers is then manual —
resolve the tag to its SHA and update each app's pin — because Dependabot is
deliberately out of that loop. Runbook: README § Releasing.

The README (§ Install, § Develop, § Releasing) is the human-facing doc — keep
it and this file in sync when behavior changes.

## Where to look

- `README.md` — install + Tailwind wiring for consumers.
- `docs/README.md` — index over the in-repo reference: `docs/components.md`
  (props, keyboard maps, worked examples), `docs/icon-policy.md` (the
  drawn-never-typed rule and what each named action may mean — the human-facing
  canonical copy of the icon constraints above), `docs/pinning.md` (why a SHA
  and not a tag, why `dist/` is committed).
- `docs/design.md` + `docs/implementation-plan.md` — the superseded v0.1.0
  spec, kept as design history only; dated design/plan files sit alongside.
- Federation context (how the four apps consume this, workspace layout):
  `../CLAUDE.md`.
