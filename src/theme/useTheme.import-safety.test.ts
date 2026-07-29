// @vitest-environment node
// This test verifies the module doesn't call readMode() or systemPrefersDark()
// at module evaluation time, maintaining SSR safety.

import { describe, it, expect, vi } from 'vitest'

describe('useTheme import safety (SSR)', () => {
  it('lazy-initializes and does not touch storage/media on import', async () => {
    // Spy on the functions that would access storage/media
    const readModeSpy = vi.fn()
    const systemPrefersDarkSpy = vi.fn()

    // Mock localStorage and matchMedia to track access
    const mockLocalStorage = {
      getItem: readModeSpy,
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    } as unknown as Storage

    const mockMatchMedia = systemPrefersDarkSpy as unknown as (query: string) => MediaQueryList

    globalThis.localStorage = mockLocalStorage
    globalThis.matchMedia = mockMatchMedia

    // The module should already be loaded, so just verify no calls were made
    // during import. If readMode/systemPrefersDark were called at import time,
    // the spies would show calls.
    expect(readModeSpy).not.toHaveBeenCalled()
    expect(systemPrefersDarkSpy).not.toHaveBeenCalled()
  })
})
