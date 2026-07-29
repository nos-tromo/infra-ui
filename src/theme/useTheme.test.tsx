import { renderHook, act } from '@testing-library/react'
import { useTheme, THEME_STORAGE_KEY } from './useTheme'

// Access the module-level store reset for testing
import * as themeModule from './useTheme'

const resetStore = themeModule.__resetStoreForTesting

function mockMatchMedia(prefersDark: boolean) {
  const listeners = new Set<(e: { matches: boolean }) => void>()
  const mql = {
    matches: prefersDark,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.delete(fn),
    fire(matches: boolean) {
      this.matches = matches
      listeners.forEach((fn) => fn({ matches }))
    },
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))
  return mql
}

beforeEach(() => {
  resetStore()
})

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  vi.unstubAllGlobals()
})

test('defaults to system and resolves from prefers-color-scheme', () => {
  mockMatchMedia(true)
  const { result } = renderHook(() => useTheme())
  expect(result.current.mode).toBe('system')
  expect(result.current.resolved).toBe('dark')
  expect(document.documentElement.dataset.theme).toBeUndefined()
})

test('cycle steps system -> light -> dark -> system, stamping and persisting', () => {
  mockMatchMedia(false)
  const { result } = renderHook(() => useTheme())
  act(() => result.current.cycle())
  expect(result.current.mode).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  act(() => result.current.cycle())
  expect(result.current.mode).toBe('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  act(() => result.current.cycle())
  expect(result.current.mode).toBe('system')
  expect(document.documentElement.dataset.theme).toBeUndefined()
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
})

test('reads a persisted explicit choice on mount', () => {
  mockMatchMedia(true)
  localStorage.setItem(THEME_STORAGE_KEY, 'light')
  const { result } = renderHook(() => useTheme())
  expect(result.current.mode).toBe('light')
  expect(result.current.resolved).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')
})

test('in system mode, follows OS preference changes', () => {
  const mql = mockMatchMedia(false)
  const { result } = renderHook(() => useTheme())
  expect(result.current.resolved).toBe('light')
  act(() => mql.fire(true))
  expect(result.current.resolved).toBe('dark')
})

test('reacts to cross-tab storage events', () => {
  mockMatchMedia(false)
  const { result } = renderHook(() => useTheme())
  act(() => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'dark' }))
  })
  expect(result.current.mode).toBe('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
})

test('syncs across multiple instances in the same tab', () => {
  mockMatchMedia(false)
  // Render two independent hook instances
  const { result: result1 } = renderHook(() => useTheme())
  const { result: result2 } = renderHook(() => useTheme())

  // Both start in system mode
  expect(result1.current.mode).toBe('system')
  expect(result2.current.mode).toBe('system')
  expect(result1.current.resolved).toBe('light')
  expect(result2.current.resolved).toBe('light')

  // Cycle from first instance
  act(() => result1.current.cycle())

  // Both instances should reflect the change immediately
  expect(result1.current.mode).toBe('light')
  expect(result2.current.mode).toBe('light')
  expect(result1.current.resolved).toBe('light')
  expect(result2.current.resolved).toBe('light')

  // Cycle again from second instance
  act(() => result2.current.cycle())

  // Both should now be dark
  expect(result1.current.mode).toBe('dark')
  expect(result2.current.mode).toBe('dark')
  expect(result1.current.resolved).toBe('dark')
  expect(result2.current.resolved).toBe('dark')
})
