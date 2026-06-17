# `infra-ui` v0.1.0 (Phase 0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared design-system package `@infra/ui` — Tailwind v4 tokens, the `cn` helper, and seven generic UI primitives extracted from Nextext's look — to a tested, buildable, tagged `v0.1.0` that other apps can install as a pinned pnpm Git dependency.

**Architecture:** A new standalone Git repo at `/home/user/dev/infra/infra-ui`. Primitives are Tailwind-native `.tsx` (zero runtime CSS) using **only semantic design tokens**, so a consuming app re-themes everything by overriding one CSS variable. Variant-bearing primitives use `class-variance-authority` (cva); all className merging uses `cn` (clsx + tailwind-merge). `tsup` compiles `dist/` (ESM + types) and runs on install via the `prepare` lifecycle, so consumers never pre-build. A small Vite demo renders a kitchen-sink for visual review.

**Tech Stack:** React 19, TypeScript 6, Tailwind v4 (`@theme`), cva, clsx, tailwind-merge, tsup, Vitest + Testing Library (happy-dom), Vite (demo only), pnpm.

**Scope note:** This plan is **Phase 0 only**. Phase 1 (migrate docint onto `@infra/ui`) and Phase 2 (migrate Nextext) are separate plans authored after `v0.1.0` is tagged and pushed. Source design: `docs/design/2026-06-18-infra-ui-shared-design-system-design.md`.

## Global Constraints

Every task's requirements implicitly include these (exact values from the spec):

- **Repo:** `/home/user/dev/infra/infra-ui` — a brand-new Git repo (Task 1 runs `git init`). All commits in this plan land here, **not** in docint.
- **Package name:** `@infra/ui`. Install URL for consumers: `github:nos-tromo/infra-ui#vX.Y.Z`.
- **Versions (match the consuming apps):** react / react-dom declared as **peerDependencies** with a permissive `^19.0.0` range (the dev install pins `^19.2.0` to match the apps), Tailwind `^4.3.1`, TypeScript `^6.0.3`, Vite `^8.0.16`, Vitest `^4.1.8`, clsx `^2.1.1`, tailwind-merge `^3.6.0`, pnpm `@9.12.0`.
- **Dark-only, no shadows.** Do not add light-mode rules or `shadow-*` utilities.
- **Tokens only — never raw colors.** Primitives may use ONLY these semantic utilities: `background`, `foreground`, `muted`, `muted-foreground`, `border`, `accent`, `primary`, `primary-foreground`, `danger` (e.g. `bg-primary`, `text-muted-foreground`, `border-border`). **No** `zinc-*`, `emerald-*`, hex, or `rgb()` literals — that rule is what makes per-app accent theming work.
- **Token syntax:** one HSL `@theme` block. The accent is overridable: `--color-primary: var(--app-accent, hsl(217 91% 60%))`.
- **Conventions:** cva for variants; `cn` for className merge; every `forwardRef` component sets `displayName`; code style is no-semicolons + single-quotes (Prettier).

---

## File Structure

```
infra-ui/
  package.json              # @infra/ui — exports, deps, scripts
  tsconfig.json             # strict, react-jsx
  tsup.config.ts            # dist build (ESM + dts), externalize react
  vitest.config.ts          # happy-dom + react plugin
  eslint.config.js          # flat config
  .prettierrc               # no-semi, single-quote
  postcss.config.js         # @tailwindcss/postcss (for the demo)
  .gitignore                # dist, node_modules
  README.md                 # install + the @source integration snippet
  src/
    cn.ts                   # clsx + tailwind-merge helper        [Task 1]
    cn.test.ts
    theme.css               # the @theme token block              [Task 2]
    theme.test.ts           # token contract test
    index.ts                # barrel — grows per primitive task
    test/setup.ts           # jest-dom matchers
    primitives/
      Button.tsx  Button.test.tsx     [Task 3]
      Card.tsx    Card.test.tsx       [Task 4]
      Input.tsx   Input.test.tsx      [Task 5]
      Select.tsx  Select.test.tsx     [Task 5]
      Badge.tsx   Badge.test.tsx      [Task 6]
      Spinner.tsx Spinner.test.tsx    [Task 7]
      Banner.tsx  Banner.test.tsx     [Task 8]
  demo/                     # Vite kitchen-sink                    [Task 9]
    index.html  main.tsx  styles.css
  vite.config.ts            # root: 'demo'                         [Task 9]
```

