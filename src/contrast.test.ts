// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const css = readFileSync(fileURLToPath(new URL('./theme.css', import.meta.url)), 'utf8')

/** Extract `--name: hsl(H S% L%)` declarations from a CSS block. */
function tokens(block: string): Record<string, [number, number, number]> {
  const out: Record<string, [number, number, number]> = {}
  for (const m of block.matchAll(/(--[\w-]+):\s*hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/g)) {
    out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])]
  }
  return out
}

function hslToRgb([h, s, l]: [number, number, number]): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0), f(8), f(4)]
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(a: [number, number, number], b: [number, number, number]): number {
  const [l1, l2] = [luminance(hslToRgb(a)), luminance(hslToRgb(b))].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** The :root light block is everything before the first dark selector. */
const lightBlock = css.slice(0, css.indexOf("[data-theme='dark']"))
const darkBlock = css.slice(css.indexOf("[data-theme='dark']"))

const PAIRS: Array<[string, string]> = [
  ['--color-foreground', '--color-background'],
  ['--color-foreground', '--color-muted'],
  ['--color-foreground', '--color-chrome'],
  ['--color-muted-foreground', '--color-background'],
  ['--color-muted-foreground', '--color-muted'],
  ['--color-muted-foreground', '--color-chrome'],
  ['--color-danger', '--color-background'],
  ['--color-danger', '--color-muted'],
]

for (const [name, block] of [
  ['light', lightBlock],
  ['dark', darkBlock],
] as const) {
  describe(`${name} palette`, () => {
    const t = tokens(block)
    test.each(PAIRS)('%s on %s meets WCAG AA (>= 4.5)', (fg, bg) => {
      expect(t[fg]).toBeDefined()
      expect(t[bg]).toBeDefined()
      expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5)
    })
  })
}
