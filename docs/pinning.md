# Pinning and distribution

Why consumers pin a commit-SHA codeload tarball rather than a tag, and why the
built `dist/` is committed to this repo instead of being rebuilt on install.
The pin snippet itself is in the [README](../README.md#install).

## Why a SHA, not a tag

A tag is a mutable ref: whoever can move it controls the code every install
fetches, and pnpm records no integrity hash for tarball URLs, so the lockfile
would not notice. The SHA URL is content-addressed — same policy as the
federation's SHA-pinned GitHub Actions refs, and enforced the same way: the
shared `python-app-ci` lint job runs `validate_infra_ui_pin.py` against every
consumer. (The `github:` shorthand is additionally off-limits because
Dependabot rewrites it to a git+SSH lockfile entry that breaks keyless CI and
git-less Docker builds.) The version stays readable in the consumer lockfile's
resolved `version:` field.

## The committed `dist/` rule

The built `dist/` (JS + `.d.ts`)
is **committed to the repo**, so every consumer gets the same prebuilt, deterministic
types — there is no install-time rebuild. (Rebuilding per-consumer under `prepare` proved
unreliable: a tag-pinned git dependency rebuilt in some CI environments emitted a degraded
`.d.ts`, silently making the primitives `any`.) After changing `src/`, run `pnpm build`
and commit `dist/`.
