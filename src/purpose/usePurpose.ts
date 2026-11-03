import { useCallback, useSyncExternalStore } from 'react'
import {
  clearPurpose,
  getPurpose,
  setPurpose,
  subscribePurpose,
  type Purpose,
  type PurposeInput,
} from './purpose'

export interface UsePurposeResult {
  /** The stated purpose, or `null` when none is stated. */
  purpose: Purpose | null
  /** {@link setPurpose} for this scope: validates, stores and broadcasts; blank clears. */
  setPurpose: (input: PurposeInput | null) => Purpose | null
  /** {@link clearPurpose} for this scope. */
  clearPurpose: () => void
}

/**
 * The purpose stated in this app, kept current.
 *
 * A view over the module store, so a purpose set from a plain fetch wrapper,
 * a `PurposeBar` or another component re-renders every reader of the scope.
 *
 * @param scope - The app's scope, e.g. `"chorus"`.
 * @returns The current purpose and the two scope-bound setters.
 */
export function usePurpose(scope: string): UsePurposeResult {
  const subscribe = useCallback(
    (onChange: () => void) => subscribePurpose(scope, onChange),
    [scope],
  )
  const snapshot = useCallback(() => getPurpose(scope), [scope])
  const purpose = useSyncExternalStore(subscribe, snapshot, () => null)
  const set = useCallback((input: PurposeInput | null) => setPurpose(scope, input), [scope])
  const clear = useCallback(() => clearPurpose(scope), [scope])
  return { purpose, setPurpose: set, clearPurpose: clear }
}
