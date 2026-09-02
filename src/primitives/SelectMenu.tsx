import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { cn } from '../cn'
import { CheckIcon, ChevronDownIcon } from '../icons'

/**
 * Prefix matching for the type-ahead.
 *
 * `sensitivity: 'base'` folds case *and* diacritics, which is the whole point
 * in the German catalogs these apps carry: `u` has to find `Übergabe`, because
 * an operator does not think about which key their keyboard puts an umlaut on.
 * `usage: 'search'` is what makes that folding legal rather than a sorting
 * accident.
 */
const search = new Intl.Collator(undefined, { sensitivity: 'base', usage: 'search' })

/** How long a keystroke stays part of the current word. */
const TYPEAHEAD_RESET_MS = 500

/**
 * Whether a key is a character the user typed rather than a command.
 *
 * The modifier check is what keeps `Ctrl+C` a copy instead of a jump to the
 * first option starting with "c".
 */
function printable(e: ReactKeyboardEvent): boolean {
  return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey
}

export interface SelectMenuOption {
  /** Handed back to `onChange`. Unique within `options`. */
  value: string
  /**
   * The only text the user reads — on the closed trigger and on the row.
   *
   * Deliberately one string rather than a label plus a hint slot: a second slot
   * needs its own alignment, truncation and reading order, and the counts and
   * owners callers want there are part of what the operator reads as the *name*
   * of the thing. Compose it: `` `${title} (${count})` ``.
   */
  label: string
  /** Rendered and announced, but not choosable. The arrows step over it. */
  disabled?: boolean
  /**
   * Puts this option under a named heading — the `<optgroup>` a native
   * `<select>` would give you.
   *
   * Purely a rendering concern: headings are not options, so they take no
   * index, no id and no place in the keyboard's world. Options sharing a group
   * must be **adjacent** — this never sorts, so a repeated name after a gap
   * draws a second heading, which is the caller's ordering shown faithfully.
   * Empty is no group at all.
   */
  group?: string
}

export interface SelectMenuProps {
  /** The list to choose from. Empty renders {@link SelectMenuProps.emptyLabel}. */
  options: SelectMenuOption[]
  /** The chosen `value`, or `null` for "nothing chosen yet". */
  value: string | null
  /**
   * Called with the chosen `value` — never the label, and never `null`. There
   * is no un-choosing: a placeholder is a state you leave, not one you return
   * to, matching a native `<select>` whose placeholder option is disabled.
   */
  onChange: (value: string) => void
  /**
   * Accessible name for the trigger and the list. Required: the trigger's
   * visible text is a data value, so it cannot serve as a stable name.
   */
  label: string
  /** Trigger text while `value` matches nothing. */
  placeholder?: string
  /** Trigger text while `options` is empty. Falls back to `placeholder`. */
  emptyLabel?: string
  /** Which edge the panel hangs from. `'start'` = left, `'end'` = right. */
  align?: 'start' | 'end'
  /** Classes for the positioning wrapper — width and margins. Never `text-*`. */
  className?: string
  /** Classes for the trigger. This is where a `text-2xl font-semibold` goes. */
  triggerClassName?: string
  /** Blocks the control entirely — distinct from having nothing to offer. */
  disabled?: boolean
  /**
   * `'inline'` (the default) is the bare trigger: transparent, unboxed, sized
   * by whatever `triggerClassName` says. `'field'` wears `Input`'s box, for a
   * picker standing in a form row beside real inputs.
   */
  variant?: 'inline' | 'field'
}

