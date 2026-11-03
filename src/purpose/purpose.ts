/**
 * The stated purpose: a case reference and/or a short reason that a user
 * states once and every API request of an app then carries, so a backend that
 * keeps an audit trail can record why data was looked at.
 *
 * Framework-agnostic on purpose: a plain fetch wrapper reads it with
 * {@link purposeHeaders} or {@link withPurpose}, React reads it with
 * `usePurpose`, and `PurposeBar` is where the user states it.
 *
 * The wire format is the backend's — `parse_purpose_header` in the shared
 * audit runtime (`nos-tromo/.github`, `configs/audit/audit_runtime.py`): the
 * `application/x-www-form-urlencoded` serialization of up to two fields,
 * `case_ref` and `reason`, in the {@link PURPOSE_HEADER} request header. This
 * module produces exactly that and refuses anything the parser would reject,
 * so a stored purpose can never turn a request into a `400`.
 */

/** Request header carrying the caller's stated purpose. */
export const PURPOSE_HEADER = 'X-Audit-Purpose'

/** Response status for "this request needs a stated purpose" (428 Precondition Required). */
export const PURPOSE_REQUIRED_STATUS = 428

/** Longest accepted field once trimmed, in characters — Unicode code points, as the backend counts. */
export const MAX_PURPOSE_FIELD = 256

/** Longest accepted header value, in characters. */
export const MAX_PURPOSE_HEADER = 4096

/** A stated purpose. Both fields are trimmed, and at least one is non-empty. */
export interface Purpose {
  /** A case or file reference; empty when not given. */
  readonly caseRef: string
  /** A short justification; empty when not given. */
  readonly reason: string
}

/** A purpose as a caller hands it in: either field may be missing, blank or untrimmed. */
export interface PurposeInput {
  caseRef?: string | null
  reason?: string | null
}

/** Why one field cannot be sent: it is too long, or it holds control characters. */
export type PurposeFieldError = 'length' | 'control'

/**
 * What is wrong with a purpose, per field. `header` means both fields are
 * acceptable on their own but encode to a header longer than
 * {@link MAX_PURPOSE_HEADER}; it is reported only once neither field has an
 * error of its own.
 */
export interface PurposeErrors {
  caseRef?: PurposeFieldError
  reason?: PurposeFieldError
  header?: 'length'
}

/** Thrown by {@link setPurpose} for a purpose the backend would reject. */
export class PurposeError extends Error {
  /** The problems {@link validatePurpose} found. */
  readonly errors: PurposeErrors

  constructor(errors: PurposeErrors) {
    super(`invalid purpose: ${JSON.stringify(errors)}`)
    this.name = 'PurposeError'
    this.errors = errors
  }
}

// The backend trims with Python's str.strip(), which also strips \x1c-\x1f and
// \x85. Trimming those as well keeps what the bar shows identical to what is
// recorded, instead of rejecting a value the backend would have accepted.
// eslint-disable-next-line no-control-regex
const EDGE_SPACE = /^[\s\x1c-\x1f\x85]+|[\s\x1c-\x1f\x85]+$/g

// C0 and C1 controls, plus the two Unicode line separators: the backend's set.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\x00-\x1f\x7f-\x9f\u2028\u2029]/

function trimField(value: string | null | undefined): string {
  return typeof value === 'string' ? value.replace(EDGE_SPACE, '') : ''
}

function normalize(input: PurposeInput | null | undefined): Purpose {
  return { caseRef: trimField(input?.caseRef), reason: trimField(input?.reason) }
}

/**
 * Whether a purpose is stated: at least one field is non-blank.
 *
 * @param input - The purpose to check; `null` is not stated.
 * @returns `true` when a case reference or a reason is given.
 */
export function isPurposeStated(input: PurposeInput | null | undefined): boolean {
  const { caseRef, reason } = normalize(input)
  return caseRef !== '' || reason !== ''
}

