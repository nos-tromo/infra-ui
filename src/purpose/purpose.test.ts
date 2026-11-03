import {
  MAX_PURPOSE_FIELD,
  MAX_PURPOSE_HEADER,
  PURPOSE_HEADER,
  PURPOSE_REQUIRED_STATUS,
  PURPOSE_STORAGE_PREFIX,
  PurposeError,
  __resetPurposeStoreForTesting,
  clearAllPurposes,
  clearPurpose,
  dismissPurposeRequest,
  encodePurpose,
  getPurpose,
  isPurposeRequested,
  isPurposeStated,
  purposeHeaders,
  registerPurposeEditor,
  requestPurpose,
  setPurpose,
  subscribePurpose,
  validatePurpose,
  withPurpose,
} from './purpose'

const cp = (...points: number[]) => String.fromCodePoint(...points)
const LINE_SEPARATOR = cp(0x2028)
const PARAGRAPH_SEPARATOR = cp(0x2029)
const NEXT_LINE = cp(0x85)
const NBSP = cp(0xa0)
const EMOJI = cp(0x1f600)
const FAMILY = cp(0x1f469, 0x200d, 0x1f469, 0x200d, 0x1f467)
const key = (scope: string) => PURPOSE_STORAGE_PREFIX + scope

afterEach(() => {
  vi.unstubAllGlobals()
  sessionStorage.clear()
  __resetPurposeStoreForTesting()
})

/** A sessionStorage stand-in that delegates to the real one except where overridden. */
function stubStorage(overrides: Partial<Storage>) {
  const real = sessionStorage
  vi.stubGlobal('sessionStorage', {
    get length() {
      return real.length
    },
    key: (index: number) => real.key(index),
    getItem: (name: string) => real.getItem(name),
    setItem: (name: string, value: string) => real.setItem(name, value),
    removeItem: (name: string) => real.removeItem(name),
    clear: () => real.clear(),
    ...overrides,
  })
}

/** A stand-in for a mounted PurposeBar's editor. */
function fakeEditor() {
  let open = false
  return {
    open: vi.fn(() => {
      open = true
    }),
    isOpen: () => open,
    close: () => {
      open = false
    },
  }
}

const status = (code: number) => ({ status: code })
type Send = (headers: Record<string, string>) => Promise<{ status: number }>

describe('the wire contract', () => {
  test('matches the backend constants', () => {
    // parse_purpose_header in the shared audit runtime reads exactly these;
    // a drift here turns every stated purpose into a 400 or a silent 428.
    expect(PURPOSE_HEADER).toBe('X-Audit-Purpose')
    expect(PURPOSE_REQUIRED_STATUS).toBe(428)
    expect(MAX_PURPOSE_FIELD).toBe(256)
    expect(MAX_PURPOSE_HEADER).toBe(4096)
  })

  test('encodes form-style in wire order — the backend docstring example included', () => {
    expect(encodePurpose({ caseRef: 'AZ-12', reason: 'Prüfung des Hinweises' })).toBe(
      'case_ref=AZ-12&reason=Pr%C3%BCfung+des+Hinweises',
    )
    expect(encodePurpose({ reason: 'b', caseRef: 'a' })).toBe('case_ref=a&reason=b')
  })

  test('trims each field and leaves a blank one out, so no purpose encodes to nothing', () => {
    expect(encodePurpose({ caseRef: '  AZ-12 ', reason: '   ' })).toBe('case_ref=AZ-12')
    expect(encodePurpose({ caseRef: null, reason: '\tx ' })).toBe('reason=x')
    expect(encodePurpose({ caseRef: ' ', reason: '' })).toBe('')
    expect(encodePurpose({})).toBe('')
  })

  test('percent-encodes what would split or alter the pairs', () => {
    expect(encodePurpose({ reason: 'a+b' })).toBe('reason=a%2Bb')
    expect(encodePurpose({ reason: 'a&b' })).toBe('reason=a%26b')
    expect(encodePurpose({ reason: 'a=b' })).toBe('reason=a%3Db')
    expect(encodePurpose({ reason: '100%' })).toBe('reason=100%25')
    expect(encodePurpose({ reason: 'a b' })).toBe('reason=a+b')
  })

  test.each([
    ['umlauts', 'Prüfung des Hinweises'],
    ['ß and an ampersand', 'Größe & Maße'],
    ['plus and equals', 'a+b=c'],
    ['percent and a query mark', '100% sicher?'],
    ['slash, hash, semicolon, quotes', 'AZ 12/2026 #3; Teil "B"'],
    ['accents and an em dash', "l'été — déjà vu"],
    ['an emoji', `Hinweis ${EMOJI}`],
    ['a joined emoji sequence', `Familie ${FAMILY}`],
    ['CJK', '調査 案件'],
    ['inner runs of spaces', 'keeps   inner   spaces'],
  ])('round-trips %s through form decoding', (_, text) => {
    const encoded = encodePurpose({ caseRef: text, reason: text })
    const decoded = new URLSearchParams(encoded)
    expect(decoded.get('case_ref')).toBe(text)
    expect(decoded.get('reason')).toBe(text)
    // The backend refuses a header value that is not ASCII, so every
    // character outside it must arrive percent-encoded.
    expect(encoded).toMatch(/^[\x21-\x7e]*$/)
  })
})

