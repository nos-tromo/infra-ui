// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(fileURLToPath(new URL('./ForceGraph.tsx', import.meta.url)), 'utf8')
const theme = readFileSync(fileURLToPath(new URL('../theme.css', import.meta.url)), 'utf8')

// Tailwind utility suffixes that are not color tokens (sizing, direction,
// alignment, style keywords) — these share the same `prefix-word` shape as
// color utilities but never correspond to a `--color-*` variable.
const NON_COLOR_SUFFIXES = new Set([
  'xs',
  'sm',
  'base',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  'center',
  'left',
  'right',
  'start',
  'end',
  't',
  'b',
  'l',
  'r',
  'x',
  'y',
  'solid',
  'dashed',
  'dotted',
  'double',
  'none',
  'collapse',
  'separate',
  'current',
  'transparent',
  'inherit',
])

const CLASS_RE = /\b(?:bg|text|fill|stroke|border|accent)-([a-zA-Z0-9-]+)/g

function semanticColorTokens(src: string): string[] {
  const tokens = new Set<string>()
  for (const match of src.matchAll(CLASS_RE)) {
    let suffix = match[1]
    // strip opacity modifier, e.g. `surface/90` -> `surface`
    suffix = suffix.split('/')[0]
    if (NON_COLOR_SUFFIXES.has(suffix)) continue
    if (/^\d+$/.test(suffix)) continue
    tokens.add(suffix)
  }
  return [...tokens]
}

test('every semantic color utility class in ForceGraph.tsx maps to a --color-* token in theme.css', () => {
  const tokens = semanticColorTokens(source)
  expect(tokens.length).toBeGreaterThan(0)

  const missing = tokens.filter((token) => !theme.includes(`--color-${token}`))

  expect(missing).toEqual([])
})
