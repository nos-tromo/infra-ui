/**
 * The panel and the rows `Menu` and `SelectMenu` share.
 *
 * The two are one control repeated, an action list and a value list, so they
 * draw from one place and cannot drift apart. The look is quiet: soft corners
 * on the panel and its rows, a little air around each row, and a shadow that
 * lifts the panel off the page rather than outlining it.
 *
 * `text-sm` is stated on the panel *and* on every row, never inherited: a
 * native `<select>`'s popup inheriting `text-2xl` from its trigger is the bug
 * `SelectMenu` replaced.
 *
 * A button in the panel that is not a row (a confirmation's Cancel and Delete)
 * is drawn as a pill, so it matches the panel's corners in every app without
 * each one remembering a class.
 */
export const MENU_PANEL =
  'rounded-2xl border border-border bg-muted p-1.5 text-sm shadow-xl outline-none [&_button:not([role=menuitem])]:rounded-full'

/** One row: an optional icon, then the text. The caller adds the highlight and the tone. */
export const MENU_ROW = 'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-foreground'

/** Where a row's icon sits: fixed size, never squeezed by a long label. */
export const MENU_ROW_ICON = 'flex h-4 w-4 shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4'
