import { useCallback, useEffect, useState } from 'react'

export const THEME_STORAGE_KEY = 'infra-ui-theme'

export type ThemeMode = 'light' | 'dark' | 'system'

function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function systemPrefersDark(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
}

function apply(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'system') delete root.dataset.theme
  else root.dataset.theme = mode
}

/**
 * Owns the federation theme contract: localStorage `infra-ui-theme`
 * ('light' | 'dark'; absent = follow the OS), mirrored to `data-theme`
 * on <html>. Nothing else may touch the key or the attribute.
 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readMode)
  const [osDark, setOsDark] = useState(systemPrefersDark)

  useEffect(() => {
    apply(mode)
  }, [mode])

  useEffect(() => {
    const mql = matchMedia('(prefers-color-scheme: dark)')
    const onMedia = (e: { matches: boolean }) => setOsDark(e.matches)
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) setMode(readMode())
    }
    mql.addEventListener('change', onMedia)
    window.addEventListener('storage', onStorage)
    return () => {
      mql.removeEventListener('change', onMedia)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const cycle = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system'
      try {
        if (next === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
        else localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        /* storage unavailable — in-memory only */
      }
      return next
    })
  }, [])

  const resolved: 'light' | 'dark' = mode === 'system' ? (osDark ? 'dark' : 'light') : mode
  return { mode, resolved, cycle }
}