/**
 * Pick one item from a list, with the trigger showing the current choice.
 *
 * **The federation's picker.** `Select` — a bare native `<select>` — is
 * deprecated in its favour, because a native popup is OS chrome: it ignores the
 * app's accent, cannot show a chosen row as chosen in the app's own terms, and
 * inherits the trigger's font size, so a `<select>` styled as a page title at
 * `text-2xl` opens a 24px list that covers the header it sits in. Here the
 * panel is a *sibling* of the trigger and declares `text-sm` on itself, so the
 * caller sizes the trigger text freely and the list is unaffected.
 * `variant="field"` puts that same picker in `Input`'s box for a form row.
 *
 * What a native select still has that this does not: a touch picker, and
 * participation in form submission. Reach past this only for those.
 *
 * Options are data rather than `children`: this component owns the active
 * index, the option ids, `aria-selected` and the empty state, all of which need
 * the list itself — and a `children` API would let a caller drop a `<div>`
 * inside `role="listbox"`, a break it could not police.
 *
 * Keyboard, all of it landing on the trigger because focus never leaves it:
 * `ArrowDown`/`ArrowUp`/`Enter`/`Space` open (Down from the top, Up from the
 * bottom, both preferring the current value); the arrows then move the active
 * row and **clamp** at the ends rather than wrapping, so holding a key lands
 * somewhere deterministic and `Home`/`End` still mean something;
 * `Enter`/`Space` commit; `Escape` closes without committing; `Tab` closes and
 * moves on.
 *
 * Focus stays on the trigger via `aria-activedescendant` rather than roving
 * `tabIndex`. Moving real focus into the panel would make every close path
 * responsible for putting it back, and each missed path strands focus on the
 * body; it also breaks `Tab`, which from a focused row would skip past the
 * trigger. The price is that the browser scrolls nothing for us, so the active
 * row is scrolled into view by hand below.
 *
 * Type-ahead is implemented: printable keys build a word that resets after half
 * a second, a repeated letter steps through the run of options sharing it, and
 * an `Intl.Collator` at base sensitivity means `u` finds "Übergabe" in a German
 * catalog. The scan wraps where the arrows clamp — the arrows are a step and
 * have ends, a search is a lookup and has none. `Space` therefore commits only
 * on an empty buffer; mid-word it is a space, because half these catalogs are
 * two-word names. Typing on a *closed* picker changes the value where it
 * stands, as a native select does.
 */