/**
 * Encode a purpose as the {@link PURPOSE_HEADER} value.
 *
 * Each field is trimmed and a blank one is left out, so a purpose with neither
 * field yields `''` — send no header at all then. The result is what
 * `new URLSearchParams([['case_ref', …], ['reason', …]]).toString()` produces:
 * pure ASCII, with spaces as `+` and everything else outside `*-._` and the
 * alphanumerics percent-encoded as UTF-8.
 *
 * @param input - The purpose to encode.
 * @returns The header value, e.g. `case_ref=AZ-12&reason=Pr%C3%BCfung+des+Hinweises`.
 */
export function encodePurpose(input: PurposeInput): string {
  const { caseRef, reason } = normalize(input)
  const pairs: [string, string][] = []
  if (caseRef) pairs.push(['case_ref', caseRef])
  if (reason) pairs.push(['reason', reason])
  return new URLSearchParams(pairs).toString()
}

function fieldError(text: string): PurposeFieldError | undefined {
  // The backend's order: a control character is reported before the length.
  if (CONTROL.test(text)) return 'control'
  // Code points, not UTF-16 units — the backend counts with Python's len(), so
  // an emoji is one character, not two.
  if ([...text].length > MAX_PURPOSE_FIELD) return 'length'
  return undefined
}

/**
 * Check a purpose against the backend's rules, so the dialog and an app's own
 * code share one rule set.
 *
 * A blank purpose is valid — it is simply not stated ({@link isPurposeStated}).
 *
 * @param input - The purpose to check, before or after trimming.
 * @returns The problems found, or `null` when the purpose can be sent.
 */
export function validatePurpose(input: PurposeInput): PurposeErrors | null {
  const purpose = normalize(input)
  const caseRef = fieldError(purpose.caseRef)
  const reason = fieldError(purpose.reason)
  if (caseRef || reason) {
    const errors: PurposeErrors = {}
    if (caseRef) errors.caseRef = caseRef
    if (reason) errors.reason = reason
    return errors
  }
  // Two fields within their own limit can still exceed the header's:
  // percent-encoding turns one CJK character into nine, and an emoji into twelve.
  return encodePurpose(purpose).length > MAX_PURPOSE_HEADER ? { header: 'length' } : null
}

/** The `sessionStorage` key prefix; the scope follows it. */
export const PURPOSE_STORAGE_PREFIX = 'infra-ui-purpose:'

interface PurposeEditor {
  /** Open the editor; a no-op when it is already open. */
  open: () => void
  isOpen: () => boolean
}

interface PendingRequest {
  promise: Promise<Purpose | null>
  resolve: (purpose: Purpose | null) => void
}

interface ScopeState {
  purpose: Purpose | null
  listeners: Set<(purpose: Purpose | null) => void>
  /** Told when a request starts or settles — what `PurposeBar` shows the prompt note by. */
  watchers: Set<() => void>
  request: PendingRequest | null
  /** Mounted editors, oldest first. */
  editors: PurposeEditor[]
}

const scopes = new Map<string, ScopeState>()

function sessionStore(): Storage | null {
  // Reading the property can itself throw: a sandboxed frame, or storage
  // blocked by browser policy.
  try {
    return globalThis.sessionStorage ?? null
  } catch {
    return null
  }
}

function freeze(input: PurposeInput): Purpose {
  return Object.freeze(normalize(input))
}

function load(scope: string): Purpose | null {
  try {
    const raw = sessionStore()?.getItem(PURPOSE_STORAGE_PREFIX + scope)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    const { caseRef, reason } = data as Record<string, unknown>
    const input = {
      caseRef: typeof caseRef === 'string' ? caseRef : null,
      reason: typeof reason === 'string' ? reason : null,
    }
    // Written by another build, or by hand: only what could be sent comes back.
    return isPurposeStated(input) && !validatePurpose(input) ? freeze(input) : null
  } catch {
    return null
  }
}

function persist(scope: string, purpose: Purpose | null): void {
  const store = sessionStore()
  if (!store) return
  const key = PURPOSE_STORAGE_PREFIX + scope
  try {
    if (purpose) store.setItem(key, JSON.stringify(purpose))
    else store.removeItem(key)
  } catch {
    // A failed write must not leave the previous purpose behind for the next
    // reload to bring back.
    try {
      store.removeItem(key)
    } catch {
      /* storage unavailable — this page keeps the purpose in memory only */
    }
  }
}

