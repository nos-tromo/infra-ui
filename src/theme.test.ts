// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const css = readFileSync(fileURLToPath(new URL('./theme.css', import.meta.url)), 'utf8')

test('declares the fixed family tokens', () => {
  for (const token of [
    '--color-background',
    '--color-foreground',
    '--color-muted',
    '--color-muted-foreground',
    '--color-border',
    '--color-accent',
    '--color-danger',
    '--color-primary-foreground',
    '--font-sans',
    '--font-mono',
    '--radius',
  ]) {
    expect(css).toContain(token)
  }
})

test('exposes the per-app accent override hook with a blue family default', () => {
  expect(css).toContain('--color-primary: var(--app-accent, hsl(217 91% 60%))')
})

test('dark palette exists under both the data-theme attribute and the media fallback', () => {
  expect(css).toContain(":root[data-theme='dark']")
  expect(css).toContain(':root:not([data-theme])')
})

test('attribute and media dark blocks are value-identical', () => {
  const attr = css.slice(css.indexOf(":root[data-theme='dark']"), css.indexOf('@media'))
  const media = css.slice(css.indexOf('@media'))
  const decls = (s: string) => [...s.matchAll(/--[\w-]+:\s*[^;]+;/g)].map((m) => m[0]).sort()
  expect(decls(media)).toEqual(decls(attr))
})

test('color-scheme is declared to prevent browser auto-dark heuristics', () => {
  const lightOccurrences = (css.match(/color-scheme:\s*light;/g) || []).length
  const darkOccurrences = (css.match(/color-scheme:\s*dark;/g) || []).length
  expect(lightOccurrences).toBe(1)
  expect(darkOccurrences).toBe(2)
})