describe('validation', () => {
  test('an ordinary purpose and a blank one are both valid; only one is stated', () => {
    expect(validatePurpose({ caseRef: 'AZ-12', reason: 'Prüfung' })).toBeNull()
    expect(validatePurpose({})).toBeNull()
    expect(isPurposeStated({ caseRef: 'AZ-12' })).toBe(true)
    expect(isPurposeStated({ caseRef: '', reason: '  ' })).toBe(false)
    expect(isPurposeStated(null)).toBe(false)
  })

  test('a field holds at most MAX_PURPOSE_FIELD characters, counted after trimming', () => {
    const max = 'x'.repeat(MAX_PURPOSE_FIELD)
    expect(validatePurpose({ caseRef: max })).toBeNull()
    expect(validatePurpose({ caseRef: `  ${max}  ` })).toBeNull()
    expect(validatePurpose({ caseRef: `${max}x` })).toEqual({ caseRef: 'length' })
    expect(validatePurpose({ reason: `${max}x` })).toEqual({ reason: 'length' })
  })

  test('length counts characters, not UTF-16 units — an emoji is one', () => {
    // 256 emoji are 512 UTF-16 units; the backend's len() sees 256 characters.
    expect(validatePurpose({ reason: EMOJI.repeat(MAX_PURPOSE_FIELD) })).toBeNull()
    expect(validatePurpose({ reason: EMOJI.repeat(MAX_PURPOSE_FIELD + 1) })).toEqual({
      reason: 'length',
    })
  })

  test('control characters and line separators inside a field are refused', () => {
    for (const c of ['\t', '\n', '\r', cp(0), cp(0x1b), cp(0x7f), NEXT_LINE, cp(0x9f)]) {
      expect(validatePurpose({ caseRef: `a${c}b` }), c.codePointAt(0)!.toString(16)).toEqual({
        caseRef: 'control',
      })
    }
    for (const c of [LINE_SEPARATOR, PARAGRAPH_SEPARATOR]) {
      expect(validatePurpose({ reason: `a${c}b` })).toEqual({ reason: 'control' })
    }
  })

  test('whitespace at the edges is trimmed as the backend trims it, not refused', () => {
    // The backend strips with Python's str.strip(), which also takes \x1c-\x1f
    // and NEL off the ends; refusing those would reject what it accepts.
    for (const c of ['\n', '\t', NEXT_LINE, cp(0x1f), LINE_SEPARATOR, PARAGRAPH_SEPARATOR, NBSP]) {
      expect(validatePurpose({ reason: `${c}ok${c}` }), c.codePointAt(0)!.toString(16)).toBeNull()
      expect(encodePurpose({ reason: `${c}ok${c}` })).toBe('reason=ok')
    }
  })

  test('trimming takes linear time, also on a long inner run of whitespace', () => {
    // An anchored `[…]+$` trim rescans an inner run from every start
    // position: quadratic on a pasted wall of tabs between two characters.
    const inner = `a${'\t'.repeat(100_000)}b`
    const started = performance.now()
    expect(validatePurpose({ reason: inner })).toEqual({ reason: 'control' })
    expect(encodePurpose({ reason: `  ${inner}  ` })).toHaveLength('reason='.length + 3 * 100_000 + 2)
    expect(performance.now() - started).toBeLessThan(1000)
  })

  test('a control character is reported before the length, in the backend order', () => {
    expect(validatePurpose({ caseRef: `${'x'.repeat(300)}\tx` })).toEqual({ caseRef: 'control' })
  })

  test('each field reports its own problem', () => {
    expect(validatePurpose({ caseRef: 'x'.repeat(300), reason: 'a\tb' })).toEqual({
      caseRef: 'length',
      reason: 'control',
    })
  })

  test('two fields within their limits can still be too long to send together', () => {
    // One CJK character percent-encodes to nine: 2 × 256 × 9 plus the keys is over 4096.
    const cjk = '調'.repeat(MAX_PURPOSE_FIELD)
    expect(encodePurpose({ caseRef: cjk, reason: cjk }).length).toBeGreaterThan(MAX_PURPOSE_HEADER)
    expect(validatePurpose({ caseRef: cjk, reason: cjk })).toEqual({ header: 'length' })
    expect(validatePurpose({ caseRef: cjk })).toBeNull()
    // A field's own error is the first thing to fix, so it is the one reported.
    expect(validatePurpose({ caseRef: `${cjk}調`, reason: cjk })).toEqual({ caseRef: 'length' })
  })

  test('the header limit is exact', () => {
    // case_ref= (9) + 2304, &reason= (8) + 1710 + 65 = 4096 characters in all.
    const caseRef = '調'.repeat(256)
    const reason = '調'.repeat(190) + 'x'.repeat(65)
    expect(encodePurpose({ caseRef, reason })).toHaveLength(MAX_PURPOSE_HEADER)
    expect(validatePurpose({ caseRef, reason })).toBeNull()
    expect(validatePurpose({ caseRef, reason: `${reason}x` })).toEqual({ header: 'length' })
  })
})

