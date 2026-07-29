// @vitest-environment node
// This test verifies the module doesn't access storage/media at import time,
// maintaining SSR safety.

import { describe, it, expect, vi } from 'vitest'

describe('useTheme import safety (SSR)', () => {
  it('does not access localStorage or matchMedia on module import', async () => {
    // Set up spies before importing
    const getItemSpy = vi.fn(() => null)
    const setItemSpy = vi.fn()
    const removeItemSpy = vi.fn()
    const matchMediaSpy = vi.fn()

    // Mock globals with spies BEFORE module import
    globalThis.localStorage = {
      getItem: getItemSpy,
      setItem: setItemSpy,
      removeItem: removeItemSpy,
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    } as unknown as Storage

    globalThis.matchMedia = matchMediaSpy as unknown as (query: string) => MediaQueryList

    // Reset modules to clear cache (so the import will re-evaluate)
    vi.resetModules()

    // Now import the module — if it accesses storage/media at import time,
    // the spies above will record calls
    // Use the full path to avoid resolution issues after resetModules
    const mod = await import('./useTheme')

    // Assert storage/media were NOT accessed during import
    expect(getItemSpy).not.toHaveBeenCalled()
    expect(setItemSpy).not.toHaveBeenCalled()
    expect(removeItemSpy).not.toHaveBeenCalled()
    expect(matchMediaSpy).not.toHaveBeenCalled()

    // Assert the module exported what we expect (lazy init was wired up)
    expect(mod.useTheme).toBeDefined()
    expect(mod.THEME_STORAGE_KEY).toBe('infra-ui-theme')

    // Verify spies are STILL uncalled after accessing the exports
    // (accessing the export itself should not trigger initialization)
    expect(getItemSpy).not.toHaveBeenCalled()
    expect(matchMediaSpy).not.toHaveBeenCalled()
  })
})
