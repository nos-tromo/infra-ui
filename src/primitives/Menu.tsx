import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { cn } from '../cn'

/** What {@link MenuProps.trigger} must spread onto its button. */
export interface MenuTriggerProps {
  ref: Ref<HTMLButtonElement>
  id: string
  'aria-haspopup': 'menu'
  'aria-expanded': boolean
  'aria-controls': string | undefined
  onClick: () => void
  onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void
}

/** Handed to a render-prop body so it can dismiss the menu itself. */
export interface MenuRenderContext {
  /** Close the panel and return focus to the trigger. */
  close: () => void
}

export interface MenuProps {
  /**
   * Renders the button that opens the menu. **Spread the props last** — they
   * carry the ref and the `aria-*`/handler wiring, and a caller's own `id` or
   * `onClick` placed after them would silently win.
   */
  trigger: (props: MenuTriggerProps) => ReactNode
  /**
   * The `MenuItem`s, or a function when the body needs to dismiss the menu on
   * its own — a confirmation step that replaces the items with a question.
   */
  children: ReactNode | ((context: MenuRenderContext) => ReactNode)
  /** Accessible name for the panel. Defaults to the trigger's own name. */
  label?: string
  /** Which edge the panel hangs from. `'start'` = left, `'end'` = right. */
  align?: 'start' | 'end'
  /** Classes for the positioning wrapper. */
  className?: string
  /** Classes for the panel — width overrides. */
  panelClassName?: string
  /**
   * Fires on every open and close, whatever caused it. This is where a body
   * with its own state resets it, so a menu never reopens mid-confirmation.
   */
  onOpenChange?: (open: boolean) => void
}

interface MenuContextValue {
  close: (restoreFocus?: boolean) => void
}

const MenuContext = createContext<MenuContextValue | null>(null)

interface MenuItemBase {
  children: ReactNode
  /**
   * Rendered and announced, but not choosable — `aria-disabled`, never the
   * `disabled` attribute, because a disabled button shows no tooltip and
   * {@link MenuItemBase.hint} is usually the reason it is unavailable.
   */
  disabled?: boolean
  /** `'danger'` tints the row at rest: destructive rows are told apart before the pointer arrives. */
  tone?: 'default' | 'danger'
  /** Tooltip — most often why the item is unavailable. */
  hint?: string
  /** Default `true`. `false` keeps the panel open, for an item that opens a second step. */
  closeOnSelect?: boolean
  className?: string
}

export type MenuItemProps =
  | (MenuItemBase & {
      onSelect: () => void
      href?: never
      download?: never
      target?: never
      rel?: never
    })
  | (MenuItemBase & {
      /** Renders an `<a>`, so the browser's own download and popup handling applies. */
      href: string
      download?: boolean | string
      target?: '_blank'
      rel?: string
      onSelect?: () => void
    })

/**
 * Shared row styling.
 *
 * `focus:` rather than `focus-visible:` on purpose: the menu focuses its first
 * item programmatically on open, and after a mouse-open the browser's
 * focus-visible heuristic would leave that row unmarked — the one row the
 * keyboard is about to act on.
 */
function itemClasses(disabled: boolean, tone: 'default' | 'danger', className?: string): string {
  return cn(
    'flex w-full items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-left text-sm text-foreground',
    'outline-none hover:bg-accent focus:bg-accent',
    disabled ? 'cursor-default text-muted-foreground opacity-50' : 'cursor-pointer',
    tone === 'danger' && !disabled && 'text-danger',
    className,
  )
}

/**
 * One row of a {@link Menu} — a button that does something, or a link the
 * browser follows.
 *
 * @param props - `onSelect` or `href`; `disabled`, `tone`, `hint` and
 *   `closeOnSelect` adjust the row.
 * @returns The menu item.
 */
