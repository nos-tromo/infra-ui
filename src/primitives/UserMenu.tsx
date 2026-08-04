import { useEffect, useRef, useState } from 'react'
import { cn } from '../cn'

export interface UserMenuProps {
  /** Signed-in user name (from the trusted X-Auth-User header). */
  user: string
  /** Gateway logout endpoint. */
  signOutHref?: string
  /** i18n hooks. */
  signOutLabel?: string
  menuLabel?: string
}

export function UserMenu({
  user,
  signOutHref = '/auth/logout',
  signOutLabel = 'Sign out',
  menuLabel = 'Account',
}: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${menuLabel}: ${user}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm',
          'hover:border-primary hover:text-foreground',
          open ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {user}
        <span aria-hidden className="text-xs">▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-40 rounded-lg border border-border bg-muted p-1"
        >
          <a
            role="menuitem"
            href={signOutHref}
            className="block rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-accent"
          >
            {signOutLabel}
          </a>
        </div>
      )}
    </div>
  )
}
