# Dimensional tokens: exporting the type/shape/spacing scale

Date: 2026-07-31
Status: approved, not yet implemented

## Problem

`@infra/ui` exports its **colour** system to build-free consumers via
`dist/tokens.css`, but nothing dimensional. The `@theme` block ships exactly
three non-colour values — `--font-sans`, `--font-mono`, `--radius`.

The four SPAs don't notice: they consume the library through Tailwind, which
supplies its default type/radius/spacing scales. The edge-plane portal
(`landing/index.html`, `authcode/index.html`) is unprocessed static HTML and
cannot reach those defaults, so every dimension there is a hand-typed literal.

The result is an asymmetry inside one file. Colour is fully tokenised, with a
comment reading "no more hand-copied values to drift" — while beside it sit
seven distinct font sizes (`.8`, `.85`, `.875`, `.9`, `1`, `1.1`, `1.4rem`),
four radii (`.4`, `.5`, `.6rem`, `50%`) and eleven off-grid spacing values.
Only two of those font sizes land on a scale step.

"Make the portal consistent" therefore decomposes into three claims worth
separating:

1. **Internally coherent** — one value per role. Largely true already.
2. **On-scale** — values are steps of the scale the SPAs use. Mostly false.
3. **Token-sourced** — values come from `tokens.css` and cannot drift. False
   for every dimension.

This design addresses 2 and 3, which is where the actual drift risk lives.

## Decisions

| Question | Decision |
|---|---|
| What is the exported scale authoritative over? | **Faithful re-export** of Tailwind's defaults. Not a redesign — the goal is exportability, not new values. |
| What happens to portal values between steps? | **Snap to the nearest step.** ~15 values move, all by ≤2.4px. |
| Spacing? | Portal values **snapped** to the `.25rem` grid, as plain rem values (no `calc()`). The `--spacing` token itself is **not** exported — it is a multiplier base, not a value, so nothing would read it. |
| Drift guard? | **Yes** — CI check in edge-plane. |
| Blast radius? | **Six PRs**: infra-ui, edge-plane, and re-pins for all four SPAs. |
| Token reference style in the portal? | **Direct** `var(--text-sm)` in each rule, with a comment block recording which step each role uses. No portal-local alias layer. |

Rejected: a narrowed federation scale (clearing Tailwind's defaults with
`--text-*: initial`) would make off-scale usage in the SPAs a build error.
Higher value, but it turns a zero-risk plumbing change into a four-frontend
migration. Revisit separately if desired.

Rejected: a portal-local semantic layer (`--portal-tile-title: var(--text-lg)`).
A second indirection for a two-page site with one consumer, and it forces the
guard to allow a second family of names — the hole a future literal slips
through.

## Section 1 — infra-ui

**No generator, test, or vendoring change is required.**
`scripts/build-tokens.mjs` already extracts the entire `@theme` block and
writes it to `dist/tokens.css`; `src/tokens.test.ts` already drift-checks the
committed output. Anything added to `@theme` is exported automatically.

Add to `src/theme.css`'s `@theme` block:

```css
/* Dimensional scale. Declared at Tailwind's own default values, so the four
   Tailwind consumers compile byte-identically — the point is not to change the
   scale but to make it exportable, since build-free consumers (edge-plane's
   static portal) cannot reach Tailwind's defaults. */
--text-xs:   0.75rem;
--text-sm:   0.875rem;
--text-base: 1rem;
--text-lg:   1.125rem;
--text-xl:   1.25rem;
--text-2xl:  1.5rem;
--radius-md: 0.375rem;
--radius-lg: 0.5rem;
```

Eight tokens, not nine: `--spacing` is deliberately excluded — see below.

Why this is visually free: Tailwind v4's `@theme` **merges** with the default
theme rather than replacing it — replacing requires an explicit
`--text-*: initial`. Declaring a step at its existing default value changes
nothing about what Tailwind emits.

Deliberate exclusions:

- **Line-heights.** Tailwind keys them separately (`--text-sm--line-height`),
  so declaring `--text-sm` alone leaves them at their defaults and the SPAs are
  untouched. The portal currently uses browser-normal line-height throughout;
  introducing line-height tokens would change its rendering and is out of
  scope.
