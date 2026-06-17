# `infra-ui` — Shared Frontend Design System

- **Date:** 2026-06-18
- **Status:** Design — awaiting user review
- **Scope:** A reusable "meta frontend" design layer (tokens + UI primitives) extracted
  from Nextext's look and consumed by every first-party React SPA in `/home/user/dev/infra/`.

> **Note on location:** This spec currently lives in the `docint` repo because `docint` is
> one of the two consumers and `infra-ui` does not exist yet. It is cross-repo in nature and
> can be relocated into `infra-ui/docs/` once that repo is created.

## 1. Goal

Give every React frontend in the infrastructure a single, uniform "Nextext look" without
forcing the apps to share a layout or domain code. Achieve this with one upstream source of
truth so a change to the look propagates by version bump rather than hand-copying.

## 2. Current state

Two first-party React SPAs exist today; both were scaffolded from the same template:

| | docint | Nextext |
|---|---|---|
| Stack | React 19, Tailwind **v4**, Vite 8, pnpm 9 | React 19, Tailwind **v4**, Vite 8, pnpm 9 |
| State / routing | Zustand 5, React Router 7 | Zustand 5, React Router 7 |
| Data | TanStack Query/Table/Virtual, Recharts | TanStack Query/Table/Virtual, Recharts |
| `cn()` helper | `src/lib/cn.ts` (clsx + twMerge) | `src/lib/cn.ts` (**byte-identical**) |
| Tokens | RGB values in `tailwind.config.ts` | HSL values in `globals.css` `@theme` block |
| Accent | **monochrome** (primary = foreground) | **blue** `hsl(217 91% 60%)` (`#4aa3ff`) |
| Layout | persistent **left sidebar** dashboard | centered **header** single-column |
| Common primitives | `KpiCard`, `MergeModeToggle` (domain-ish) | `Spinner`, `ErrorBanner` (generic) |

No other repo under `infra/` ships a first-party React SPA (chorus, translator,
afd-pipeline, vllm-service, data-plane, open-webui have none).

**Implication:** the stacks are already identical, so no reconciliation is needed. The work is
to (a) canonicalize the divergent token syntax, (b) extract genuinely generic primitives, and
(c) ship them as one installable package.

### The "Nextext look", concretely

Dark, minimal, high-contrast (near-black `hsl(240 6% 8%)` bg, near-white text), Inter
throughout, subtle 1px borders and **no shadows**, a single accent for interactive/primary,
red reserved for danger.

## 3. Decisions (locked)

1. **Scope** — the shared layer owns **design tokens + generic UI primitives**. Each app keeps
   its own layout shell and pages. (Rejected: theme-only, shared-shell, full meta-frontend.)
2. **Delivery** — a dedicated `infra-ui` Git repo, installed as a **tag-pinned pnpm Git
   dependency**. No registry, no monorepo. (Rejected: published package, monorepo, copy-forward.)
3. **Palette** — **shared dark neutrals/type/spacing + one per-app accent token**. A consistent
   "family" look with room for per-app identity. (Rejected: one fixed palette, monochrome-only.)

## 4. Architecture

### 4.1 Package shape

```
infra-ui/                       # /home/user/dev/infra/infra-ui
  package.json                  # name "@infra/ui"; peerDeps react/react-dom; "prepare": "tsup"
  tsconfig.json
  tsup.config.ts                # builds dist/ (ESM + .d.ts) on install
  src/
    index.ts                    # barrel — re-exports every primitive + cn
    cn.ts                       # the clsx + twMerge helper (now single-source)
    theme.css                   # the @theme token block (the shared "look")
    primitives/
      Button.tsx
      Card.tsx
      Input.tsx
      Select.tsx
      Badge.tsx
      Spinner.tsx
      Banner.tsx
  demo/                         # kitchen-sink route for eyeballing the look (dev only)
  exports map → "." : dist/index.js (+ types); "./theme.css" : src/theme.css
```

### 4.2 Build & distribution

- Consumed straight from GitHub: `pnpm add github:nos-tromo/infra-ui#v0.1.0`.
- pnpm runs the **`prepare`** lifecycle on install of a Git dependency, so `tsup` compiles
  `dist/` automatically — consumers never need the repo pre-built, and `dist/` stays gitignored.
- `react` / `react-dom` are **peerDependencies** (the app supplies the one React instance;
  pnpm dedupes). `tsup` externalizes them.
- Tailwind utility **class strings survive compilation as plain string literals** in
  `dist/index.js`, which is what lets the consuming app's Tailwind scan them (see 4.5).

### 4.3 Token model — shared base + per-app accent

`src/theme.css` canonicalizes Nextext's palette into one HSL `@theme` block. Neutrals, type,
and radius are **fixed for the whole family**; the accent is the **one knob**:

```css
@theme {
  /* fixed family neutrals (from Nextext) */
  --color-background: hsl(240 6% 8%);
  --color-foreground: hsl(0 0% 98%);
  --color-muted: hsl(240 4% 16%);
  --color-muted-foreground: hsl(240 5% 65%);
  --color-border: hsl(240 4% 22%);
  --color-accent: hsl(240 5% 26%);
  --color-danger: hsl(0 72% 55%);

  /* the ONE per-app knob — falls back to the family blue if unset */
  --color-primary: var(--app-accent, hsl(217 91% 60%));
  --color-primary-foreground: hsl(0 0% 100%);

  /* type + shape */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  --radius: 0.5rem;
}
```

