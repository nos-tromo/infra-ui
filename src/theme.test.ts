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
