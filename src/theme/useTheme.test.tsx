// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { useTheme, THEME_STORAGE_KEY } from './useTheme'

// Mock localStorage since jsdom doesn't provide it by default
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

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