describe('the store', () => {
  test('states, reads, encodes and clears a purpose', () => {
    expect(getPurpose('chorus')).toBeNull()
    expect(purposeHeaders('chorus')).toEqual({})

    const stated = setPurpose('chorus', { caseRef: ' AZ-12 ', reason: 'Prüfung' })
    expect(stated).toEqual({ caseRef: 'AZ-12', reason: 'Prüfung' })
    expect(getPurpose('chorus')).toBe(stated)
    expect(purposeHeaders('chorus')).toEqual({
      'X-Audit-Purpose': 'case_ref=AZ-12&reason=Pr%C3%BCfung',
    })

    clearPurpose('chorus')
    expect(getPurpose('chorus')).toBeNull()
    expect(purposeHeaders('chorus')).toEqual({})
  })

  test('a blank purpose clears rather than states one', () => {
    setPurpose('chorus', { caseRef: 'AZ-12' })
    expect(setPurpose('chorus', { caseRef: '  ', reason: '' })).toBeNull()
    expect(getPurpose('chorus')).toBeNull()
    expect(sessionStorage.getItem(key('chorus'))).toBeNull()
  })

  test('an invalid purpose throws and leaves the stated one untouched', () => {
    const stated = setPurpose('chorus', { caseRef: 'AZ-12' })
    expect(() => setPurpose('chorus', { reason: 'a\tb' })).toThrow(PurposeError)
    try {
      setPurpose('chorus', { caseRef: 'x'.repeat(300) })
    } catch (error) {
      expect((error as PurposeError).errors).toEqual({ caseRef: 'length' })
    }
    expect(getPurpose('chorus')).toBe(stated)
  })

  test('the snapshot is frozen, and the same object until the purpose changes', () => {
    const stated = setPurpose('chorus', { caseRef: 'AZ-12' })
    expect(Object.isFrozen(stated)).toBe(true)
    // useSyncExternalStore re-renders on a new object, so an unchanged purpose
    // must keep its identity.
    expect(setPurpose('chorus', { caseRef: ' AZ-12' })).toBe(stated)
    expect(getPurpose('chorus')).toBe(stated)
  })

  test('persists for the tab session and comes back after a reload', () => {
    setPurpose('chorus', { caseRef: 'AZ-12', reason: 'Prüfung' })
    expect(JSON.parse(sessionStorage.getItem(key('chorus'))!)).toEqual({
      caseRef: 'AZ-12',
      reason: 'Prüfung',
    })
    __resetPurposeStoreForTesting()
    expect(getPurpose('chorus')).toEqual({ caseRef: 'AZ-12', reason: 'Prüfung' })
  })

  test('scopes are independent, in memory and in storage', () => {
    // The apps share one origin behind the gateway: an unscoped key would carry
    // a purpose stated in one app into the next one opened in the tab.
    setPurpose('chorus', { caseRef: 'AZ-12' })
    expect(getPurpose('docint')).toBeNull()
    expect(purposeHeaders('docint')).toEqual({})

    setPurpose('docint', { reason: 'Recherche' })
    clearPurpose('chorus')
    expect(getPurpose('docint')).toEqual({ caseRef: '', reason: 'Recherche' })
    expect(sessionStorage.getItem(key('chorus'))).toBeNull()
    expect(sessionStorage.getItem(key('docint'))).not.toBeNull()
  })

  test('subscribers hear changes to their own scope, and only real changes', () => {
    const chorus = vi.fn()
    const docint = vi.fn()
    const unsubscribe = subscribePurpose('chorus', chorus)
    subscribePurpose('docint', docint)

    const stated = setPurpose('chorus', { caseRef: 'AZ-12' })
    expect(chorus).toHaveBeenLastCalledWith(stated)
    setPurpose('chorus', { caseRef: 'AZ-12 ' })
    expect(chorus).toHaveBeenCalledTimes(1)
    clearPurpose('chorus')
    expect(chorus).toHaveBeenLastCalledWith(null)

    unsubscribe()
    setPurpose('chorus', { caseRef: 'AZ-13' })
    expect(chorus).toHaveBeenCalledTimes(2)
    expect(docint).not.toHaveBeenCalled()
  })

  test.each([
    ['not JSON', '{'],
    ['not an object', '"AZ-12"'],
    ['null', 'null'],
    ['of the wrong types', '{"caseRef": 12, "reason": ["x"]}'],
    ['blank', '{"caseRef": "  ", "reason": ""}'],
    ['holding a control character', JSON.stringify({ caseRef: 'a\tb' })],
    ['overlong', JSON.stringify({ reason: 'x'.repeat(MAX_PURPOSE_FIELD + 1) })],
  ])('ignores a stored value that is %s', (_, raw) => {
    // Written by another build, or by hand: never sent, so never a 400.
    sessionStorage.setItem(key('chorus'), raw)
    expect(getPurpose('chorus')).toBeNull()
    expect(purposeHeaders('chorus')).toEqual({})
  })

  test('clearing all removes every scope, including ones this page never read', () => {
    setPurpose('chorus', { caseRef: 'AZ-12' })
    sessionStorage.setItem(key('docint'), JSON.stringify({ caseRef: 'AZ-99', reason: '' }))
    sessionStorage.setItem('unrelated', 'kept')
    const heard = vi.fn()
    subscribePurpose('chorus', heard)

    clearAllPurposes()
    expect(heard).toHaveBeenCalledWith(null)
    expect(getPurpose('chorus')).toBeNull()
    expect(getPurpose('docint')).toBeNull()
    expect(sessionStorage.getItem('unrelated')).toBe('kept')
  })
})