---

## Task 1: Scaffold repo + `cn` helper

**Files:**
- Create: `/home/user/dev/infra/infra-ui/package.json`
- Create: `/home/user/dev/infra/infra-ui/tsconfig.json`
- Create: `/home/user/dev/infra/infra-ui/vitest.config.ts`
- Create: `/home/user/dev/infra/infra-ui/eslint.config.js`
- Create: `/home/user/dev/infra/infra-ui/.prettierrc`
- Create: `/home/user/dev/infra/infra-ui/.gitignore`
- Create: `/home/user/dev/infra/infra-ui/src/test/setup.ts`
- Create: `/home/user/dev/infra/infra-ui/src/cn.ts`
- Test: `/home/user/dev/infra/infra-ui/src/cn.test.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `src/cn.ts` — used by every primitive.

- [ ] **Step 1: Create the repo and initialize git**

```bash
mkdir -p /home/user/dev/infra/infra-ui
cd /home/user/dev/infra/infra-ui
git init
```

- [ ] **Step 2: Write `package.json`** (no `build`/`prepare` yet — tsup config arrives in Task 2)

```json
{
  "name": "@infra/ui",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "license": "MIT",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.6.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.12.0",
    "@tailwindcss/postcss": "^4.3.1",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.2",
    "eslint": "^9.12.0",
    "happy-dom": "^20.10.3",
    "postcss": "^8.5.15",
    "prettier": "^3.4.2",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tailwindcss": "^4.3.1",
    "tsup": "^8.5.0",
    "typescript": "^6.0.3",
    "typescript-eslint": "^8.61.0",
    "vite": "^8.0.16",
    "vitest": "^4.1.8"
  },
  "packageManager": "pnpm@9.12.0"
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "demo"]
}
```

- [ ] **Step 4: Write `vitest.config.ts`, `src/test/setup.ts`, `eslint.config.js`, `.prettierrc`, `.gitignore`**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

`eslint.config.js`:
```js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
)
```

`.prettierrc`:
```json
{ "semi": false, "singleQuote": true, "printWidth": 100 }
```

`.gitignore`:
```
node_modules
dist
*.log
```

- [ ] **Step 5: Install dependencies**

Run: `cd /home/user/dev/infra/infra-ui && pnpm install`
Expected: completes, creates `pnpm-lock.yaml` and `node_modules`.

- [ ] **Step 6: Write the failing test** — `src/cn.test.ts`

```ts
import { cn } from './cn'

test('merges and dedupes conflicting tailwind classes (last wins)', () => {
  expect(cn('px-2', 'px-4')).toBe('px-4')
})

test('drops falsy values and joins the rest', () => {
  expect(cn('a', false, null, undefined, 'b')).toBe('a b')
})
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot resolve `./cn` (module not found).

- [ ] **Step 8: Write `src/cn.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge conditional Tailwind classes, resolving utility conflicts (last wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS (2 tests).

- [ ] **Step 10: Commit**

```bash
cd /home/user/dev/infra/infra-ui
git add -A
git commit -m "chore: scaffold @infra/ui package and add cn helper"
```

---

## Task 2: Build pipeline + token stylesheet + barrel

**Files:**
- Create: `/home/user/dev/infra/infra-ui/tsup.config.ts`
- Create: `/home/user/dev/infra/infra-ui/src/theme.css`
- Test: `/home/user/dev/infra/infra-ui/src/theme.test.ts`
- Create: `/home/user/dev/infra/infra-ui/src/index.ts`
- Modify: `/home/user/dev/infra/infra-ui/package.json` (add `build` + `prepare` scripts, `exports`, `files`, `sideEffects`)

**Interfaces:**
- Consumes: `cn` (Task 1).
- Produces: `dist/index.js` + `dist/index.d.ts` (built by tsup); the `@theme` token contract in `src/theme.css`; the barrel `src/index.ts` (initially exports `cn` only — each later task appends one export line).

- [ ] **Step 1: Write the failing test** — `src/theme.test.ts`

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `theme.css` does not exist (ENOENT).

- [ ] **Step 3: Write `src/theme.css`**

```css
@theme {
  /* fixed family neutrals (from Nextext) */
  --color-background: hsl(240 6% 8%);
  --color-foreground: hsl(0 0% 98%);
  --color-muted: hsl(240 4% 16%);
  --color-muted-foreground: hsl(240 5% 65%);
  --color-border: hsl(240 4% 22%);
  --color-accent: hsl(240 5% 26%);
  --color-danger: hsl(0 72% 55%);

  /* the ONE per-app knob — falls back to the family blue if unset */
  --color-primary: var(--app-accent, hsl(217 91% 60%));
  --color-primary-foreground: hsl(0 0% 100%);

  /* type + shape */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  --radius: 0.5rem;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS (cn + theme tests).

- [ ] **Step 5: Write `src/index.ts` (barrel — cn only for now)**

```ts
export { cn } from './cn'
```

- [ ] **Step 6: Write `tsup.config.ts`**

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  minify: false,
  splitting: false,
  external: ['react', 'react-dom'],
})
```

- [ ] **Step 7: Add build/prepare scripts + exports to `package.json`**

Add these `scripts` entries (alongside the existing ones):
```json
    "build": "tsup",
    "prepare": "tsup"