- **`--radius` is kept**, unchanged, for backward compatibility — two
  primitives use `rounded-[--radius]`. Note it is `0.5rem`, the *same value* as
  the new `--radius-lg`. Shipping both is mild redundancy, accepted here
  because collapsing them requires deciding infra-ui's shape scale (see
  Deferred).
- **`--spacing` is excluded**, because it is a different kind of token from
  the rest. `--text-*` and `--radius-*` are *values* and substitute directly in
  hand-written CSS (`font-size: var(--text-sm)` → `0.875rem`). `--spacing` is a
  *multiplier base*: Tailwind's `p-4` compiles to `calc(var(--spacing) * 4)`,
  so using it in the portal would mean writing
  `padding: calc(var(--spacing) * 4)` instead of `1rem`.

  Section 2 snaps the portal's spacing to the grid as plain rem values, so the
  portal lands *on* the grid without ever *reading* the token — and the SPAs
  already get `0.25rem` from Tailwind regardless. Exporting it would therefore
  add a token no consumer reads, which later invites the reading "the system
  defines this, so it must matter". Every other exported token is read by the
  portal; this one would not be.

Version: `0.7.1` → **`0.8.0`** (additive, non-breaking).

## Section 2 — edge-plane portal migration

Every dimensional literal becomes a `var()`. A comment block at the top of the
`<style>` block records which step each role uses.

### Type

| selector | now | token | px |
|---|---|---|---|
| `h1` | `1.4rem` | `--text-xl` | 22.4 → **20** |
| `.tile .app`, `dialog h2`, `dialog .close` | `1.1rem` | `--text-lg` | 17.6 → **18** |
| `.tile p`, `dialog.tile-dialog`, `.sub` | `.85rem` | `--text-sm` | 13.6 → **14** |
| `#pwform input`, `#pwform button` | `.9rem` | `--text-sm` | 14.4 → **14** |
| `.hint`, `.checklist` | `.8rem` | `--text-xs` | 12.8 → **12** |
| `header.topbar` | `.875rem` | `--text-sm` | 14 → 14 |
| `#theme-toggle` | `1rem` | `--text-base` | 16 → 16 |
| `authcode p.muted` | `.875rem` | `--text-sm` | 14 → 14 |
| `authcode #otc` | `1.6rem` | `--text-2xl` | 25.6 → **24** |

### Radius

| now | token | px |
|---|---|---|
| `.4rem` (`#pwform input`/`button`, `dialog .close`) | `--radius-md` | 6.4 → **6** |
| `.6rem` (`.tile`, `dialog.tile-dialog`, `authcode pre`) | `--radius-lg` | 9.6 → **8** |
| `.5rem` (`#theme-toggle`, `a.signout`) | `--radius-lg` | 8 → 8 |
| `50%` (`.dot`) | *unchanged* | a circle is not a scale value |

### Spacing

Snapped to the `.25rem` grid as plain rem values:

```
dialog padding    1.25rem 1.4rem  ->  1.25rem 1.5rem
.close top/right  .6rem / .7rem   ->  .5rem / .75rem
.close padding    .25rem .4rem    ->  .25rem .5rem
.tile padding     1rem 1.1rem     ->  1rem
.tile p margin    .4rem 0 0       ->  .5rem 0 0
#pwform padding   .5rem .6rem     ->  .5rem
.checklist        .35rem margin, 1.1rem padding-left  ->  .25rem, 1rem
.checklist li     .15rem margin   ->  .25rem
```

### Two structural notes

- **`authcode #otc` is an inline `style=` attribute**, not a rule — invisible
  to a guard that reads the `<style>` block. It moves into the block as
  `#otc { font-size: var(--text-2xl); letter-spacing: .2rem; }`. Its
  `letter-spacing: .2rem` stays a literal: letter-spacing is not on a token
  scale and is not guarded.
- **`.checklist li` margin `.15rem` → `.25rem` is the one proportionally large
  shift** (+67%, ~1.6px per item) and will visibly loosen that list. Snapping
  is still correct — a bespoke `.15rem` is precisely the drift being removed.

Largest single movement anywhere: `h1` at −2.4px. Nothing else exceeds 1.6px.