describe('without working storage', () => {
  test('keeps the purpose in memory when reading storage throws', () => {
    stubStorage({
      getItem: () => {
        throw new DOMException('denied', 'SecurityError')
      },
    })
    expect(getPurpose('chorus')).toBeNull()
    setPurpose('chorus', { caseRef: 'AZ-12' })
    expect(purposeHeaders('chorus')).toEqual({ 'X-Audit-Purpose': 'case_ref=AZ-12' })
  })

  test('keeps the purpose in memory when the storage accessor itself throws', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      get() {
        throw new DOMException('denied', 'SecurityError')
      },
    })
    try {
      expect(getPurpose('chorus')).toBeNull()
      setPurpose('chorus', { caseRef: 'AZ-12' })
      expect(purposeHeaders('chorus')).toEqual({ 'X-Audit-Purpose': 'case_ref=AZ-12' })
      clearAllPurposes()
      expect(getPurpose('chorus')).toBeNull()
    } finally {
      if (original) Object.defineProperty(globalThis, 'sessionStorage', original)
      else delete (globalThis as { sessionStorage?: Storage }).sessionStorage
    }
  })

  test('a failed write leaves no stale purpose behind for a reload to bring back', () => {
    setPurpose('chorus', { caseRef: 'AZ-12' })
    stubStorage({
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError')
      },
    })
    setPurpose('chorus', { caseRef: 'AZ-13' })
    expect(getPurpose('chorus')?.caseRef).toBe('AZ-13')

    vi.unstubAllGlobals()
    expect(sessionStorage.getItem(key('chorus'))).toBeNull()
    __resetPurposeStoreForTesting()
    expect(getPurpose('chorus')).toBeNull()
  })
})

