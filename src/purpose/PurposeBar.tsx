import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
  type SyntheticEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { cva } from 'class-variance-authority'
import { cn } from '../cn'
import { InfoIcon, TagIcon, WarningIcon } from '../icons'
import { ActionBar } from '../primitives/ActionBar'
import { Button } from '../primitives/Button'
import { Input } from '../primitives/Input'
import {
  MAX_PURPOSE_FIELD,
  clearPurpose,
  dismissPurposeRequest,
  getPurpose,
  isPurposeRequested,
  isPurposeStated,
  registerPurposeEditor,
  setPurpose,
  subscribePurposeRequest,
  validatePurpose,
  type PurposeFieldError,
} from './purpose'
import { usePurpose } from './usePurpose'

export interface PurposeBarLabels {
  /** Names the purpose in the bar and its accessible name ("Purpose: …"). */
  purpose: string
  /** The bar when no purpose is stated. */
  empty: string
  /** The bar when no purpose is stated and the app requires one. */
  required: string
  /** The dialog's title. */
  title: string
  /** The dialog's line on what a stated purpose does. */
  description: string
  /** The dialog's note when a request is waiting for a purpose. */
  requested: string
  /** The case-reference field. */
  caseRef: string
  /** The reason field. */
  reason: string
  save: string
  cancel: string
  /** Removes the stated purpose; shown only while one is stated. */
  clear: string
  /** A field is too long. The literal `{max}` is replaced with the limit. */
  errorLength: string
  /** A field holds a line break, tab or other control character. */
  errorControl: string
  /** Both fields are within their limit but too long to send together. */
  errorHeader: string
  /** Saving no purpose where one is needed. */
  errorEmpty: string
}

export interface PurposeBarProps {
  /**
   * The app this purpose belongs to — `"chorus"`, `"docint"`, … It keys the
   * stored purpose and routes {@link requestPurpose}, so pass the same string
   * the app's fetch wrapper uses.
   */
  scope: string
  /**
   * The app's backend refuses some requests without a stated purpose: the
   * empty bar becomes a warning, and saving a blank purpose is refused.
   */
  required?: boolean
  /** Localized strings; English defaults fill any not given. */
  labels?: Partial<PurposeBarLabels>
  /** Classes for the bar's button — margins, width. */
  className?: string
}

const DEFAULT_LABELS: PurposeBarLabels = {
  purpose: 'Purpose',
  empty: 'No purpose stated',
  required: 'Purpose required',
  title: 'Purpose',
  description:
    'Sent with each request you make in this app until you change or clear it, or the session ends.',
  requested: 'This action needs a stated purpose.',
  caseRef: 'Case reference',
  reason: 'Reason',
  save: 'Save',
  cancel: 'Cancel',
  clear: 'Clear',
  errorLength: 'At most {max} characters.',
  errorControl: 'Remove line breaks, tabs and other control characters.',
  errorHeader: 'Too long to send together. Shorten one of the fields.',
  errorEmpty: 'Enter a case reference or a reason.',
}

const trigger = cva(
  [
    // A square icon button below `sm`, where the header has no room for words;
    // from there up it widens and truncates to whatever room is left.
    'inline-flex h-8 w-8 shrink-0 items-center justify-center gap-1.5 rounded-md border text-sm transition-colors',
    'sm:w-auto sm:min-w-0 sm:shrink sm:justify-start sm:px-3',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
  ],
  {
    variants: {
      state: {
        set: 'border-border text-foreground hover:border-primary',
        // Dashed: an empty slot waiting to be filled, quieter than a set purpose.
        empty:
          'border-dashed border-border text-muted-foreground hover:border-primary hover:text-foreground',
        // Banner's danger recipe: the colour sits in the border, tint and icon,
        // so the text keeps the foreground's contrast.
        required: 'border-danger/40 bg-danger/10 text-foreground hover:border-danger',
      },
    },
  },
)

interface Draft {
  caseRef: string
  reason: string
}

interface FieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  /** This field's own error message. */
  error?: string
  /** A form-level error this field takes part in. */
  formErrorId?: string
  inputRef: Ref<HTMLInputElement>
  spellCheck?: boolean
}