function scopeState(scope: string): ScopeState {
  let state = scopes.get(scope)
  if (!state) {
    state = {
      purpose: load(scope),
      listeners: new Set(),
      watchers: new Set(),
      request: null,
      editors: [],
    }
    scopes.set(scope, state)
  }
  return state
}

function samePurpose(a: Purpose | null, b: Purpose | null): boolean {
  return a === b || (!!a && !!b && a.caseRef === b.caseRef && a.reason === b.reason)
}

function settle(state: ScopeState, purpose: Purpose | null): void {
  const request = state.request
  if (!request) return
  state.request = null
  request.resolve(purpose)
  for (const watcher of [...state.watchers]) watcher()
}

/**
 * The purpose stated in this app.
 *
 * The same object is returned until the purpose changes, so it can serve as a
 * snapshot for `useSyncExternalStore`.
 *
 * @param scope - The app's scope, e.g. `"chorus"`.
 * @returns The stated purpose, or `null` when none is stated.
 */
export function getPurpose(scope: string): Purpose | null {
  return scopeState(scope).purpose
}

/**
 * State the purpose for an app, persist it for the browser tab's session and
 * tell every subscriber. A blank purpose clears it.
 *
 * Also answers a pending {@link requestPurpose}: whatever is stated now is
 * what the waiting request is retried with.
 *
 * @param scope - The app's scope, e.g. `"chorus"`.
 * @param input - The new purpose; `null` or blank clears it.
 * @returns The purpose now stated, trimmed, or `null` when it was cleared.
 * @throws {PurposeError} If the purpose breaks the backend's rules
 *   ({@link validatePurpose}); the stored purpose is then left as it was.
 */
export function setPurpose(scope: string, input: PurposeInput | null): Purpose | null {
  const errors = input ? validatePurpose(input) : null
  if (errors) throw new PurposeError(errors)
  const state = scopeState(scope)
  const next = input && isPurposeStated(input) ? freeze(input) : null
  if (!samePurpose(state.purpose, next)) {
    state.purpose = next
    persist(scope, next)
    for (const listener of [...state.listeners]) listener(next)
  }
  settle(state, state.purpose)
  return state.purpose
}

/**
 * Clear the purpose stated for an app. A pending {@link requestPurpose}
 * resolves with `null`.
 *
 * @param scope - The app's scope.
 */
export function clearPurpose(scope: string): void {
  setPurpose(scope, null)
}

/**
 * Clear the purpose of every app in this browser tab — what signing out does.
 *
 * The apps share one origin behind the gateway, so their stored purposes sit
 * side by side in the same `sessionStorage`; this removes all of them, not
 * only the scopes this page has read.
 */
export function clearAllPurposes(): void {
  const store = sessionStore()
  try {
    const keys: string[] = []
    for (let i = 0; store && i < store.length; i++) {
      const key = store.key(i)
      if (key?.startsWith(PURPOSE_STORAGE_PREFIX)) keys.push(key)
    }
    for (const key of keys) store?.removeItem(key)
  } catch {
    /* storage unavailable — the in-memory purposes are cleared below regardless */
  }
  for (const scope of [...scopes.keys()]) setPurpose(scope, null)
}

/**
 * Be told whenever an app's purpose changes.
 *
 * @param scope - The app's scope.
 * @param listener - Called with the new purpose, or `null` once cleared.
 * @returns A function that unsubscribes.
 */
export function subscribePurpose(
  scope: string,
  listener: (purpose: Purpose | null) => void,
): () => void {
  const state = scopeState(scope)
  state.listeners.add(listener)
  return () => {
    state.listeners.delete(listener)
  }
}

/**
 * The headers a request needs for the purpose stated in this app — spread
 * them into a `fetch` call's `headers`.
 *
 * @param scope - The app's scope.
 * @returns `{ 'X-Audit-Purpose': … }`, or `{}` when no purpose is stated.
 */
export function purposeHeaders(scope: string): Record<string, string> {
  const purpose = getPurpose(scope)
  return purpose ? { [PURPOSE_HEADER]: encodePurpose(purpose) } : {}
}

