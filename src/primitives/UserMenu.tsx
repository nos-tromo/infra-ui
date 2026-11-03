import { cn } from '../cn'
import { ChevronDownIcon } from '../icons'
import { clearAllPurposes } from '../purpose/purpose'
import { Menu, MenuItem } from './Menu'

export interface UserMenuProps {
  /** Signed-in user name (from the trusted X-Auth-User header). */
  user: string
  /** Gateway logout endpoint. */
  signOutHref?: string
  /** i18n hooks. */
  signOutLabel?: string
  menuLabel?: string
}

/**
 * Identity and sign-out, in the app chrome's top right.
 *
 * A thin arrangement of {@link Menu}: the keyboard map, the focus handling and
 * the dismissal all live there, so the header's menu and an app's own action
 * menus cannot drift apart. Signing out also clears every purpose stated in
 * this tab (`clearAllPurposes`).
 *
 * @param props - `user` names the signed-in account.
 * @returns The account menu.
 */
export function UserMenu({
  user,
  signOutHref = '/auth/logout',
  signOutLabel = 'Sign out',
  menuLabel = 'Account',
}: UserMenuProps) {
  return (
    <Menu
      align="end"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label={`${menuLabel}: ${user}`}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm',
            'hover:border-primary hover:text-foreground',
            props['aria-expanded'] ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {user}
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </button>
      )}
    >
      {/* A stated purpose belongs to the person who stated it: the next one to
          sign in to this tab must not inherit it. */}
      <MenuItem href={signOutHref} onSelect={clearAllPurposes}>
        {signOutLabel}
      </MenuItem>
    </Menu>
  )
}
