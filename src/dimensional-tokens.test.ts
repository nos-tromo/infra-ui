// @vitest-environment node
//
// The dimensional scale exported to build-free consumers (edge-plane's static
// portal), which cannot reach Tailwind's defaults the way the SPAs can.
//
// These values are deliberately NOT a redesign: each must equal Tailwind's own
// default, so declaring them changes nothing about what Tailwind emits for the
// four SPA consumers.
//
// This test reads Tailwind's own theme.css on purpose. Hardcoding the values
// here would assert only that we typed them twice; reading upstream is what
// makes a Tailwind bump that changes a default fail HERE, rather than silently
// shifting the portal.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const themeCss = readFileSync(fileURLToPath(new URL('./theme.css', import.meta.url)), 'utf8')
const tailwindCss = readFileSync(
  fileURLToPath(new URL('../node_modules/tailwindcss/theme.css', import.meta.url)),
  'utf8',
)

const DIMENSIONAL = [
  '--text-xs',
  '--text-sm',
  '--text-base',
  '--text-lg',
  '--text-xl',
  '--text-2xl',
  '--radius-md',
  '--radius-lg',
]

/** Value of `--name: value;`. The trailing colon keeps `--text-sm` from
 *  matching `--text-sm--line-height`. */
function value(css: string, name: string): string | undefined {
  return new RegExp(`${name}:\\s*([^;]+);`).exec(css)?.[1].trim()
}

test.each(DIMENSIONAL)('%s is declared in theme.css', (name) => {
  expect(value(themeCss, name)).toBeDefined()
})

test.each(DIMENSIONAL)("%s equals Tailwind's default", (name) => {
  const mine = value(themeCss, name)
  const upstream = value(tailwindCss, name)
  expect(upstream).toBeDefined()
  expect(mine).toBe(upstream)
})

test('no line-height tokens are declared — they would change SPA rendering', () => {
  expect(themeCss).not.toMatch(/--text-[a-z0-9]+--line-height:/)
})

test('--spacing is not declared — a multiplier base no consumer reads', () => {
  expect(value(themeCss, '--spacing')).toBeUndefined()
})
