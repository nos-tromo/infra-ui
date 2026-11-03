import { act, renderHook } from '@testing-library/react'
import { __resetPurposeStoreForTesting, getPurpose, setPurpose } from './purpose'
import { usePurpose } from './usePurpose'

afterEach(() => {
  sessionStorage.clear()
  __resetPurposeStoreForTesting()
})

test('starts empty and follows a purpose set outside React', () => {
  const { result } = renderHook(() => usePurpose('chorus'))
  expect(result.current.purpose).toBeNull()

  // A plain fetch wrapper, or the bar, sets it: every reader re-renders.
  act(() => {
    setPurpose('chorus', { caseRef: 'AZ-12' })
  })
  expect(result.current.purpose).toEqual({ caseRef: 'AZ-12', reason: '' })
})

test('reads a purpose already stated in this tab session', () => {
  setPurpose('chorus', { reason: 'Prüfung' })
  const { result } = renderHook(() => usePurpose('chorus'))
  expect(result.current.purpose).toEqual({ caseRef: '', reason: 'Prüfung' })
})

test('its setters are bound to the scope', () => {
  const { result } = renderHook(() => usePurpose('chorus'))
  act(() => {
    result.current.setPurpose({ caseRef: ' AZ-12 ' })
  })
  expect(getPurpose('chorus')).toEqual({ caseRef: 'AZ-12', reason: '' })
  expect(getPurpose('docint')).toBeNull()

  act(() => result.current.clearPurpose())
  expect(result.current.purpose).toBeNull()
  expect(getPurpose('chorus')).toBeNull()
})

test('two scopes do not see each other', () => {
  const chorus = renderHook(() => usePurpose('chorus'))
  const docint = renderHook(() => usePurpose('docint'))
  act(() => {
    setPurpose('docint', { caseRef: 'AZ-99' })
  })
  expect(chorus.result.current.purpose).toBeNull()
  expect(docint.result.current.purpose).toEqual({ caseRef: 'AZ-99', reason: '' })
})

test('follows a change of scope', () => {
  setPurpose('docint', { caseRef: 'AZ-99' })
  const { result, rerender } = renderHook(({ scope }) => usePurpose(scope), {
    initialProps: { scope: 'chorus' },
  })
  expect(result.current.purpose).toBeNull()
  rerender({ scope: 'docint' })
  expect(result.current.purpose).toEqual({ caseRef: 'AZ-99', reason: '' })
  act(() => {
    setPurpose('docint', { caseRef: 'AZ-100' })
  })
  expect(result.current.purpose?.caseRef).toBe('AZ-100')
})

test('an invalid purpose throws through the hook too', () => {
  const { result } = renderHook(() => usePurpose('chorus'))
  expect(() => result.current.setPurpose({ reason: 'a\tb' })).toThrow('invalid purpose')
  expect(result.current.purpose).toBeNull()
})