/**
 * Ask the user for a purpose — what a fetch wrapper does after a
 * {@link PURPOSE_REQUIRED_STATUS} response.
 *
 * Opens the editor of the `PurposeBar` mounted for this scope. Requests made
 * while one is pending share it, so a burst of `428`s opens one dialog, not
 * several.
 *
 * @param scope - The app's scope.
 * @returns A promise of the purpose the user saved — retry the request with it
 *   — or of `null` when they cancelled or no `PurposeBar` is mounted to ask
 *   with, in which case the request should fail as it is.
 */
export function requestPurpose(scope: string): Promise<Purpose | null> {
  const state = scopeState(scope)
  if (state.request) return state.request.promise
  // An editor already open answers it, so a second dialog never stacks on the
  // first; otherwise the most recently mounted one.
  const editor = state.editors.find((e) => e.isOpen()) ?? state.editors[state.editors.length - 1]
  // Nothing on the page can ask, so say so now rather than wait forever.
  if (!editor) return Promise.resolve(null)
  let resolve!: (purpose: Purpose | null) => void
  const promise = new Promise<Purpose | null>((done) => {
    resolve = done
  })
  state.request = { promise, resolve }
  for (const watcher of [...state.watchers]) watcher()
  editor.open()
  return promise
}

/**
 * Send a request with the purpose stated in this app; on a `428`, ask for a
 * purpose and send it once more.
 *
 * `send` performs the request with the given headers merged into its own, and
 * may run twice — so it must build its body afresh each time (a string or
 * `FormData`, never an already-consumed stream).
 *
 * @param scope - The app's scope.
 * @param send - Performs the request with these headers added.
 * @returns The response — the original `428` when the user declined to state
 *   a purpose, so the caller's usual error handling applies.
 */
export async function withPurpose<R extends { status: number }>(
  scope: string,
  send: (headers: Record<string, string>) => Promise<R>,
): Promise<R> {
  const sent = purposeHeaders(scope)[PURPOSE_HEADER]
  const response = await send(sent ? { [PURPOSE_HEADER]: sent } : {})
  if (response.status !== PURPOSE_REQUIRED_STATUS) return response
  const now = purposeHeaders(scope)[PURPOSE_HEADER]
  // Stated while this request was in flight — by another request's prompt, or
  // in the bar — so send it again with that instead of asking a second time.
  if (now && now !== sent) return send(purposeHeaders(scope))
  const purpose = await requestPurpose(scope)
  return purpose ? send(purposeHeaders(scope)) : response
}

/**
 * Let a mounted `PurposeBar` answer {@link requestPurpose}. Internal to this
 * package.
 *
 * @param scope - The app's scope.
 * @param editor - Opens the bar's dialog, and says whether it is open.
 * @returns A function that unregisters the editor.
 */
export function registerPurposeEditor(scope: string, editor: PurposeEditor): () => void {
  const state = scopeState(scope)
  state.editors.push(editor)
  return () => {
    const wasOpen = editor.isOpen()
    state.editors = state.editors.filter((e) => e !== editor)
    // The dialog a request was waiting on is gone, or nothing is left to ask with.
    if (wasOpen || state.editors.length === 0) settle(state, null)
  }
}

/**
 * The editor closed without a purpose being saved: a pending
 * {@link requestPurpose} resolves with `null`. Internal to this package.
 *
 * @param scope - The app's scope.
 */
export function dismissPurposeRequest(scope: string): void {
  settle(scopeState(scope), null)
}

/**
 * Whether something is waiting on {@link requestPurpose}. Internal to this
 * package.
 *
 * @param scope - The app's scope.
 * @returns `true` while a request is pending.
 */
export function isPurposeRequested(scope: string): boolean {
  return scopeState(scope).request !== null
}

/**
 * Be told when a request for a purpose starts or settles. Internal to this
 * package.
 *
 * @param scope - The app's scope.
 * @param watcher - Called on every change.
 * @returns A function that unsubscribes.
 */
export function subscribePurposeRequest(scope: string, watcher: () => void): () => void {
  const state = scopeState(scope)
  state.watchers.add(watcher)
  return () => {
    state.watchers.delete(watcher)
  }
}

/** Test-only: forget every scope, as a page reload would. */
export function __resetPurposeStoreForTesting(): void {
  scopes.clear()
}
