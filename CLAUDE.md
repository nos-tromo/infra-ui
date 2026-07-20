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
Tailwind v4 tokens (`src/theme.css`) plus dark, minimal UI primitives, consumed
by the four app frontends (chorus, docint, Nextext, translator) as a
**tag-pinned pnpm git dependency** (`github:nos-tromo/infra-ui#vX.Y.Z`).
Build-time only — never a runtime service; it joins no Docker network and ships
no image. React 19 + Tailwind v4 + tsup + vitest, on its own ESLint + Prettier
toolchain (not the Python apps' ruff/pyrefly/common.mk conventions).

## The committed-`dist/` rule

The built `dist/` (JS + `.d.ts`) is **committed to the repo** so every consumer
gets the same prebuilt, deterministic types — there is no install-time rebuild
(per-consumer `prepare` rebuilds proved unreliable and silently degraded the
`.d.ts` to `any` in some CI environments). **After any change to `src/`, run
`pnpm build` and commit the resulting `dist/` in the same change.** A PR that
touches `src/` but not `dist/` is incomplete.

## Commands

```bash
pnpm install      # install deps (dist is committed, not built on install)
pnpm test         # vitest run — unit tests for every primitive
pnpm test:watch   # vitest watch mode
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm format       # prettier --write
pnpm demo         # Vite kitchen-sink demo for visual review
pnpm build        # tsup -> dist/ (commit dist/ whenever src/ changes)
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
- Primitive set: `Button`, `CopyButton`, `Card`, `Input`, `Select`, `Badge`,
  `Spinner`, `Banner`, plus the `cn` helper. Every primitive has a unit test —
  keep that invariant when adding one.

## Releasing

Consumers pin an annotated git tag. To release: bump `version` in
`package.json`, ensure `dist/` is rebuilt and committed, tag `vX.Y.Z`, then
bump the pin in each consuming app. The README (§ Install/Develop) is the
human-facing doc — keep it and this file in sync when behavior changes.

## Where to look

- `README.md` — install + Tailwind wiring for consumers.
- `docs/` — design spec and the implementation plan the package was built from.
- Federation context (how the four apps consume this, workspace layout):
  `../CLAUDE.md`.
