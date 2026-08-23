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

## What the check does and does not guarantee

`validate_infra_ui_pin.py` checks the pin's **form**, never its freshness. It
requires every `@infra/ui` spec in the frontend's `package.json` to match
`https://codeload.github.com/nos-tromo/infra-ui/tar.gz/<40 hex>`, and every
`nos-tromo/infra-ui` line in `pnpm-lock.yaml` to carry a 40-hex revision so a
stale lockfile cannot keep installing a tag ref after the manifest was fixed. A
consumer with no frontend, or one whose manifest does not depend on `@infra/ui`,
is skipped rather than failed. Nothing in the check knows which release is
current, so a consumer several releases behind this package's `main` is green.

That is where the parallel with the federation's SHA-pinned Actions refs stops:
those are kept current for you by each repo's Dependabot, and these deliberately
are not (the [README](../README.md#releasing) has the rollout steps). A pin moves
only when someone opens a PR in that consumer repo, so the four frontends are
routinely on different releases of this package, and a change made here reaches
an app only once its own bump lands.

## The committed `dist/` rule

The built `dist/` (`index.js`, `index.d.ts`, `tokens.css`)
is **committed to the repo**, so every consumer pinning a given commit installs
byte-identical output — there is no install-time rebuild. (Rebuilding per-consumer under `prepare` proved
unreliable: a tag-pinned git dependency rebuilt in some CI environments emitted a degraded
`.d.ts`, silently making the primitives `any`.) After changing `src/`, run `pnpm build`
and commit `dist/`.