## Section 3 — guard, verification, rollout

### Guard

`edge-plane/scripts/check-no-literal-dimensions.sh`, wired into `ci.yml`
alongside `check-tokens-vendor.sh`:

```
scans:  landing/index.html, authcode/index.html
        — the <style> block AND inline style= attributes
fails:  font-size: <n>rem   |   border-radius: <n>rem
allows: var(--text-*), var(--radius-*), 50%, inherit/initial
```

Inline-attribute scanning is load-bearing: that is exactly where the OTC size
hides today.

Spacing is deliberately **not** guarded. It is snapped in this change, but
per-element padding is legitimately bespoke and a guard there would fight
ordinary work.

### Verification

**infra-ui** (fully offline, and the stronger of the two):

1. Each declared value must equal the corresponding default in
   `node_modules/tailwindcss/theme.css`. This is what makes "visually free" a
   verified claim rather than a hope.
2. `pnpm build` regenerates `dist/tokens.css`; `dist/` is committed in the same
   change (repo rule).
3. `pnpm test` — `tokens.test.ts` drift check must pass.
4. Build **docint's** frontend before and after the bump; the emitted CSS
   bundle must be byte-identical. docint is the right subject because it is
   already on `v0.7.1`, so this change is the only delta — a `v0.6.3` consumer
   would also carry two releases of unrelated change.

**edge-plane**:

- *Preferred:* bring the gateway up and measure the portal and `/auth-code/`
  through Caddy in both themes.
- *Fallback (Docker unavailable):* extract the `<style>` block, serve it over
  localhost, read computed styles — tests the cascade faithfully but not the
  end-to-end render. Used successfully for PR #19.

Either way the check is mechanical: every migrated rule must compute to the px
value tabulated above, and the diff must contain **no unintended movement**.
The tables in Section 2 are the expected-value list; anything else is a bug.

### Rollout

```
1.    infra-ui    declare scale, pnpm build, commit dist/, v0.8.0     (blocks all)
2.    edge-plane  re-vendor tokens.css, snap literals, add guard      (needs 1 TAGGED)
3-6.  chorus, translator, docint, Nextext   re-pin to v0.8.0          (independent of 2)
```

PRs 3–6 are pure pin bumps with no source change; each needs `make verify` plus
its own CI run. `chorus` and `translator` jump two releases
(`v0.6.3` → `v0.8.0`) and so also pick up the `FileList`/`webkitRelativePath`
fix and the tokens export from `v0.7.0`–`v0.7.1`; check their release notes
rather than assuming the bump is inert for them specifically.

Sequencing caveat: PR 2 cannot be verified until PR 1 is **tagged**, because
edge-plane re-vendors from a pinned ref. The start of this rollout is genuinely
serial.

## Out of scope / deferred

- **Collapsing `--radius` and `--radius-lg`**, which hold the same value. Needs
  a decision on infra-ui's shape scale: the library declares one `--radius` but
  its primitives use `rounded-md` (6×), `rounded-lg` (3×), `rounded-full` (2×)
  and `rounded-[--radius]` (2×). Worth its own change.
- **A narrowed federation scale** (`--text-*: initial`) — see Rejected above.
- **Line-height tokens** for the portal.
- **`letter-spacing`**, which has no token scale.
- **The portal's `--accent` / `--ok` / `--down`** staying portal-local
  literals. This is a documented decision (AA-checked against unprocessed
  surfaces, no Tailwind to derive from), not drift.
- **The top bar's centred column**, a deliberate departure from AppHeader's
  full-bleed `px-4` for grid alignment.

## Risks

| Risk | Mitigation |
|---|---|
| A declared value differs from Tailwind's default → SPAs shift silently | Verification step 1 compares against the installed Tailwind; step 4 diffs a built bundle |
| `dist/` not rebuilt with `src/` | `tokens.test.ts` fails CI (existing guard) |
| Portal literal creeps back later | New CI guard, including inline attributes |
| chorus/translator two-release jump carries unrelated changes | Read `v0.7.0`/`v0.7.1` notes before merging those two |
| Gateway unavailable when verifying PR 2 | Documented offline harness fallback |