export function SelectMenu({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select…',
  emptyLabel,
  align = 'start',
  className,
  triggerClassName,
  disabled = false,
  variant = 'inline',
}: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const typeahead = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | undefined }>({
    buffer: '',
    timer: undefined,
  })
  const id = useId()
  const listboxId = `${id}-listbox`

  const isEmpty = options.length === 0
  const selectedIndex = options.findIndex((o) => o.value === value)
  const inert = disabled || isEmpty
  // A stale value — a report deleted in another tab — falls back to the
  // placeholder rather than rendering a blank title.
  const triggerText = isEmpty
    ? (emptyLabel ?? placeholder)
    : selectedIndex >= 0
      ? options[selectedIndex].label
      : placeholder

  /** First enabled option at or after `from`, walking `dir`; -1 if none. */
  const step = (from: number, dir: 1 | -1) => {
    for (let i = from; i >= 0 && i < options.length; i += dir) {
      if (!options[i].disabled) return i
    }
    return -1
  }

  const resetTypeahead = () => {
    clearTimeout(typeahead.current.timer)
    typeahead.current.buffer = ''
    typeahead.current.timer = undefined
  }

  const openMenu = (fallback: 'first' | 'last') => {
    if (inert) return
    // A fresh panel is a fresh word: half of yesterday's search still in the
    // buffer would make the first letter typed match nothing at all.
    resetTypeahead()
    setActiveIndex(
      selectedIndex >= 0 && !options[selectedIndex].disabled
        ? selectedIndex
        : fallback === 'last'
          ? step(options.length - 1, -1)
          : step(0, 1),
    )
    setOpen(true)
  }

  // Clearing the active index is what makes a reopen start from the current
  // value again instead of wherever the arrows were left.
  const close = () => {
    setOpen(false)
    setActiveIndex(-1)
  }

  const commit = (index: number) => {
    const option = options[index]
    if (!option || option.disabled) return
    // Close first: a handler that throws must not leave the panel open, and a
    // handler that swaps `options` must not meet a stale active index.
    close()
    onChange(option.value)
  }

  /**
   * One printable keystroke of type-ahead.
   *
   * Repeating a letter steps to the *next* match instead of lengthening the
   * word, which is how a native `<select>` walks a run of same-initial options.
   * The scan wraps where the arrows clamp: the arrows are a step and have ends,
   * a search is a lookup and has none.
   */
  const typeAhead = (key: string) => {
    const state = typeahead.current
    clearTimeout(state.timer)
    const cycling =
      state.buffer.length > 0 && [...state.buffer].every((c) => search.compare(c, key) === 0)
    const buffer = cycling ? state.buffer : (state.buffer + key).normalize('NFC')
    state.buffer = buffer
    state.timer = setTimeout(() => {
      typeahead.current.buffer = ''
    }, TYPEAHEAD_RESET_MS)

    const current = open ? activeIndex : selectedIndex
    // A first letter always moves on, so pressing it again walks the run; more
    // letters keep the row they narrowed onto.
    const from = cycling || buffer.length === 1 ? current + 1 : Math.max(current, 0)
    for (let i = 0; i < options.length; i++) {
      const index = (((from + i) % options.length) + options.length) % options.length
      const option = options[index]
      if (option.disabled) continue
      if (search.compare(option.label.normalize('NFC').slice(0, buffer.length), buffer) !== 0)
        continue
      // Closed, this changes the value where it stands — what a native select
      // does, and what a field-shaped picker in a form is read as promising.
      if (open) setActiveIndex(index)
      else commit(index)
      return
    }
  }

  useEffect(() => clearTimeout(typeahead.current.timer), [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // `aria-activedescendant` moves no real focus, so nothing scrolls unless we
  // do it. This is the standing cost of not using a roving tabIndex.
  useEffect(() => {
    if (!open) return
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView?.({ block: 'nearest' })
  }, [open, activeIndex])

  const onKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (inert) return
    if (!open) {
      // preventDefault cancels the button's own activation, so the click the
      // browser would synthesize cannot immediately shut what this opened.
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openMenu('first')
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        openMenu('last')
      } else if (printable(e)) {
        e.preventDefault()
        typeAhead(e.key)
      }
      return
    }
    const move = (next: number) => {
      e.preventDefault()
      if (next !== -1) setActiveIndex(next)
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        // Handled here rather than on `document`: a document-level Escape
        // listener would close this menu *and* whatever dialog encloses it, on
        // a single press.
        e.stopPropagation()
        close()
        break
      case 'ArrowDown':
        move(step(activeIndex + 1, 1))
        break
      case 'ArrowUp':
        move(step(activeIndex - 1, -1))
        break
      case 'Home':
        move(step(0, 1))
        break
      case 'End':
        move(step(options.length - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        commit(activeIndex)
        break
      case ' ':
        e.preventDefault()
        // Mid-word a space is a space: half the catalogs here are two-word
        // names, and committing on the first one makes them unreachable.
        if (typeahead.current.buffer) typeAhead(' ')
        else commit(activeIndex)
        break
      case 'Tab':
        // No preventDefault — the browser moves focus on, and the panel must
        // not be left hanging open behind it.
        close()
        break
      default:
        if (printable(e)) {
          e.preventDefault()
          typeAhead(e.key)
        }
    }
  }

  /**
   * One option row. Takes the index rather than the option so the id, the
   * active mark and `commit` all keep speaking the same flat language they did
   * before groups existed.
   */
  const renderOption = (index: number) => {
    const option = options[index]
    return (
      <div
        key={option.value}
        id={`${id}-o${index}`}
        role="option"
        aria-selected={option.value === value}
        aria-disabled={option.disabled || undefined}
        data-active={index === activeIndex || undefined}
        title={option.label}
        // Keep focus on the trigger: a mousedown here would blur it, and
        // `aria-activedescendant` only means anything while the combobox
        // itself has focus.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => commit(index)}
        onMouseMove={() => {
          if (!option.disabled && index !== activeIndex) setActiveIndex(index)
        }}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground',
          // Two marks, two meanings: the tick is the current value, the
          // tinted row is the keyboard cursor. They are usually apart.
          index === activeIndex && 'bg-accent',
          option.disabled ? 'cursor-default text-muted-foreground opacity-50' : 'cursor-pointer',
        )}
      >
        <span className="min-w-0 flex-1 truncate">{option.label}</span>
        {option.value === value && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-primary" />}
      </div>
    )
  }

  /**
   * Consecutive runs of options sharing a `group`, in the order given.
   *
   * Grouping is a rendering pass and nothing more: the headings live outside
   * `options`, so `step`, Home/End, the type-ahead and `aria-activedescendant`
   * never learn they exist.
   */
  const segments: Array<{ group: string | null; indices: number[] }> = []
  options.forEach((option, index) => {
    const group = option.group || null
    const last = segments[segments.length - 1]
    if (last && last.group === group) last.indices.push(index)
    else segments.push({ group, indices: [index] })
  })

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? `${id}-o${activeIndex}` : undefined}
        // `aria-disabled` rather than `disabled` for the empty case: a picker
        // with nothing behind it is not a broken control. Staying focusable
        // lets a keyboard user land on it and hear "Select report, No reports
        // yet" instead of tabbing straight past the page's own title.
        aria-disabled={isEmpty || undefined}
        disabled={disabled}
        onClick={() => {
          // Safari and Firefox on macOS do not focus a <button> on click, so
          // without this every key handler above is dead after a mouse-open —
          // and with `aria-activedescendant` the trigger *must* hold focus.
          triggerRef.current?.focus()
          if (open) close()
          else openMenu('first')
        }}
        onKeyDown={onKeyDown}
        className={cn(
          'flex min-w-0 items-center gap-1.5 rounded-md text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          // The field variant is `Input`'s own recipe, so a picker and a text
          // box standing in the same form row are the same box.
          variant === 'field'
            ? 'h-10 w-full border border-border bg-background px-3 text-sm disabled:opacity-50'
            : 'max-w-full bg-transparent',
          inert ? 'cursor-default' : 'cursor-pointer',
          selectedIndex >= 0 && !isEmpty ? 'text-foreground' : 'text-muted-foreground',
          triggerClassName,
        )}
      >
        <span className={cn('min-w-0 truncate', variant === 'field' && 'flex-1')}>
          {triggerText}
        </span>
        {!isEmpty && (
          <ChevronDownIcon
            className={cn(
              // Inline is sized in `em`, not `h-4`: the caller owns the
              // trigger's text size — that is the entire reason this primitive
              // exists — and a fixed 16px caret reads as pinned on beside a
              // `text-2xl` title and swamps a `text-xs` one. The field variant
              // fixes the text size itself, so that argument lapses and 0.8em
              // of 14px is just a smudge in a 40px box. One chevron rotated,
              // never a pair.
              variant === 'field' ? 'h-4 w-4' : 'h-[0.8em] w-[0.8em]',
              'shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
        )}
      </button>

      {open && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={label}
          className={cn(
            'absolute top-full z-30 mt-1 max-h-80 min-w-48 max-w-[min(32rem,90vw)] overflow-y-auto',
            // `text-sm` declared here, never inherited. A native <select>'s
            // popup inheriting `text-2xl` from its trigger is the bug this
            // replaces, so the size is restated on the panel *and* every row.
            'rounded-lg border border-border bg-muted p-1 text-sm shadow-lg',
            // A native popup is never narrower than the control it belongs to.
            variant === 'field' && 'min-w-full',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {segments.map((segment, position) =>
            segment.group === null ? (
              <Fragment key={`s${position}`}>{segment.indices.map(renderOption)}</Fragment>
            ) : (
              <div key={`s${position}`} role="group" aria-labelledby={`${id}-h${position}`}>
                <div
                  id={`${id}-h${position}`}
                  role="presentation"
                  // Same guard the rows carry: a mousedown here would blur the
                  // trigger, and `aria-activedescendant` means nothing without it.
                  onMouseDown={(e) => e.preventDefault()}
                  className="select-none px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground"
                >
                  {segment.group}
                </div>
                {segment.indices.map(renderOption)}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  )
}
SelectMenu.displayName = 'SelectMenu'