Each app brands itself with **one line** — `:root { --app-accent: hsl(160 84% 39%); }` — or
omits it to inherit the family blue. Custom properties resolve at use time, so an app-level
`--app-accent` override cascades into `--color-primary` with no ordering hazard.

Light mode is **out of scope** but the HSL token structure leaves it addable later (a second
`@theme`/media block) without a rewrite.

### 4.4 Primitives — Tailwind-native, `cva` for variants

Primitives are `.tsx` using Tailwind utility classes against the shared tokens (zero runtime
CSS, fully themeable). Variant-bearing ones use **`class-variance-authority`** (the library's
one new dependency); call sites in the apps keep using `cn()` as today.

**v1 set** (the domain-free things both apps currently hand-roll inline):

| Primitive | Variants | Replaces today |
|---|---|---|
| `Button` | primary / secondary / ghost / danger · sm / md | inline buttons in both apps |
| `Card` | — | the `rounded-lg border bg-zinc-900 p-4` pattern; docint `KpiCard` → wrapper |
| `Input` | — | natively-styled text fields |
| `Select` | — | natively-styled selects |
| `Badge` | neutral / accent / danger | status pills |
| `Spinner` | — | Nextext `Spinner`, lifted as-is |
| `Banner` | info / danger | Nextext `ErrorBanner`; docint Coverage/Validation banners → wrappers |

Domain-specific components stay in their apps (docint `MergeModeToggle`, `EntityInspector`;
Nextext `JobCard`). `SegmentedControl` and a shared `Table` shell are **deferred to v1.5**;
`MergeModeToggle` can later be rebuilt on `SegmentedControl`.

### 4.5 Tailwind v4 integration (the one subtlety)

For Tailwind to emit the utilities the primitives reference, each app's root CSS must scan the
package's compiled output:

```css
@import 'tailwindcss';
@import '@infra/ui/theme.css';                 /* shared tokens */
@source '../../node_modules/@infra/ui/dist';      /* so TW sees the primitives' classes */
:root { --app-accent: hsl(160 84% 39%); }      /* optional per-app brand */
```

Components import normally: `import { Button, Card, cn } from '@infra/ui'`. The `@source` line
is the single non-obvious step and must be documented in `infra-ui`'s README.

## 5. Rollout — 4 independently-shippable phases

**Phase 0 — Stand up `infra-ui` (source of truth).** New repo. Lift Nextext's `globals.css`
palette into the canonical HSL `@theme`; move the shared `cn.ts`; build the v1 primitives using
Nextext's existing inline styles as the visual reference. Add Vitest + the `demo/` route.
Tag **v0.1.0**.

**Phase 1 — Migrate docint (the real test).** docint is the app that diverges, so migrating it
proves the system generalizes:
- `pnpm add github:nos-tromo/infra-ui#v0.1.0`.
- Wire root CSS (import tokens + `@source` + set `--app-accent: hsl(160 84% 39%)` — emerald,
  matching docint's existing active-collection glow).
- Delete docint's `tailwind.config.ts` color block and local `cn.ts`; repoint imports to `@infra/ui`.
- Swap inline buttons/cards for primitives; reduce `KpiCard` to a `Card` wrapper; rebuild
  Coverage/Validation banners on `Banner`. Keep domain components (`MergeModeToggle`,
  `EntityInspector`, `Sidebar`) as-is.
- **Regression gate:** docint's existing Vitest suite stays green.

**Phase 2 — Migrate Nextext onto its own package (close the loop).** Nextext consumes
`@infra/ui` and deletes its now-duplicated tokens / `cn` / `Spinner` / `ErrorBanner`, so the
source of truth is not a fork. Lower urgency; makes "single source of truth" literally true.

**Phase 3 — App #3+ greenfield.** New frontends install `@infra/ui` on day one and start with
the family look + primitives.

**Versioning:** git tags (`v0.1.0`, …). Each app pins a tag in `package.json` and upgrades
independently (move the pin, re-test). No registry, no lockstep.

## 6. Testing

- `infra-ui`: Vitest + Testing Library per primitive — variants emit the expected classes,
  interactive elements expose correct roles/labels (a11y). `demo/` kitchen-sink route for
  visual review. ESLint + Prettier + `tsc --noEmit` to mirror the apps' pre-commit rigor.
- Each consumer's **existing** Vitest suite must stay green across its migration — that is the
  regression gate proving the look changed but behavior did not.

## 7. Non-goals (YAGNI)

No shared layout/shell, no shared pages, no light mode (tokens *structured* to allow it later),
no Storybook, no monorepo, no private registry. `SegmentedControl` / shared `Table` deferred to
v1.5.

## 8. Choosable details (confirm during review)

- Package name `@infra/ui` and repo path `/home/user/dev/infra/infra-ui`.
- GitHub slug in the install URL: `nos-tromo/infra-ui` (assumed from the git user).
- docint accent = emerald `hsl(160 84% 39%)`; Nextext keeps blue `hsl(217 91% 60%)`.
- Whether `SegmentedControl` joins v1 (to fold in docint's `MergeModeToggle`) or waits for v1.5.

## 9. Success criteria

1. `infra-ui` v0.1.0 builds on `pnpm add` via `prepare`, exports tokens + 7 primitives + `cn`.
2. docint consumes it: its color block and local `cn.ts` are gone, buttons/cards/banners render
   from `@infra/ui`, it shows the emerald accent, and its test suite is green.
3. A change to a token or primitive in `infra-ui`, tagged and re-pinned, visibly propagates to
   docint with no per-file copying.
4. Nextext (Phase 2) consumes the same package with its duplicated primitives/tokens removed.
