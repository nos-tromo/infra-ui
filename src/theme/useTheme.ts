import { useSyncExternalStore, useCallback } from 'react'

export const THEME_STORAGE_KEY = 'infra-ui-theme'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeSnapshot {
  mode: ThemeMode
  osDark: boolean
}

function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function apply(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'system') delete root.dataset.theme
  else root.dataset.theme = mode
}

// Module-level store for shared theme state (lazy-initialized for SSR)
let mode: ThemeMode = 'system'
let osDark: boolean = false
let cachedSnapshot: ThemeSnapshot = { mode, osDark }
let initialized = false

const listeners = new Set<() => void>()
let mql: MediaQueryList | null = null
let onMedia: ((e: { matches: boolean }) => void) | null = null
let onStorage: ((e: StorageEvent) => void) | null = null

function updateSnapshot() {
  cachedSnapshot = { mode, osDark }
}

function notifyListeners() {
  updateSnapshot()
  listeners.forEach((listener) => listener())
}

function ensureInit() {
  if (initialized) return
  initialized = true

  mode = readMode() // Read persisted mode on first initialization
  mql = matchMedia('(prefers-color-scheme: dark)')
  osDark = mql.matches // Read initial value
  updateSnapshot()
  apply(mode) // Apply the mode to the DOM
  onMedia = (e: { matches: boolean }) => {
    osDark = e.matches
    notifyListeners()
  }
  onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) {
      mode = readMode()
      apply(mode)
      notifyListeners()
    }
  }
  mql.addEventListener('change', onMedia)
  window.addEventListener('storage', onStorage)
}

function subscribe(listener: () => void) {
  ensureInit()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): ThemeSnapshot {
  ensureInit()
  return cachedSnapshot
}

function getServerSnapshot(): ThemeSnapshot {
  return { mode: 'system', osDark: false }
}

/**
 * Owns the federation theme contract: localStorage `infra-ui-theme`
 * ('light' | 'dark'; absent = follow the OS), mirrored to `data-theme`
 * on <html>. Nothing else may touch the key or the attribute.
 *
 * Uses a shared module-level store so all instances within a tab sync immediately.
 */
export function useTheme() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const cycle = useCallback(() => {
    ensureInit()
    const next: ThemeMode = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system'
    mode = next
    try {
      if (next === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
      else localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* storage unavailable — in-memory only */
    }
    apply(next)
    notifyListeners()
  }, [])

  const resolved: 'light' | 'dark' = snapshot.mode === 'system' ? (snapshot.osDark ? 'dark' : 'light') : snapshot.mode
  return { mode: snapshot.mode, resolved, cycle }
}

// Test-only: reset the store to initial state
export function __resetStoreForTesting() {
  // Clean up event listeners
  if (mql !== null && onMedia !== null) {
    mql.removeEventListener('change', onMedia)
  }
  if (onStorage !== null) {
    window.removeEventListener('storage', onStorage)
  }

  // Reset state
  mode = 'system'
  osDark = false
  cachedSnapshot = { mode, osDark }
  listeners.clear()
  mql = null
  onMedia = null
  onStorage = null
  initialized = false
}