```
Add these top-level keys:
```json
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./theme.css": "./src/theme.css"
  },
  "files": ["dist", "src/theme.css"],
  "sideEffects": ["**/*.css"],
```

- [ ] **Step 8: Verify the build produces dist**

Run: `cd /home/user/dev/infra/infra-ui && pnpm build && ls dist`
Expected: exit 0; `dist/index.js` and `dist/index.d.ts` present.

- [ ] **Step 9: Verify typecheck and tests still pass**

Run: `pnpm typecheck && pnpm test`
Expected: both PASS.

- [ ] **Step 10: Commit**

```bash
cd /home/user/dev/infra/infra-ui
git add -A
git commit -m "build: add tsup pipeline, theme.css tokens, and package barrel"
```

---

## Task 3: `Button` primitive (cva template)

**Files:**
- Create: `/home/user/dev/infra/infra-ui/src/primitives/Button.tsx`
- Test: `/home/user/dev/infra/infra-ui/src/primitives/Button.test.tsx`
- Modify: `/home/user/dev/infra/infra-ui/src/index.ts` (append export)

**Interfaces:**
- Consumes: `cn` (Task 1).
- Produces: `Button` (forwardRef to `HTMLButtonElement`) and `ButtonProps` with `variant?: 'primary' | 'secondary' | 'ghost' | 'danger'` and `size?: 'sm' | 'md'`, defaulting to `primary`/`md`. This is the cva pattern reused by Badge (Task 6) and Banner (Task 8).

- [ ] **Step 1: Write the failing test** — `src/primitives/Button.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

test('renders children and the default primary variant', () => {
  render(<Button>Save</Button>)
  expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('bg-primary')
})

test('applies the danger variant', () => {
  render(<Button variant="danger">Delete</Button>)
  expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-danger')
})

test('merges a custom className', () => {
  render(<Button className="w-full">X</Button>)
  expect(screen.getByRole('button', { name: 'X' })).toHaveClass('w-full')
})

