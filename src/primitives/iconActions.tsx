import { forwardRef } from 'react'
import { ChevronDownIcon, ChevronUpIcon, DownloadIcon, PlusIcon, TrashIcon, XIcon } from '../icons'
import {
  IconButton,
  IconLink,
  type IconButtonProps,
  type IconLinkProps,
} from './IconButton'

/**
 * The named icon actions.
 *
 * Each is a thin binding of one icon to one meaning, so an app imports the
 * *action* rather than composing an icon with a button and arriving somewhere
 * slightly different in every repo. Adding another — print, refresh, share — is
 * an icon in `../icons` plus a wrapper the size of the ones below.
 *
 * The two removal actions are deliberately distinct, because the difference is
 * not decorative:
 *
 * - {@link RemoveButton} (`×`) takes something out of a list, a selection or a
 *   view. Nothing is destroyed and the user can put it back.
 * - {@link DeleteButton} (trash) destroys stored data. Reserve it for what does
 *   not come back, and pair it with a confirmation.
 *
 * Both tint `danger` on hover; the icon is what says how far the action goes.
 */

type ActionButtonProps = Omit<IconButtonProps, 'icon' | 'tone'>
type ActionLinkProps = Omit<IconLinkProps, 'icon' | 'tone'>

/**
 * Save a file the page builds itself.
 *
 * @param props - `label` names the action; `children` may carry a format.
 * @returns The download button.
 */
export const DownloadButton = forwardRef<HTMLButtonElement, ActionButtonProps>((props, ref) => (
  <IconButton ref={ref} icon={<DownloadIcon />} {...props} />
))
DownloadButton.displayName = 'DownloadButton'

/**
 * Save a file the server streams. Sets `download` so the browser saves the
 * response instead of navigating to it; pass `download="name.ext"` to name it.
 *
 * @param props - `label` names the action; `href` is the streaming endpoint.
 * @returns The download link.
 */
export const DownloadLink = forwardRef<HTMLAnchorElement, ActionLinkProps>((props, ref) => (
  <IconLink ref={ref} icon={<DownloadIcon />} download {...props} />
))
DownloadLink.displayName = 'DownloadLink'

/**
 * Create a new one of whatever the surrounding list holds.
 *
 * One action rather than an "add" and a "new" split the way the two removals
 * are: those are distinct because their drawings are, and a plus asked to mean
 * two things would look the same either way. It carries no `danger` tint —
 * nothing is being taken away.
 *
 * @param props - `label` names what gets created.
 * @returns The new button.
 */
export const NewButton = forwardRef<HTMLButtonElement, ActionButtonProps>((props, ref) => (
  <IconButton ref={ref} icon={<PlusIcon />} {...props} />
))
NewButton.displayName = 'NewButton'

/**
 * Take something out of a list, a selection, or a view.
 *
 * @param props - `label` names what is being removed.
 * @returns The remove button.
 */
export const RemoveButton = forwardRef<HTMLButtonElement, ActionButtonProps>((props, ref) => (
  <IconButton ref={ref} icon={<XIcon />} tone="danger" {...props} />
))
RemoveButton.displayName = 'RemoveButton'

/**
 * Destroy stored data.
 *
 * @param props - `label` names what is being deleted.
 * @returns The delete button.
 */
export const DeleteButton = forwardRef<HTMLButtonElement, ActionButtonProps>((props, ref) => (
  <IconButton ref={ref} icon={<TrashIcon />} tone="danger" {...props} />
))
DeleteButton.displayName = 'DeleteButton'

/**
 * Move an item one place toward the top of a list.
 *
 * Chevrons rather than full arrows: the pair is the conventional reorder
 * affordance, and it reads as a step within a list rather than navigation away
 * from it. Disable it at the end of the run instead of hiding it, so the row's
 * controls do not shift under the pointer.
 *
 * @param props - `label` names what moves.
 * @returns The move-up button.
 */
export const MoveUpButton = forwardRef<HTMLButtonElement, ActionButtonProps>((props, ref) => (
  <IconButton ref={ref} icon={<ChevronUpIcon />} {...props} />
))
MoveUpButton.displayName = 'MoveUpButton'

/**
 * Move an item one place toward the bottom of a list.
 *
 * @param props - `label` names what moves.
 * @returns The move-down button.
 */
export const MoveDownButton = forwardRef<HTMLButtonElement, ActionButtonProps>((props, ref) => (
  <IconButton ref={ref} icon={<ChevronDownIcon />} {...props} />
))
MoveDownButton.displayName = 'MoveDownButton'
