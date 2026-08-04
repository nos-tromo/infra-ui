import { useState, type ReactNode } from 'react'
import { cn } from '../cn'
import { ThemeToggle, type ThemeToggleLabels } from '../primitives/ThemeToggle'
import { UserMenu } from '../primitives/UserMenu'

export const SIDEBAR_STORAGE_KEY = 'infra-ui-sidebar'

export interface AppShellProps {
  /** App display name in the chrome header. */
  title: string
  version?: string
  /** Signed-in user; UserMenu is omitted entirely when absent. */
  user?: string
  homeHref?: string
  homeLabel?: string
  themeLabels?: ThemeToggleLabels
  signOutHref?: string
  signOutLabel?: string
  /** Sidebar content; omit for header-only apps (Nextext, translator). */
  sidebar?: ReactNode
  sidebarToggleLabel?: string
  children: ReactNode
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function AppShell({
  title,
  version,
  user,
  homeHref = '/',
  homeLabel = 'Apps',
  themeLabels,
  signOutHref,
  signOutLabel,
  sidebar,
  sidebarToggleLabel = 'Toggle sidebar',
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const toggleSidebar = () => {
    setCollapsed((v) => {
      const next = !v
      try {
        if (next) localStorage.setItem(SIDEBAR_STORAGE_KEY, '1')
        else localStorage.removeItem(SIDEBAR_STORAGE_KEY)
      } catch {
        /* storage unavailable — in-memory only */
      }
      return next
    })
  }

  return (
    <div className="flex h-screen flex-col bg-chrome text-foreground">
      <header className="flex h-12 items-center gap-3 px-4">
        {sidebar && (
          <button
            type="button"
            aria-label={sidebarToggleLabel}
            aria-expanded={!collapsed}
            onClick={toggleSidebar}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span aria-hidden>☰</span>
          </button>
        )}
        <a
          href={homeHref}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <span aria-hidden>←</span>
          {homeLabel}
        </a>
        <span className="text-sm font-semibold">{title}</span>
        {version && <span className="text-xs text-muted-foreground">{version}</span>}
        <span className="flex-1" />
        <ThemeToggle labels={themeLabels} />
        {user && <UserMenu user={user} signOutHref={signOutHref} signOutLabel={signOutLabel} />}
      </header>
      <div className="flex min-h-0 flex-1">
        {sidebar && !collapsed && (
          <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto p-4">{sidebar}</aside>
        )}
        <main
          className={cn(
            'min-w-0 flex-1 overflow-auto border-t border-border bg-background',
            sidebar && 'rounded-tl-lg border-l',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export function SidebarGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      )}
      {children}
    </div>
  )
}