test('forwards native button attributes', () => {
  render(<Button disabled>Nope</Button>)
  expect(screen.getByRole('button', { name: 'Nope' })).toBeDisabled()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/primitives/Button.test.tsx`
Expected: FAIL — cannot resolve `./Button`.

- [ ] **Step 3: Write `src/primitives/Button.tsx`**

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../cn'

const button = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'border border-border bg-muted text-foreground hover:bg-accent',
        ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
        danger: 'bg-danger text-primary-foreground hover:bg-danger/90',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />
  ),
)
Button.displayName = 'Button'
```

- [ ] **Step 4: Append the export to `src/index.ts`**

```ts
export { Button, type ButtonProps } from './primitives/Button'
```

- [ ] **Step 5: Run tests + typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS (Button's 4 tests included).

- [ ] **Step 6: Commit**

```bash
cd /home/user/dev/infra/infra-ui
git add -A
git commit -m "feat: add Button primitive with cva variants"
```

---

## Task 4: `Card` primitive

**Files:**
- Create: `/home/user/dev/infra/infra-ui/src/primitives/Card.tsx`
- Test: `/home/user/dev/infra/infra-ui/src/primitives/Card.test.tsx`
- Modify: `/home/user/dev/infra/infra-ui/src/index.ts` (append export)

**Interfaces:**
- Consumes: `cn` (Task 1).
- Produces: `Card` (forwardRef to `HTMLDivElement`, plain `HTMLAttributes<HTMLDivElement>`). docint's `KpiCard` will later wrap this.

- [ ] **Step 1: Write the failing test** — `src/primitives/Card.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { Card } from './Card'

test('renders children inside the surface', () => {
  render(<Card>body</Card>)
  expect(screen.getByText('body')).toHaveClass('rounded-lg')
})

test('merges a custom className', () => {
  render(<Card className="p-8">x</Card>)
  expect(screen.getByText('x')).toHaveClass('p-8')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/primitives/Card.test.tsx`
Expected: FAIL — cannot resolve `./Card`.

- [ ] **Step 3: Write `src/primitives/Card.tsx`**

```tsx
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../cn'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-border bg-muted/30 p-4', className)}
      {...props}
    />
  ),
)
Card.displayName = 'Card'
```

- [ ] **Step 4: Append the export to `src/index.ts`**

```ts
export { Card } from './primitives/Card'
```

- [ ] **Step 5: Run tests + typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /home/user/dev/infra/infra-ui
git add -A
git commit -m "feat: add Card primitive"
```

---

## Task 5: `Input` and `Select` form fields

**Files:**
- Create: `/home/user/dev/infra/infra-ui/src/primitives/Input.tsx`
- Test: `/home/user/dev/infra/infra-ui/src/primitives/Input.test.tsx`
- Create: `/home/user/dev/infra/infra-ui/src/primitives/Select.tsx`
- Test: `/home/user/dev/infra/infra-ui/src/primitives/Select.test.tsx`
- Modify: `/home/user/dev/infra/infra-ui/src/index.ts` (append two exports)

**Interfaces:**
- Consumes: `cn` (Task 1).
- Produces: `Input` (forwardRef to `HTMLInputElement`, `InputHTMLAttributes`) and `Select` (forwardRef to `HTMLSelectElement`, `SelectHTMLAttributes`).

- [ ] **Step 1: Write the failing tests**

`src/primitives/Input.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { Input } from './Input'

test('renders a text field with base classes', () => {
  render(<Input placeholder="Name" />)
  expect(screen.getByPlaceholderText('Name')).toHaveClass('rounded-md')
})

test('forwards native input attributes', () => {
  render(<Input defaultValue="hi" aria-label="greeting" />)
  expect(screen.getByLabelText('greeting')).toHaveValue('hi')
})
```

`src/primitives/Select.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { Select } from './Select'

test('renders a combobox with options', () => {
  render(
    <Select aria-label="pick">
      <option value="a">A</option>
    </Select>,
  )
  expect(screen.getByRole('combobox', { name: 'pick' })).toHaveClass('rounded-md')
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test src/primitives/Input.test.tsx src/primitives/Select.test.tsx`
Expected: FAIL — cannot resolve `./Input` / `./Select`.

- [ ] **Step 3: Write `src/primitives/Input.tsx`**

```tsx
import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
```

- [ ] **Step 4: Write `src/primitives/Select.tsx`**

```tsx
import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../cn'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Select.displayName = 'Select'
```

- [ ] **Step 5: Append the exports to `src/index.ts`**

```ts
export { Input } from './primitives/Input'
export { Select } from './primitives/Select'
```

- [ ] **Step 6: Run tests + typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd /home/user/dev/infra/infra-ui
git add -A
git commit -m "feat: add Input and Select form-field primitives"
```

---

## Task 6: `Badge` primitive

**Files:**
- Create: `/home/user/dev/infra/infra-ui/src/primitives/Badge.tsx`
- Test: `/home/user/dev/infra/infra-ui/src/primitives/Badge.test.tsx`
- Modify: `/home/user/dev/infra/infra-ui/src/index.ts` (append export)

**Interfaces:**
- Consumes: `cn` (Task 1); cva pattern (Task 3).
- Produces: `Badge` (function component on `HTMLSpanElement`) and `BadgeProps` with `variant?: 'neutral' | 'accent' | 'danger'` (default `neutral`).

- [ ] **Step 1: Write the failing test** — `src/primitives/Badge.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

test('renders the neutral variant by default', () => {
  render(<Badge>new</Badge>)
  expect(screen.getByText('new')).toHaveClass('text-muted-foreground')
})

test('applies the accent variant', () => {
  render(<Badge variant="accent">live</Badge>)
  expect(screen.getByText('live')).toHaveClass('text-primary')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/primitives/Badge.test.tsx`
Expected: FAIL — cannot resolve `./Badge`.

- [ ] **Step 3: Write `src/primitives/Badge.tsx`**

```tsx
import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../cn'

const badge = cva('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      neutral: 'bg-muted text-muted-foreground',
      accent: 'bg-primary/15 text-primary',
      danger: 'bg-danger/15 text-danger',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badge({ variant }), className)} {...props} />
}
```

- [ ] **Step 4: Append the export to `src/index.ts`**

```ts
export { Badge, type BadgeProps } from './primitives/Badge'
```

- [ ] **Step 5: Run tests + typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /home/user/dev/infra/infra-ui
git add -A
git commit -m "feat: add Badge primitive with cva variants"
```

---

## Task 7: `Spinner` primitive

**Files:**
- Create: `/home/user/dev/infra/infra-ui/src/primitives/Spinner.tsx`
- Test: `/home/user/dev/infra/infra-ui/src/primitives/Spinner.test.tsx`
- Modify: `/home/user/dev/infra/infra-ui/src/index.ts` (append export)

**Interfaces:**
- Consumes: `cn` (Task 1).
- Produces: `Spinner` (function component) and `SpinnerProps` with `className?: string` and `label?: string` (default `'Loading'`); exposes `role="status"`.

- [ ] **Step 1: Write the failing test** — `src/primitives/Spinner.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { Spinner } from './Spinner'

test('exposes a status role with the default label', () => {
  render(<Spinner />)
  expect(screen.getByRole('status', { name: 'Loading' })).toHaveClass('animate-spin')
})

test('accepts a custom label', () => {
  render(<Spinner label="Fetching" />)
  expect(screen.getByRole('status', { name: 'Fetching' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/primitives/Spinner.test.tsx`
Expected: FAIL — cannot resolve `./Spinner`.

- [ ] **Step 3: Write `src/primitives/Spinner.tsx`**

```tsx
import { cn } from '../cn'

export interface SpinnerProps {
  className?: string
  label?: string
}

export function Spinner({ className, label = 'Loading' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary',
        className,
      )}
    />
  )
}
```

- [ ] **Step 4: Append the export to `src/index.ts`**

```ts
export { Spinner, type SpinnerProps } from './primitives/Spinner'
```

- [ ] **Step 5: Run tests + typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /home/user/dev/infra/infra-ui
git add -A
git commit -m "feat: add Spinner primitive"
```

---

## Task 8: `Banner` primitive

**Files:**
- Create: `/home/user/dev/infra/infra-ui/src/primitives/Banner.tsx`
- Test: `/home/user/dev/infra/infra-ui/src/primitives/Banner.test.tsx`
- Modify: `/home/user/dev/infra/infra-ui/src/index.ts` (append export)

**Interfaces:**
- Consumes: `cn` (Task 1); cva pattern (Task 3).
- Produces: `Banner` (function component on `HTMLDivElement`) and `BannerProps` with `variant?: 'info' | 'danger'` (default `info`). `danger` renders `role="alert"`; `info` renders `role="status"`.

- [ ] **Step 1: Write the failing test** — `src/primitives/Banner.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { Banner } from './Banner'

test('info variant uses the status role', () => {
  render(<Banner>Heads up</Banner>)
  expect(screen.getByRole('status')).toHaveTextContent('Heads up')
})

test('danger variant uses the alert role and danger border', () => {
  render(<Banner variant="danger">Boom</Banner>)
  const el = screen.getByRole('alert')
  expect(el).toHaveTextContent('Boom')
  expect(el).toHaveClass('border-danger/40')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/primitives/Banner.test.tsx`
Expected: FAIL — cannot resolve `./Banner`.

- [ ] **Step 3: Write `src/primitives/Banner.tsx`**

```tsx
import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../cn'

const banner = cva('rounded-md border px-4 py-3 text-sm', {
  variants: {
    variant: {
      info: 'border-border bg-muted/40 text-foreground',
      danger: 'border-danger/40 bg-danger/10 text-foreground',
    },
  },
  defaultVariants: { variant: 'info' },
})

export interface BannerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof banner> {}

export function Banner({ className, variant, ...props }: BannerProps) {
  const role = variant === 'danger' ? 'alert' : 'status'
  return <div role={role} className={cn(banner({ variant }), className)} {...props} />
}
```

- [ ] **Step 4: Append the export to `src/index.ts`**

```ts
export { Banner, type BannerProps } from './primitives/Banner'
```

- [ ] **Step 5: Run the full suite, typecheck, lint, and build**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: all PASS; `dist/index.js` rebuilt with all seven primitives.

- [ ] **Step 6: Commit**

```bash
cd /home/user/dev/infra/infra-ui
git add -A
git commit -m "feat: add Banner primitive"
```

---

## Task 9: Demo kitchen-sink (visual review)

**Files:**
- Create: `/home/user/dev/infra/infra-ui/demo/index.html`
- Create: `/home/user/dev/infra/infra-ui/demo/styles.css`
- Create: `/home/user/dev/infra/infra-ui/demo/main.tsx`
- Create: `/home/user/dev/infra/infra-ui/vite.config.ts`
- Create: `/home/user/dev/infra/infra-ui/postcss.config.js`
- Modify: `/home/user/dev/infra/infra-ui/package.json` (add `demo` + `demo:build` scripts)

**Interfaces:**
- Consumes: every primitive from `src/index.ts`. This is the same Tailwind-v4 `@source` integration consumers use, validated end-to-end (here `@source` points at `../src/primitives`; consumers point at `dist`).

- [ ] **Step 1: Write `postcss.config.js`**

```js
export default { plugins: { '@tailwindcss/postcss': {} } }
```

- [ ] **Step 2: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'demo',
  plugins: [react()],
})
```

- [ ] **Step 3: Write `demo/styles.css`**

```css
@import 'tailwindcss';
@import '../src/theme.css';
@source '../src/primitives';

body {
  @apply bg-background text-foreground;
  font-family: var(--font-sans);
}
```

- [ ] **Step 4: Write `demo/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@infra/ui — kitchen sink</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Write `demo/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Badge, Banner, Button, Card, Input, Select, Spinner } from '../src/index'
import './styles.css'

function Sink() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-10">
      <h1 className="text-lg font-semibold">@infra/ui kitchen sink</h1>

      <section className="flex flex-wrap items-center gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button size="sm">Small</Button>
        <Button disabled>Disabled</Button>
        <Spinner />
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Badge>neutral</Badge>
        <Badge variant="accent">accent</Badge>
        <Badge variant="danger">danger</Badge>
      </section>

      <Card>
        <div className="flex flex-col gap-3">
          <Input placeholder="Text input" />
          <Select defaultValue="a">
            <option value="a">Option A</option>
            <option value="b">Option B</option>
          </Select>
        </div>
      </Card>

      <Banner>Informational banner</Banner>
      <Banner variant="danger">Something went wrong</Banner>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sink />
  </StrictMode>,
)
```

- [ ] **Step 6: Add demo scripts to `package.json`**

```json
    "demo": "vite",
    "demo:build": "vite build"
```

- [ ] **Step 7: Verify the demo compiles**

Run: `cd /home/user/dev/infra/infra-ui && pnpm demo:build`
Expected: exit 0; Vite reports a successful production build (this proves the Tailwind `@source` wiring resolves every primitive's classes).

- [ ] **Step 8: (Manual) eyeball the look**

Run: `pnpm demo`, open the printed localhost URL.
Expected: dark background, near-white text, **blue** primary buttons (the unset-accent family default), red danger, subtle bordered card — the Nextext look. Confirm visually, then stop the dev server.

- [ ] **Step 9: Commit**

```bash
cd /home/user/dev/infra/infra-ui
git add -A
git commit -m "feat: add Vite demo kitchen-sink for visual review"
```

---

## Task 10: README + publish `v0.1.0` to GitHub

**Files:**
- Create: `/home/user/dev/infra/infra-ui/README.md`

**Interfaces:**
- Produces: the pushed tag `v0.1.0` on GitHub, making `pnpm add github:nos-tromo/infra-ui#v0.1.0` resolvable by Phase 1 (docint).

> **Requires the user's GitHub auth** (`gh auth status` must be logged in). This task performs an outward push — confirm with the user before running Steps 3–5.

- [ ] **Step 1: Write `README.md`**

````markdown
# @infra/ui

Shared design system (Tailwind v4 tokens + UI primitives) for the infra React SPAs.
Dark, minimal, Nextext-derived. Consumed as a tag-pinned pnpm Git dependency.

## Install

```bash
pnpm add github:nos-tromo/infra-ui#v0.1.0
```

`react` and `react-dom` (v19) are peer dependencies. `dist/` is built automatically
on install via the `prepare` script.

## Wire it up (Tailwind v4)

In your app's root CSS (e.g. `src/styles/globals.css`):

```css
@import 'tailwindcss';
@import '@infra/ui/theme.css';                 /* shared tokens */
@source '../node_modules/@infra/ui/dist';      /* so Tailwind sees the primitives' classes */

/* optional: brand this app with one accent color (omit to inherit the family blue) */
:root { --app-accent: hsl(160 84% 39%); }
```

> The `@source` line is required — without it Tailwind won't generate the utility
> classes the primitives reference, and they'll render unstyled.

## Use

```tsx
import { Button, Card, Input, Select, Badge, Spinner, Banner, cn } from '@infra/ui'
```

## Primitives

`Button` (primary/secondary/ghost/danger · sm/md) · `Card` · `Input` · `Select` ·
`Badge` (neutral/accent/danger) · `Spinner` · `Banner` (info/danger).

## Develop

```bash
pnpm install      # builds dist via prepare
pnpm test         # vitest
pnpm demo         # visual kitchen-sink
pnpm build        # tsup -> dist/
```
````

- [ ] **Step 2: Commit the README**

```bash
cd /home/user/dev/infra/infra-ui
git add -A
git commit -m "docs: add README with install and Tailwind @source wiring"
```

- [ ] **Step 3: Create the GitHub repo** (confirm with user first)

Run: `cd /home/user/dev/infra/infra-ui && gh repo create nos-tromo/infra-ui --private --source=. --remote=origin`
Expected: repo created, `origin` remote added.

- [ ] **Step 4: Push `main`**

```bash
cd /home/user/dev/infra/infra-ui
git branch -M main
git push -u origin main
```
Expected: branch pushed.

- [ ] **Step 5: Tag and push `v0.1.0`**

```bash
cd /home/user/dev/infra/infra-ui
git tag v0.1.0
git push origin v0.1.0
```
Expected: tag visible on GitHub.

- [ ] **Step 6: Verify it is installable (smoke test in a temp dir)**

```bash
cd /tmp && rm -rf infra-ui-smoke && mkdir infra-ui-smoke && cd infra-ui-smoke
pnpm init >/dev/null 2>&1
pnpm add react react-dom github:nos-tromo/infra-ui#v0.1.0
node -e "import('@infra/ui').then(m => console.log(Object.keys(m).sort().join(',')))"
```
Expected: prints `Badge,Banner,Button,Card,Input,Select,Spinner,cn` — proving `prepare` built `dist/` on install and the barrel resolves.

---

## Self-Review

**Spec coverage** (against `docs/design/2026-06-18-infra-ui-shared-design-system-design.md`):
- §4.1 package shape → Tasks 1, 2, 9 (cn, theme.css, index.ts, demo). ✓
- §4.2 build/distribution (tsup, `prepare`, peerDeps, class strings in dist) → Task 2 + Task 10 Step 6 smoke test. ✓
- §4.3 token model (HSL `@theme`, `--app-accent` override) → Task 2 (+ contract test). ✓
- §4.4 seven primitives + cva → Tasks 3–8. ✓
- §4.5 Tailwind `@source` integration → Task 9 demo (validated) + README (Task 10). ✓
- §6 testing (Vitest + Testing Library per primitive, demo, lint/typecheck) → every task + Task 8 Step 5. ✓
- §9 success criteria 1 (builds via prepare, exports tokens + 7 primitives + cn) → Task 10 smoke test. ✓
- Out of scope by design: §5 Phase 1 (docint) and Phase 2 (Nextext) → separate plans.

**Placeholder scan:** No TBD/TODO; every code and config step is complete. ✓

**Type consistency:** `cn` signature stable across all tasks; `ButtonProps`/`BadgeProps`/`BannerProps`/`SpinnerProps` names match their barrel exports; variant string unions match the cva keys in each component. ✓

---

## Execution Handoff

This plan builds `infra-ui` to a tagged `v0.1.0`. Tasks 1–9 are fully local and reviewable; Task 10 Steps 3–5 push to GitHub and need a go-ahead. After this, the **docint migration (Phase 1)** is a separate plan.