describe('requestPurpose', () => {
  test('with nothing mounted to ask, it settles with null at once', async () => {
    await expect(requestPurpose('chorus')).resolves.toBeNull()
    expect(isPurposeRequested('chorus')).toBe(false)
  })

  test('opens the editor and resolves with the purpose saved', async () => {
    const editor = fakeEditor()
    registerPurposeEditor('chorus', editor)
    const pending = requestPurpose('chorus')
    expect(editor.open).toHaveBeenCalledTimes(1)
    expect(isPurposeRequested('chorus')).toBe(true)

    const stated = setPurpose('chorus', { caseRef: 'AZ-12' })
    await expect(pending).resolves.toBe(stated)
    expect(isPurposeRequested('chorus')).toBe(false)
  })

  test('resolves with null when the editor is dismissed, or the purpose cleared', async () => {
    registerPurposeEditor('chorus', fakeEditor())
    const dismissed = requestPurpose('chorus')
    dismissPurposeRequest('chorus')
    await expect(dismissed).resolves.toBeNull()

    const cleared = requestPurpose('chorus')
    clearPurpose('chorus')
    await expect(cleared).resolves.toBeNull()
  })

  test('requests made while one is pending share one prompt', async () => {
    const editor = fakeEditor()
    registerPurposeEditor('chorus', editor)
    const first = requestPurpose('chorus')
    const second = requestPurpose('chorus')
    // A burst of 428s from parallel requests must open one dialog, not one each.
    expect(second).toBe(first)
    expect(editor.open).toHaveBeenCalledTimes(1)

    const stated = setPurpose('chorus', { reason: 'Prüfung' })
    await expect(Promise.all([first, second])).resolves.toEqual([stated, stated])
  })

  test('asks through an editor already open, otherwise through the newest one', () => {
    const older = fakeEditor()
    const newer = fakeEditor()
    registerPurposeEditor('chorus', older)
    registerPurposeEditor('chorus', newer)

    void requestPurpose('chorus')
    expect(newer.open).toHaveBeenCalledTimes(1)
    expect(older.open).not.toHaveBeenCalled()
    dismissPurposeRequest('chorus')
    newer.close()

    // The user opened the older bar's dialog themselves; a request arriving now
    // joins it instead of stacking a second dialog on top.
    older.open()
    void requestPurpose('chorus')
    expect(older.open).toHaveBeenCalledTimes(2)
    expect(newer.open).toHaveBeenCalledTimes(1)
  })

  test('settles with null when the editor it waits on goes away', async () => {
    const asked = fakeEditor()
    const idle = fakeEditor()
    const unregisterIdle = registerPurposeEditor('chorus', idle)
    const unregisterAsked = registerPurposeEditor('chorus', asked)
    const pending = requestPurpose('chorus')

    // Another bar unmounting changes nothing for the dialog being answered.
    unregisterIdle()
    expect(isPurposeRequested('chorus')).toBe(true)

    unregisterAsked()
    await expect(pending).resolves.toBeNull()
  })

  test('settles with null when the last editor unmounts', async () => {
    const editor = { open: vi.fn(), isOpen: () => false }
    const unregister = registerPurposeEditor('chorus', editor)
    const pending = requestPurpose('chorus')
    unregister()
    await expect(pending).resolves.toBeNull()
  })
})