function PurposeField({
  id,
  label,
  value,
  onChange,
  error,
  formErrorId,
  inputRef,
  spellCheck,
}: FieldProps) {
  const errorId = `${id}-error`
  const describedBy = [error && errorId, formErrorId].filter(Boolean).join(' ')
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        spellCheck={spellCheck}
        aria-invalid={error || formErrorId ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="aria-invalid:border-danger aria-invalid:focus-visible:ring-danger"
      />
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * The purpose stated in this app, shown in the header, and the dialog that
 * states it.
 *
 * The bar is one compact button sized for `AppShell`'s `headerActions` slot:
 * the purpose when one is stated, a dashed "No purpose stated" when not, and a
 * warning when the app `required`s one. It opens a modal `<dialog>` with the
 * two fields, validated inline against the backend's rules. The dialog is
 * also what {@link requestPurpose} opens after a `428`, so a request that
 * needs a purpose can wait for the user to state one and then be retried.
 *
 * A native modal dialog rather than a hand-rolled overlay: the browser makes
 * the rest of the page inert and puts the dialog in the top layer, above any
 * stacking context the header sits in. Focus moves to the first field on
 * open and back to whatever held it on close — the bar, or the control whose
 * request asked. Escape and Cancel discard the edit; Enter in a field saves.
 * The scrim does not dismiss it, so a stray click never loses what was typed.
 *
 * @param props - `scope` names the app; `required`, `labels` and `className`
 *   adjust it.
 * @returns The bar, plus the dialog while it is open.
 */
export function PurposeBar({ scope, required = false, labels, className }: PurposeBarProps) {
  const L = { ...DEFAULT_LABELS, ...labels }
  const { purpose } = usePurpose(scope)
  const subscribeRequested = useCallback(
    (watcher: () => void) => subscribePurposeRequest(scope, watcher),
    [scope],
  )
  const requested = useSyncExternalStore(
    subscribeRequested,
    () => isPurposeRequested(scope),
    () => false,
  )

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({ caseRef: '', reason: '' })
  const [attempted, setAttempted] = useState(false)
  // Mirrors `open` for the store and the native events, which must read it
  // without waiting for a render.
  const openRef = useRef(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const caseRefInput = useRef<HTMLInputElement>(null)
  const reasonInput = useRef<HTMLInputElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const id = useId()

  const show = useCallback(() => {
    if (openRef.current) return
    // Whatever held focus gets it back: the bar, or the control whose request
    // asked for a purpose.
    const active = document.activeElement
    returnFocus.current = active instanceof HTMLElement && active !== document.body ? active : null
    const current = getPurpose(scope)
    setDraft({ caseRef: current?.caseRef ?? '', reason: current?.reason ?? '' })
    setAttempted(false)
    openRef.current = true
    setOpen(true)
  }, [scope])

  useEffect(
    () => registerPurposeEditor(scope, { open: show, isOpen: () => openRef.current }),
    [scope, show],
  )

  useLayoutEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }
    caseRefInput.current?.focus()
  }, [open])

  const finish = () => {
    openRef.current = false
    // Closed natively first: while the dialog is modal the rest of the page
    // is inert, and focus could not go back to it.
    const dialog = dialogRef.current
    if (dialog?.open) dialog.close()
    const target = returnFocus.current?.isConnected ? returnFocus.current : triggerRef.current
    returnFocus.current = null
    target?.focus()
    setOpen(false)
  }

  const cancel = () => {
    if (!openRef.current) return
    dismissPurposeRequest(scope)
    finish()
  }

  const errors = open ? validatePurpose(draft) : null
  const mustState = required || requested
  const missing = attempted && mustState && !isPurposeStated(draft)

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // The dialog is portalled, but React still bubbles its events through the
    // bar's ancestors — a form around the bar must not see this submit.
    event.stopPropagation()
    if (errors || (mustState && !isPurposeStated(draft))) {
      setAttempted(true)
      // The field to fix: the case reference's own error, else the reason's or
      // the combined length (the reason is the long one), else the first field.
      const target = errors?.caseRef ? caseRefInput : errors ? reasonInput : caseRefInput
      target.current?.focus()
      return
    }
    setPurpose(scope, draft)
    finish()
  }

  const clear = () => {
    clearPurpose(scope)
    finish()
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Escape' || event.nativeEvent.isComposing) return
    // Handled here rather than left to the browser, so every engine cancels
    // the same way and one press closes one layer.
    event.preventDefault()
    event.stopPropagation()
    cancel()
  }

  // The browser's own close request — a back gesture, or an Escape that
  // reached it — is a cancel too.
  const onCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()
    cancel()
  }

  const fieldMessage = (error: PurposeFieldError | undefined) =>
    error === 'length'
      ? L.errorLength.replaceAll('{max}', String(MAX_PURPOSE_FIELD))
      : error === 'control'
        ? L.errorControl
        : undefined

  const titleId = `${id}-title`
  const descriptionId = `${id}-description`
  const requestedId = `${id}-requested`
  const formErrorId = `${id}-form-error`
  const formError = errors?.header ? L.errorHeader : missing ? L.errorEmpty : undefined

  const state = purpose ? 'set' : required ? 'required' : 'empty'
  const summary = purpose ? [purpose.caseRef, purpose.reason].filter(Boolean).join(' · ') : ''
  const name = purpose ? `${L.purpose}: ${summary}` : required ? L.required : L.empty
  // The full fields, since the bar truncates them.
  const detail = purpose
    ? [
        purpose.caseRef && `${L.caseRef}: ${purpose.caseRef}`,
        purpose.reason && `${L.reason}: ${purpose.reason}`,
      ]
        .filter(Boolean)
        .join('\n')
    : undefined

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-label={name}
        title={detail}
        data-state={state}
        onClick={show}
        className={cn(trigger({ state }), className)}
      >
        {state === 'required' ? (
          <WarningIcon className="h-4 w-4 shrink-0 text-danger" />
        ) : (
          // Lit with the accent once stated, so the icon alone still tells
          // the two quiet states apart where the words are hidden.
          <TagIcon
            className={cn('h-4 w-4 shrink-0', purpose ? 'text-primary' : 'text-muted-foreground')}
          />
        )}
        {purpose ? (
          <>
            <span className="hidden shrink-0 text-muted-foreground sm:inline">{L.purpose}</span>
            <span className="hidden min-w-0 max-w-xs truncate sm:block">{summary}</span>
          </>
        ) : (
          <span className="hidden min-w-0 truncate sm:block">{name}</span>
        )}
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            aria-describedby={requested ? `${requestedId} ${descriptionId}` : descriptionId}
            onKeyDown={onKeyDown}
            onCancel={onCancel}
            onClose={() => {
              // Closed by the browser rather than by us: keep the state honest.
              if (openRef.current) cancel()
            }}
            className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-background p-0 text-foreground shadow-lg backdrop:bg-background/80"
          >
            <form noValidate onSubmit={save} className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-1.5">
                <h2 id={titleId} className="text-base font-semibold">
                  {L.title}
                </h2>
                {requested && (
                  <p id={requestedId} className="flex items-start gap-1.5 text-sm text-foreground">
                    <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {L.requested}
                  </p>
                )}
                <p id={descriptionId} className="text-sm text-muted-foreground">
                  {L.description}
                </p>
              </div>
              <PurposeField
                id={`${id}-case-ref`}
                label={L.caseRef}
                value={draft.caseRef}
                onChange={(caseRef) => setDraft((d) => ({ ...d, caseRef }))}
                error={fieldMessage(errors?.caseRef)}
                formErrorId={formError ? formErrorId : undefined}
                inputRef={caseRefInput}
                spellCheck={false}
              />
              <PurposeField
                id={`${id}-reason`}
                label={L.reason}
                value={draft.reason}
                onChange={(reason) => setDraft((d) => ({ ...d, reason }))}
                error={fieldMessage(errors?.reason)}
                formErrorId={formError ? formErrorId : undefined}
                inputRef={reasonInput}
              />
              {formError && (
                <p id={formErrorId} className="text-sm text-danger">
                  {formError}
                </p>
              )}
              <ActionBar className="pt-1">
                {purpose && (
                  <Button type="button" variant="secondary" size="sm" onClick={clear}>
                    {L.clear}
                  </Button>
                )}
                <Button type="button" variant="secondary" size="sm" onClick={cancel}>
                  {L.cancel}
                </Button>
                <Button type="submit" size="sm">
                  {L.save}
                </Button>
              </ActionBar>
            </form>
          </dialog>,
          document.body,
        )}
    </>
  )
}
PurposeBar.displayName = 'PurposeBar'