export function MenuItem({
  children,
  disabled = false,
  tone = 'default',
  hint,
  closeOnSelect = true,
  className,
  ...rest
}: MenuItemProps) {
  const menu = useContext(MenuContext)
  if (!menu) throw new Error('MenuItem must be rendered inside a Menu.')

  const { href, download, target, rel, onSelect } = rest as {
    href?: string
    download?: boolean | string
    target?: '_blank'
    rel?: string
    onSelect?: () => void
  }

  const activate = (event: ReactMouseEvent<HTMLElement>) => {
    if (disabled) {
      // A link is inert only if its navigation is cancelled; a button needs
      // nothing, but cancelling both keeps the two shapes honest.
      event.preventDefault()
      return
    }
    onSelect?.()
    if (closeOnSelect) menu.close(true)
  }

  const shared = {
    role: 'menuitem' as const,
    // Roving focus: the panel moves real focus between rows, so only the panel
    // itself is ever in the tab order.
    tabIndex: -1,
    'aria-disabled': disabled || undefined,
    title: hint,
    onClick: activate,
    onMouseMove: (event: ReactMouseEvent<HTMLElement>) => {
      if (!disabled) event.currentTarget.focus()
    },
    className: itemClasses(disabled, tone, className),
  }

  if (href !== undefined) {
    return (
      <a href={href} download={download} target={target} rel={rel} {...shared}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" {...shared}>
      {children}
    </button>
  )
}
MenuItem.displayName = 'MenuItem'

/**
 * A button that opens a list of actions.
 *
 * The action-menu companion to `SelectMenu`: same panel, same rows, but the
 * items *do* things rather than name a value, so this is the WAI-ARIA
 * menu-button pattern — `role="menu"` with real focus roving between
 * `role="menuitem"` rows, not `SelectMenu`'s `aria-activedescendant`. Three
 * things force real focus here: a `role="menu"` is not a descendant of the
 * trigger, so it cannot be an active descendant of it; a link item must be a
 * genuinely focused `<a>` for Enter to run the browser's own download and
 * popup handling; and a confirmation body holds arbitrary buttons that
 * `aria-activedescendant` cannot address. The price is that every close path
 * owes the trigger its focus back, which is what `close(restoreFocus)` is.
 *
 * Keyboard: `↓`/`↑`/`Enter`/`Space` open (Down from the top, Up from the
 * bottom) · `↓`/`↑` move and **clamp** at the ends, matching `SelectMenu` ·
 * `Home`/`End` jump · `Enter`/`Space` choose · `Esc` closes and restores focus
 * · `Tab` closes and moves on.
 *
 * Escape is handled here rather than on `document`, so one press dismisses one
 * layer — this menu, not also the dialog holding it. An app that listens for
 * Escape on `document` itself will still see it.
 *
 * @param props - `trigger` renders the button; `children` are the items.
 * @returns The menu.
 */
export function Menu({
  trigger,
  children,
  label,
  align = 'start',
  className,
  panelClassName,
  onOpenChange,
}: MenuProps) {
  const [open, setOpen] = useState(false)
  // Mirrors `open` for the handlers, which must read it without being
  // re-created (the document listener) or waiting for a render.
  const openRef = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<'first' | 'last' | null>(null)
  const id = useId()
  const triggerId = `${id}-trigger`
  const menuId = `${id}-menu`

  /** The choosable rows, in DOM order. Queried live so a swapped body needs no registry. */
  const enabledItems = () =>
    Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      ) ?? [],
    )

  const setOpenState = (next: boolean, restoreFocus = false) => {
    if (openRef.current === next) return
    openRef.current = next
    setOpen(next)
    if (!next) {
      pendingFocus.current = null
      // Synchronously, while the focused row is still mounted: after the
      // re-render it is gone and the browser has already dropped focus to the
      // body, which no later call can undo gracefully.
      if (restoreFocus) triggerRef.current?.focus()
    }
    onOpenChange?.(next)
  }

  const openMenu = (fallback: 'first' | 'last') => {
    pendingFocus.current = fallback
    setOpenState(true)
  }

  const close = (restoreFocus = true) => setOpenState(false, restoreFocus)

  // No dependency array: this runs after every render while open, which is what
  // re-homes focus when the body swaps the focused row for something else.
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return

    const want = pendingFocus.current
    if (want) {
      pendingFocus.current = null
      const rows = enabledItems()
      const target = want === 'last' ? rows[rows.length - 1] : rows[0]
      ;(target ?? panel).focus()
      return
    }

    const active = document.activeElement as HTMLElement | null
    if (active && active.isConnected && rootRef.current?.contains(active)) return
    const fallback =
      enabledItems()[0] ??
      panel.querySelector<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]')
    ;(fallback ?? panel).focus()
  })

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (openRef.current) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close(true)
      }
      return
    }
    // preventDefault cancels the button's own activation, so the click the
    // browser would synthesize cannot immediately shut what this opened.
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openMenu('first')
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openMenu('last')
    }
  }

  const onPanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close(true)
      return
    }

    const active = document.activeElement as HTMLElement | null
    const onRow = Boolean(active?.matches('[role="menuitem"]'))

    if (event.key === 'Tab') {
      // No preventDefault — the browser moves focus on. Handing focus back to
      // the trigger first is what makes it land on the control *after* this
      // menu rather than nowhere, since the row it is leaving is about to
      // unmount. Content that is not a row (a confirmation's buttons) keeps
      // its own tab order.
      if (onRow) close(true)
      return
    }

    if (!onRow) return
    const rows = enabledItems()
    const index = rows.indexOf(active!)
    const move = (next: number) => {
      event.preventDefault()
      // Clamped, like SelectMenu's arrows: holding a key lands somewhere
      // deterministic and Home/End keep a meaning.
      rows[Math.max(0, Math.min(rows.length - 1, next))]?.focus()
    }
    switch (event.key) {
      case 'ArrowDown':
        move(index + 1)
        break
      case 'ArrowUp':
        move(index - 1)
        break
      case 'Home':
        move(0)
        break
      case 'End':
        move(rows.length - 1)
        break
    }
  }

  const onRootBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    if (!openRef.current) return
    // A null `relatedTarget` is the window losing focus, or a row unmounting —
    // neither is the user leaving, and closing on those would fight the
    // re-homing effect above.
    const next = event.relatedTarget as Node | null
    if (next && !rootRef.current?.contains(next)) close(false)
  }

  return (
    <div ref={rootRef} className={cn('relative', className)} onBlur={onRootBlur}>
      {trigger({
        ref: triggerRef,
        id: triggerId,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        onClick: () => {
          // Safari and Firefox on macOS do not focus a <button> on click, so
          // without this the arrows are dead after a mouse-open.
          triggerRef.current?.focus()
          if (openRef.current) close(true)
          else openMenu('first')
        },
        onKeyDown: onTriggerKeyDown,
      })}

      {open && (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          tabIndex={-1}
          {...(label ? { 'aria-label': label } : { 'aria-labelledby': triggerId })}
          onKeyDown={onPanelKeyDown}
          className={cn(
            'absolute top-full z-30 mt-1 min-w-40 max-w-[min(24rem,90vw)]',
            'rounded-lg border border-border bg-muted p-1 text-sm shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          <MenuContext.Provider value={{ close }}>
            {typeof children === 'function' ? children({ close: () => close(true) }) : children}
          </MenuContext.Provider>
        </div>
      )}
    </div>
  )
}
Menu.displayName = 'Menu'
