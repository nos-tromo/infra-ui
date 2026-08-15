import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { cn } from '../cn'
import { CheckIcon, ChevronDownIcon } from '../icons'

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
}

/**
 * Pick one item from a list, with the trigger showing the current choice.
 *
 * The menu form of {@link Select}, and the reason it exists: a native
 * `<select>`'s popup inherits the element's own font size, so a `<select>`
 * styled as a page title at `text-2xl` opens a 24px list that covers the header
 * it sits in. Here the panel is a *sibling* of the trigger and declares
 * `text-sm` on itself, so the caller sizes the trigger text freely and the list
 * is unaffected. **Reach for `Select` first** — take this one only when the
 * closed control must be styled past what the platform will honor, because a
 * native select also brings type-ahead, a touch picker and form participation
 * that this cannot.
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
 * **No type-ahead yet** — the one real thing this gives up against a native
 * `<select>`. Doing it properly needs a keystroke buffer with a reset timer,
 * the same-letter-cycles rule, and an `Intl.Collator` so `Ü` finds "Übergabe"
 * in a German catalog; half of it is worse than none, because it looks like it
 * works until the first umlaut. It also wants `Space`, which currently commits.
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
}: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
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

  const openMenu = (fallback: 'first' | 'last') => {
    if (inert) return
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
      case ' ':
        e.preventDefault()
        commit(activeIndex)
        break
      case 'Tab':
        // No preventDefault — the browser moves focus on, and the panel must
        // not be left hanging open behind it.
        close()
        break
    }
  }

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
          'flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-transparent text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          inert ? 'cursor-default' : 'cursor-pointer',
          selectedIndex >= 0 && !isEmpty ? 'text-foreground' : 'text-muted-foreground',
          triggerClassName,
        )}
      >
        <span className="min-w-0 truncate">{triggerText}</span>
        {!isEmpty && (
          <ChevronDownIcon
            className={cn(
              // Sized in `em`, not `h-4`: the caller owns the trigger's text
              // size — that is the entire reason this primitive exists — and a
              // fixed 16px caret reads as pinned on beside a `text-2xl` title
              // and swamps a `text-xs` one. One chevron rotated, never a pair.
              'h-[0.8em] w-[0.8em] shrink-0 text-muted-foreground transition-transform',
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
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {options.map((option, index) => (
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
                option.disabled
                  ? 'cursor-default text-muted-foreground opacity-50'
                  : 'cursor-pointer',
              )}
            >
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.value === value && (
                <CheckIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
SelectMenu.displayName = 'SelectMenu'
