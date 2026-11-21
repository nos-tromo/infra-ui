# App icons

The favicons of the federation's surfaces: one per surface, drawn as a family
so the tabs read as one system and each app is still told apart at a glance.
The files live in each app's own repository, not in this package; this page
holds the rules they share, so a new surface or a redrawn icon stays in the
family.

## Where they live

| Surface | Repository | Files |
|---|---|---|
| Portal, with the login, information and code pages | `edge-plane` | `landing/` (Authelia's copy of `favicon.ico`: `authelia/assets/`) |
| docint | `docint` | `frontend/public/` |
| Nextext | `Nextext` | `frontend/public/` |
| translator | `translator` | `frontend/public/` |
| Ghostwriter | `ghostwriter` | `frontend/public/` |
| Grafana | `obs-plane` | `grafana/brand/` |
| Audit viewer | `obs-plane` | `grafana-audit/brand/` |

A favicon is the app's identity, like its `<title>` and its `--app-accent`,
and both of those already live in the app. The portal is hand-written HTML and
Grafana a pulled image, so neither could consume this package anyway; keeping
the files here would buy no single source, and every redraw would cost a
release and four pin bumps for files that rarely change.

App icons are not UI icons. The set in `src/icons/` is glyphs in
`currentColor` that sit inside controls; an app icon is a coloured tile that
names the whole app and is never part of a control
([icon-policy.md](icon-policy.md#app-icons-are-not-ui-icons)).

## The rules

- **An SVG in a 32 × 32 box:** `viewBox="0 0 32 32"`, paths and basic shapes
  only. No text, no `<style>`, no media query.
- **A tile in the light accent:** `<rect width="32" height="32" rx="7" fill="…">`
  fills the box, in the app's light `--app-accent`. The tile carries the icon on
  light and dark tab strips alike, so there is no dark variant.
- **A white glyph:** strokes 2.5–3 units wide, about 1.5 px at 16 px, with
  round caps and joins. Where an outline would blur at 16 px, the shape is
  filled instead (the portal's grid, docint's nodes, Ghostwriter's bubble).
- **One idea, readable at 16 px:** judge an icon at 16 px on a screen at 100 %
  scale, where it is at its worst. Simple and concise beats detailed and
  playful: a detail that disappears at 16 px is noise.
- **A silhouette of its own:** a new icon must not share its outline with one
  already in the family (the table below), nor with a UI icon an app shows
  beside it.
- **Drawn, never typed:** the [icon policy](icon-policy.md) holds here too.
  translator's 文A is paths, not text.

## The family

| Surface | Symbol | Tile (light accent) | Dark accent |
|---|---|---|---|
| Portal | 2 × 2 grid of rounded squares: the app overview | `#3f3f46`, neutral zinc | none (no app accent) |
| docint | network of nodes, a hub with four neighbours, two of them linked: connections in a large body of documents | `#0b7f58`, `hsl(160 84% 27%)` | `hsl(160 84% 39%)` |
| Nextext | symmetric waveform of five bars: audio and video | `#7c3bed`, `hsl(262 83% 58%)` | `hsl(262 83% 70%)` |
| translator | 文A: translation | `#0a5adb`, `hsl(217 91% 45%)` | `hsl(217 91% 60%)` |
| Ghostwriter | speech bubble with two eyes: the chat agent | `#bb1b50`, `hsl(340 75% 42%)` | `hsl(340 75% 62%)` |
| Grafana | curve over a baseline: measurements over time | `#d15a05`, `hsl(25 95% 42%)` | none (favicon only) |
| Audit viewer | shield with a check mark: the audit trail | `#d15a05`, as Grafana | none (favicon only) |

An app's accent must reach 4.5:1 as text: the light value on `#fff`, the dark
one on the dark background `hsl(240 6% 8%)`. White on each tile reaches at
least 4:1. Each app's `src/favicon.test.ts` checks that its tile is its light
`--app-accent`, so the two cannot drift apart.

## Files and head

| File | What |
|---|---|
| `favicon.svg` | the source |
| `favicon-32.png` | 32 × 32, for browsers without SVG favicons |
| `apple-touch-icon.png` | 180 × 180 and full-bleed, with no transparent corners: iOS rounds its own |
| `favicon.ico` | portal only: 16 and 32 px, for the browser's own `/favicon.ico` request and Authelia's login page |

Grafana's PNGs are named after the image files they replace (`fav32.png`,
`apple-touch-icon.png`); obs-plane's `docs/grafana-access.md` says where they
are mounted.

The head links them in this order, PNG first and SVG second, so a browser that
reads SVG favicons takes the SVG and the others the PNG:

```html
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

In the apps the files sit in `frontend/public/`, and Vite prefixes the `base`
(`/docint/favicon.svg`). The portal links them absolutely, as it does
`/tokens.css`, and the gateway serves them without a session.

## Rendering

With `rsvg-convert` (librsvg). `-b` fills the touch icon's corners with the
tile colour:

```sh
rsvg-convert -w 32 -h 32 favicon.svg -o favicon-32.png
rsvg-convert -w 180 -h 180 -b '#0b7f58' favicon.svg -o apple-touch-icon.png
```

The portal's `favicon.ico` holds a 16 px and a 32 px PNG
(`rsvg-convert -w 16 -h 16 favicon.svg -o favicon-16.png`, then):

```python
import struct
from pathlib import Path

pngs = [Path(f"favicon-{n}.png").read_bytes() for n in (16, 32)]
head = struct.pack("<HHH", 0, 1, len(pngs))
offset, entries = 6 + 16 * len(pngs), b""
for png in pngs:
    width, height = struct.unpack(">II", png[16:24])
    entries += struct.pack("<BBBBHHII", width, height, 0, 0, 1, 32, len(png), offset)
    offset += len(png)
Path("favicon.ico").write_bytes(head + entries + b"".join(pngs))
```

## Changing an icon

Redraw the SVG and render the PNGs again in the app's repository, and release
it with the app's next version. One file has a second copy: the portal's
`favicon.ico` sits in edge-plane's `authelia/assets/` too, for Authelia's
login page, and edge-plane's smoke test compares the two. A changed accent
changes the tile with
it, and the app's favicon test fails until both agree. A browser may show the
old icon from its cache for a while.
