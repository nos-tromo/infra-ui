# @infra/ui Documentation

This directory contains the in-repo reference for **`@infra/ui`**, the shared
React design system for the nos-tromo federation. It complements the top-level
[`README.md`](../README.md) (which focuses on install, Tailwind wiring and the
primitive inventory) with topic-by-topic detail.

## Table of contents

| Document | What it covers |
|---|---|
| [components.md](components.md) | Props, keyboard maps and worked examples for `AppShell`, `SelectMenu`, the icon actions and `ForceGraph`, plus the icon inventory |
| [icon-policy.md](icon-policy.md) | Why icons are drawn as inline SVG and never typed as characters, and what each named icon action is allowed to mean |
| [pinning.md](pinning.md) | Why consumers pin a commit-SHA codeload tarball rather than a tag, and why `dist/` is committed instead of rebuilt on install |

Design history — the dated design and plan files for each feature wave, plus
the superseded v0.1.0 spec — lives alongside these in the same directory.

## Who this is for

- **App developers** consuming `@infra/ui` in a frontend — start with the
  top-level [`README.md`](../README.md) for install and the `@source` line,
  then [components.md](components.md) for the components that take more than
  a prop or two.
- **Contributors to this package** adding or changing a primitive — read
  [icon-policy.md](icon-policy.md) before adding anything with an icon in it,
  and the committed-`dist/` rule in [pinning.md](pinning.md) before opening a
  PR that touches `src/`.
- **Whoever rolls a release out to the four consumers** — the runbook is
  the top-level [`README.md`](../README.md#releasing); the reasoning behind
  the pin form it enforces is [pinning.md](pinning.md#why-a-sha-not-a-tag).

## Conventions used in these docs

- **Source references** are repo-relative paths (for example
  `src/primitives/iconActions.tsx`) so editors can jump straight to the file.
- **Code examples** are TSX as an app would write it — the import is always
  from the `@infra/ui` barrel, never from a deep path into `dist/`.
- **Version references** name the release a behaviour landed in (`v0.14.0`)
  rather than a date.
- Documentation is plain Markdown (GitHub Flavored). No build step is required.