describe('withPurpose', () => {
  test('sends the stated purpose and returns any other answer as it is', async () => {
    setPurpose('chorus', { caseRef: 'AZ-12' })
    const send = vi.fn<Send>().mockResolvedValue(status(200))
    await expect(withPurpose('chorus', send)).resolves.toEqual(status(200))
    expect(send.mock.calls).toEqual([[{ 'X-Audit-Purpose': 'case_ref=AZ-12' }]])
  })

  test('sends no header at all while no purpose is stated', async () => {
    const send = vi.fn<Send>().mockResolvedValue(status(204))
    await withPurpose('chorus', send)
    expect(send.mock.calls).toEqual([[{}]])
  })

  test('on a 428 it asks, then sends again with what was stated', async () => {
    registerPurposeEditor('chorus', {
      open: () => queueMicrotask(() => setPurpose('chorus', { reason: 'Prüfung' })),
      isOpen: () => false,
    })
    const send = vi.fn<Send>().mockResolvedValueOnce(status(428)).mockResolvedValueOnce(status(200))
    await expect(withPurpose('chorus', send)).resolves.toEqual(status(200))
    expect(send.mock.calls).toEqual([[{}], [{ 'X-Audit-Purpose': 'reason=Pr%C3%BCfung' }]])
  })

  test('when the user declines, the 428 comes back and nothing is sent again', async () => {
    registerPurposeEditor('chorus', {
      open: () => queueMicrotask(() => dismissPurposeRequest('chorus')),
      isOpen: () => false,
    })
    const refused = status(428)
    const send = vi.fn<Send>().mockResolvedValue(refused)
    await expect(withPurpose('chorus', send)).resolves.toBe(refused)
    expect(send).toHaveBeenCalledTimes(1)
  })

  test('with no bar mounted, the 428 comes back as it is', async () => {
    const refused = status(428)
    const send = vi.fn<Send>().mockResolvedValue(refused)
    await expect(withPurpose('chorus', send)).resolves.toBe(refused)
    expect(send).toHaveBeenCalledTimes(1)
  })

  test('uses a purpose stated while the request was in flight, without asking again', async () => {
    const open = vi.fn()
    registerPurposeEditor('chorus', { open, isOpen: () => false })
    const send = vi
      .fn<Send>()
      .mockImplementationOnce(async () => {
        // Another request's prompt was answered while this one was on the wire.
        setPurpose('chorus', { caseRef: 'AZ-12' })
        return status(428)
      })
      .mockResolvedValueOnce(status(200))
    await expect(withPurpose('chorus', send)).resolves.toEqual(status(200))
    expect(open).not.toHaveBeenCalled()
    expect(send.mock.calls[1]).toEqual([{ 'X-Audit-Purpose': 'case_ref=AZ-12' }])
  })

  test('sends again at most once', async () => {
    setPurpose('chorus', { caseRef: 'AZ-12' })
    registerPurposeEditor('chorus', {
      open: () => queueMicrotask(() => setPurpose('chorus', { caseRef: 'AZ-12' })),
      isOpen: () => false,
    })
    const send = vi.fn<Send>().mockResolvedValue(status(428))
    await expect(withPurpose('chorus', send)).resolves.toEqual(status(428))
    expect(send).toHaveBeenCalledTimes(2)
  })
})
