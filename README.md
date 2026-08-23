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

`react` and `react-dom` (v19) are peer dependencies, and the built `dist/` is
committed to this repo — there is no install-time rebuild. See
[pinning.md](docs/pinning.md#why-a-sha-not-a-tag) for why a SHA and not a tag,
and [pinning.md](docs/pinning.md#the-committed-dist-rule) for the
committed-`dist/` rule.

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
  AppShell, SidebarGroup, PageHeader, UserMenu, AppHeader, Button, CopyButton,
  Card, Input, Select, Badge, Spinner, Banner, FileList, ForceGraph, cn,
} from '@infra/ui'
```

### AppShell

The app-wide chrome — collapsible sidebar, home link, theme toggle, and
`UserMenu` — wraps every route's content.

```tsx
<AppShell title="kitchen-sink" version={appVersion} user="jane.doe" sidebar={sidebar}>
  <div className="p-8">
    <PageHeader title="Primitives" caption="Every exported component, both themes" />
    {/* routed content */}
  </div>
</AppShell>
```

Sidebar composition, the header-only shell (Nextext, translator) and the full
worked example: [components.md](docs/components.md#appshell).

## Primitives

`AppShell` (chrome frame: sidebar, home link, theme toggle, `UserMenu`) ·
`SidebarGroup` (labeled sidebar section) · `PageHeader` (route title + caption,
one per route) · `UserMenu` (identity + sign-out dropdown) ·
`AppHeader` (portal link, identity, tri-state theme toggle) · `Button` (primary/secondary/ghost/danger · sm/md) · `CopyButton` (icon-only,
copies text to the clipboard) · `Card` (plain or tile-style with `title`/`interactive`) · `Input` · `Select` ·
`SelectMenu` (custom value picker, for when a native popup cannot be styled) ·
`Badge` (neutral/accent/danger) · `Spinner` · `Banner` (info/danger) ·
`IconButton`/`IconLink` · `HoverIconAction` (the same icon button, kept invisible
until its `.group` row is hovered or focused) · the named icon actions ·
`FileList` · `ForceGraph`.

Props, keyboard maps and worked examples: [components.md](docs/components.md).
Why the icons are drawn rather than typed, and what each named action may mean:
[icon-policy.md](docs/icon-policy.md).

## Theming

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

## Documentation

[`docs/`](docs/) carries the reference material this README points into — start
at [docs/README.md](docs/README.md).

Design history lives alongside it and is not current documentation: the dated
design and plan files for each feature wave, plus [design.md](docs/design.md)
and [implementation-plan.md](docs/implementation-plan.md), which are the
superseded v0.1.0 spec — they still describe the `github:` install form, an
install-time `prepare` rebuild and a dark-only palette, none of which hold.
