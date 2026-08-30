import { ClassValue } from 'clsx';
import * as react from 'react';
import { ButtonHTMLAttributes, ReactNode, AnchorHTMLAttributes, SVGProps, HTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';

/** Merge conditional Tailwind classes, resolving utility conflicts (last wins). */
declare function cn(...inputs: ClassValue[]): string;

/**
 * The button recipe.
 *
 * Exported for the primitives that must render an `<a>` yet look exactly like a
 * `Button` — a server-streamed download is an anchor, not a button. Deliberately
 * *not* re-exported from the package index: consumers get `IconLink`, so a link
 * dressed as a button stays a decision this package makes once.
 */
declare const button: (props?: ({
    variant?: "primary" | "secondary" | "ghost" | "danger" | null | undefined;
    size?: "sm" | "md" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {
}
declare const Button: react.ForwardRefExoticComponent<ButtonProps & react.RefAttributes<HTMLButtonElement>>;

interface ToggleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, Pick<VariantProps<typeof button>, 'size'> {
    /** Whether the option is on. Controlled — the caller owns the flip. */
    pressed: boolean;
}
/**
 * A labelled option that is on or off, and says which by its colour.
 *
 * A checkbox spends its width on a box and puts the answer in a mark small
 * enough to hunt for; this fills with the app's accent instead, so a row of
 * options reads as a set of lit and unlit panels at a glance. The two states
 * are the `Button` recipe's `primary` and `secondary` variants, so a selected
 * toggle is pixel-identical to the form's submit button and the focus ring,
 * disabled treatment and colour transition all come from the same place.
 *
 * The state is a required prop and the component holds none of its own: what
 * is selected is the caller's data, not this button's business.
 *
 * The label must say what the option *is* — "Summary", not "Add summary" or
 * "Remove summary". `aria-pressed` is what carries on-ness to a screen reader,
 * and a name that swaps with the state would announce the change twice and
 * disagree with the colour. (That is the opposite of `DisclosureButton`, whose
 * label names the next click because a disclosure has no persistent identity.)
 *
 * @param props - Native `<button>` props, plus `pressed` and the `Button` size.
 * @returns A toggle button rendered as a real `<button>` with `aria-pressed`.
 */
declare const ToggleButton: react.ForwardRefExoticComponent<ToggleButtonProps & react.RefAttributes<HTMLButtonElement>>;

interface HoverIconActionProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label' | 'title'> {
    /** The glyph to render. Passed as a node so the design system stays icon-library-agnostic. */
    icon: ReactNode;
    /** Accessible name — drives both `aria-label` and `title`. Required (there is no text child). */
    label: string;
}
/**
 * A ghost, square icon button that stays visually quiet until needed: it is
 * `opacity-0` until an ancestor marked `.group` is hovered or focus-within, or
 * the button itself receives keyboard focus. The consumer owns the `.group`
 * marker and the button's positioning.
 */
declare const HoverIconAction: react.ForwardRefExoticComponent<HoverIconActionProps & react.RefAttributes<HTMLButtonElement>>;

/**
 * The always-visible icon action, and the base every named action is built on.
 *
 * `HoverIconAction` is the quiet sibling — it hides at `opacity-0` until its
 * row is hovered. This one is always on screen, so it is `ghost` by default:
 * transparent, taking a background only under the pointer. A permanent border
 * and fill would make a toolbar of these read as a row of loud chips beside the
 * quiet icons they sit with.
 *
 * `label` is required and drives both `aria-label` and `title`, because the
 * icon carries no text of its own. `children` is an optional short adornment
 * beside the icon — a format ("CSV"), a count, a caret — for the case where
 * several of these sit side by side and the icon alone cannot tell them apart.
 */
type IconActionShape = {
    /** The icon to render. A node, so this package stays icon-library-agnostic. */
    icon: ReactNode;
    /** Accessible name — drives both `aria-label` and `title`. Required. */
    label: string;
    /**
     * Tooltip text replacing `label`'s, when there is something extra to say —
     * most often *why* the action is unavailable. The accessible name stays
     * `label`, because a disabled control must still say what it is: swapping the
     * name for the reason leaves a button called "No jobs completed yet".
     */
    hint?: string;
    /** Optional short adornment beside the icon: a format, a count, a caret. */
    children?: ReactNode;
    /** Tint the icon on hover — for actions that take something away. */
    tone?: 'default' | 'danger';
};
interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'title'>, IconActionShape {
    /** Swaps the icon for a spinner and blocks further clicks while work is in flight. */
    busy?: boolean;
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
}
/**
 * An icon action the page performs itself.
 *
 * @param props - `icon` and `label` are required; `busy` swaps in a spinner.
 * @returns The button.
 */
declare const IconButton: react.ForwardRefExoticComponent<IconButtonProps & react.RefAttributes<HTMLButtonElement>>;
interface IconLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'aria-label' | 'title'>, IconActionShape {
    /** Where the link points. */
    href: string;
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
}
/**
 * An icon action the browser performs — a file the server streams is an anchor,
 * not a button, so it carries the same shell over an `<a>`.
 *
 * @param props - `icon`, `label` and `href` are required.
 * @returns The link, styled as the button it mirrors.
 */
declare const IconLink: react.ForwardRefExoticComponent<IconLinkProps & react.RefAttributes<HTMLAnchorElement>>;

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
type ActionButtonProps = Omit<IconButtonProps, 'icon' | 'tone'>;
type ActionLinkProps = Omit<IconLinkProps, 'icon' | 'tone'>;
/**
 * Save a file the page builds itself.
 *
 * @param props - `label` names the action; `children` may carry a format.
 * @returns The download button.
 */
declare const DownloadButton: react.ForwardRefExoticComponent<ActionButtonProps & react.RefAttributes<HTMLButtonElement>>;
/**
 * Save a file the server streams. Sets `download` so the browser saves the
 * response instead of navigating to it; pass `download="name.ext"` to name it.
 *
 * @param props - `label` names the action; `href` is the streaming endpoint.
 * @returns The download link.
 */
declare const DownloadLink: react.ForwardRefExoticComponent<ActionLinkProps & react.RefAttributes<HTMLAnchorElement>>;
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
declare const NewButton: react.ForwardRefExoticComponent<ActionButtonProps & react.RefAttributes<HTMLButtonElement>>;
/**
 * Take something out of a list, a selection, or a view.
 *
 * @param props - `label` names what is being removed.
 * @returns The remove button.
 */
declare const RemoveButton: react.ForwardRefExoticComponent<ActionButtonProps & react.RefAttributes<HTMLButtonElement>>;
/**
 * Destroy stored data.
 *
 * @param props - `label` names what is being deleted.
 * @returns The delete button.
 */
declare const DeleteButton: react.ForwardRefExoticComponent<ActionButtonProps & react.RefAttributes<HTMLButtonElement>>;
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
declare const MoveUpButton: react.ForwardRefExoticComponent<ActionButtonProps & react.RefAttributes<HTMLButtonElement>>;
/**
 * Move an item one place toward the bottom of a list.
 *
 * @param props - `label` names what moves.
 * @returns The move-down button.
 */
declare const MoveDownButton: react.ForwardRefExoticComponent<ActionButtonProps & react.RefAttributes<HTMLButtonElement>>;
/**
 * Send what has been composed — a chat message, a prompt.
 *
 * The one action here that is usually a page's *primary* control rather than
 * quiet chrome, so it is the common case for passing `variant="primary"`. Pass
 * `type="submit"` when it closes a form: `IconButton` writes `type="button"`
 * before spreading the caller's props, so this overrides it.
 *
 * @param props - `label` names the action; `busy` covers the send in flight.
 * @returns The send button.
 */
declare const SendButton: react.ForwardRefExoticComponent<ActionButtonProps & react.RefAttributes<HTMLButtonElement>>;
/**
 * Run the search the neighbouring field describes.
 *
 * @param props - `label` names the action; pass `type="submit"` inside a form.
 * @returns The search button.
 */
declare const SearchButton: react.ForwardRefExoticComponent<ActionButtonProps & react.RefAttributes<HTMLButtonElement>>;
/**
 * Rebuild what is already on screen.
 *
 * Reserve it for a *re*build — something is displayed and this replaces it.
 * A view with nothing in it yet wants a labelled create button instead, which
 * can say what it will make; a bare pair of arrows over an empty panel cannot.
 *
 * @param props - `label` names what gets rebuilt; `busy` covers the rebuild.
 * @returns The refresh button.
 */
declare const RefreshButton: react.ForwardRefExoticComponent<ActionButtonProps & react.RefAttributes<HTMLButtonElement>>;
/**
 * Open or start playback of a recording.
 *
 * The action beside a transcript, a job, or a row that has audio or video
 * behind it. It says "play this", not "play/pause" — a transport control that
 * flips between two drawings is a different component, and this one keeps its
 * triangle whatever the player is doing.
 *
 * @param props - `label` names what plays.
 * @returns The play button.
 */
declare const PlayButton: react.ForwardRefExoticComponent<ActionButtonProps & react.RefAttributes<HTMLButtonElement>>;
interface DisclosureButtonProps extends ActionButtonProps {
    /** Whether the section this controls is open. Drives the rotation and `aria-expanded`. */
    expanded: boolean;
    /** `id` of the element this reveals, wired to `aria-controls`. */
    controls?: string;
}
/**
 * Show or hide the section this sits on.
 *
 * One chevron rotated, never a pair: `aria-expanded` carries the state, and
 * swapping the drawing for an up-chevron would say the button *moves* the
 * thing — that is {@link MoveUpButton}'s meaning, a step within a list. The
 * caret points down when closed and turns over when open, so the rotation
 * animates rather than the icon changing under the pointer.
 *
 * `label` is the whole affordance and swaps with the state — pass the "show"
 * wording while closed and the "hide" wording while open, so the accessible
 * name and the tooltip both say what the next click does.
 *
 * @param props - `expanded` is required; `controls` names the revealed element.
 * @returns The disclosure button.
 */
declare const DisclosureButton: react.ForwardRefExoticComponent<DisclosureButtonProps & react.RefAttributes<HTMLButtonElement>>;

type IconProps = SVGProps<SVGSVGElement>;
/**
 * Save a file to the machine.
 *
 * Deliberately the conventional arrow-into-a-tray and nothing cleverer: this is
 * the icon that has to be understood without a label, on first sight, by
 * someone who has never opened the app before.
 */
declare const DownloadIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * Bring one more into being: a chat, a report, a row.
 *
 * The same two strokes {@link XIcon} draws on the diagonal, which is why the
 * angle has to stay square — tilted, an invitation to add reads as an offer to
 * take away.
 */
declare const PlusIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/** Take this out of the list, the selection, or the view. Nothing is destroyed. */
declare const XIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/** Destroy stored data. Reserved for what does not come back. */
declare const TrashIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/** Disclosure caret. Rotate it with a class rather than swapping the icon. */
declare const ChevronDownIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/** The up caret — a sort ascending, or a move toward the top of a list. */
declare const ChevronUpIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * Sortable, but not currently sorted.
 *
 * Both directions at once, so a column header can advertise that it *can* sort
 * without claiming a direction it does not have.
 */
declare const ChevronsUpDownIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/** Something needs attention but nothing has failed outright. */
declare const WarningIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * Context, offered rather than demanded.
 *
 * Deliberately {@link WarningIcon}'s stack inverted — dot above, bar below — so
 * the two read as one family and differ only where it matters: the triangle
 * interrupts, the circle does not.
 */
declare const InfoIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * It worked, it passed, it is already in.
 *
 * The pass half of a pair whose fail half is {@link XIcon} — the two get read
 * side by side as one status vocabulary, so they must keep the same stroke
 * weight and optical size or a run's outcome starts depending on which marker
 * it drew.
 */
declare const CheckIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * This link leaves — a new tab, or the app entirely.
 *
 * The arrow escaping the frame is the whole message, so it belongs beside the
 * label rather than replacing it: unlike a row action, a link that opens
 * elsewhere still needs to say *where* it goes.
 */
declare const ExternalLinkIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * Time *taken*, not time of day.
 *
 * A dial with a crown, deliberately not a clock face: this marks a duration —
 * how long a run has been going, or how long it took — and a clock beside a
 * counter reads as a timestamp instead.
 */
declare const StopwatchIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * A report — a page of written findings.
 *
 * Drawn as a sheet with a folded corner and two lines of text, because a report
 * in these apps is a *document being assembled*, not a chart or a clipboard: the
 * lines say it holds prose someone wrote, and the fold says it is one page of
 * it. It is the only page in the set, so nothing else in a row can be mistaken
 * for it.
 */
declare const ReportIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * The same report, with this artifact already in it.
 *
 * The pair exists because "add to report" is a *toggle* that carries no text:
 * one drawing pressed and unpressed would leave its two states to be told apart
 * by a background tint alone. So the page stays exactly where it is and only
 * its contents change — the lines become a tick — which reads as the sheet
 * being filled rather than swapped for a different icon.
 *
 * The tick is part of a composite drawing, sized to sit inside the page;
 * {@link CheckIcon} remains the system's one standalone checkmark.
 */
declare const ReportCheckIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * Send the message that has been typed.
 *
 * The paper plane every chat composer uses — a triangle with the fold line
 * that turns it from an arrowhead into a sheet in flight. Drawn rather than
 * borrowed from an arrow because the two say different things: an arrow points
 * somewhere, this one leaves.
 */
declare const SendIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * Search whatever the surrounding field takes as its query.
 *
 * A magnifier, and deliberately nothing cleverer: like {@link DownloadIcon} it
 * has to be understood on first sight, without a label, by someone who has
 * never opened the app.
 */
declare const SearchIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * Rebuild something already on screen.
 *
 * **Two** arcs chasing each other, each with its own arrowhead — not one
 * circular arrow. A single arrow curving back on itself is the undo/revert
 * drawing; the closed pair is what reads as *again*. The gaps between them are
 * what leaves room for the heads, so an arc that swept the full circle would
 * cost the icon its meaning rather than tidy it.
 */
declare const RefreshIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * Back to where this page was reached from.
 *
 * A full arrow rather than a chevron: a chevron is a disclosure or a step
 * within a list, and this leaves the page. It sits beside its label — a link
 * that goes back still has to say what it goes back to.
 */
declare const ArrowLeftIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * Reasoning mode, off.
 *
 * A brain in outline: two lobes meeting at a fissure. It is the glyph chat
 * products have converged on for "let the model think before answering", so it
 * is read without a label — which a label-less toggle needs. Drawn as two
 * mirrored lobes rather than a single blob because the fissure is what stops a
 * rounded outline from reading as a cloud or a thought bubble.
 */
declare const BrainIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * The same brain, with reasoning switched on.
 *
 * The second *state* pair in the set, after {@link ReportIcon} /
 * {@link ReportCheckIcon}, and for the same reason: "reasoning on/off" is a
 * toggle that carries no text, so one drawing pressed and unpressed would leave
 * its two states to a background tint alone. The outline stays exactly where it
 * is and a spark appears inside it — the head lighting up, not a different
 * icon. The idle drawing's fissure gives way to the spark so the two do not
 * fight over the same few pixels.
 */
declare const BrainActiveIcon: ({ className, ...props }: IconProps) => react.JSX.Element;
/**
 * Start or open playback of a recording.
 *
 * A right-pointing triangle, closed with `z` — the one drawing every media
 * surface has agreed on, so it needs no label to be understood. Drawn as a
 * path on the shared stroke like the rest of the set, never the `▶` character,
 * which arrives in whatever font the machine falls back to and carries emoji
 * presentation on some platforms.
 *
 * It is deliberately not a chevron — that is disclosure or a step within a
 * list, see {@link ChevronDownIcon} — and not {@link SendIcon}'s plane, which
 * is the other closed triangle-ish shape in the set and can sit a few pixels
 * away in the same toolbar.
 */
declare const PlayIcon: ({ className, ...props }: IconProps) => react.JSX.Element;

interface CopyButtonProps extends Omit<ButtonProps, 'children' | 'onClick' | 'aria-label' | 'title'> {
    /** Text written to the clipboard on click. */
    text: string;
    /** Accessible label in the idle state. */
    label?: string;
    /** Accessible label shown briefly after a successful copy. */
    copiedLabel?: string;
    /** How long the copied state persists before reverting, in milliseconds. */
    resetDelayMs?: number;
}
/**
 * Icon-only button that copies `text` to the clipboard and briefly swaps to a
 * check glyph for confirmation. The visible affordance is an icon; the label is
 * exposed to assistive tech via `aria-label`/`title`.
 */
declare const CopyButton: react.ForwardRefExoticComponent<CopyButtonProps & react.RefAttributes<HTMLButtonElement>>;

interface FileLike {
    name: string;
    size?: number;
    /** Path within a dropped/picked directory (browsers set this on `File`);
     *  identity falls back to `name` when absent. */
    webkitRelativePath?: string;
}
/**
 * Append `incoming` to `existing`, skipping any file already present and
 * preserving the existing order. Use in a file-input "add" handler so
 * re-selecting the same file never produces duplicate rows.
 *
 * Identity is `webkitRelativePath || name` plus `size`: folder uploads carry a
 * path, so two genuinely different files that share a name and byte length in
 * different subfolders stay distinct instead of one silently vanishing.
 */
declare function mergeFiles<T extends FileLike>(existing: T[], incoming: T[]): T[];
interface FileListLabels {
    /** Summary count text. Default: `n => `${n} file${n === 1 ? '' : 's'}``. */
    files?: (count: number) => string;
    /** Header "Clear all" action label. Default: `'Clear all'`. */
    clearAll?: string;
    /** Remove verb; used as the row aria-label `${remove} ${name}`. Default: `'Remove'`. */
    remove?: string;
}
interface FileListProps {
    /** Files to display. A `File[]` satisfies `FileLike[]` and may be passed directly. */
    files: FileLike[];
    /** Per-row remove handler. Omit to render read-only rows (no remove control). */
    onRemove?: (index: number) => void;
    /** Header "Clear all" handler. Omit to hide the action. */
    onClear?: () => void;
    /** Localized label overrides; English defaults are used when absent. */
    labels?: FileListLabels;
    /** Extra classes merged onto the outer panel. */
    className?: string;
}
/**
 * A self-contained panel that displays a list of selected files: a pinned
 * summary header (count + total size + optional "Clear all") over a
 * height-capped, internally-scrolling body of numbered rows. Each row shows an
 * index, the (truncated) filename, its humanized size, and — when `onRemove`
 * is provided — a hover/focus-revealed remove control.
 *
 * Renders nothing when `files` is empty, so callers need no length guard.
 * Stable row keys assume `files` is deduped by name+size (see `mergeFiles`).
 */
declare function FileList({ files, onRemove, onClear, labels, className }: FileListProps): react.JSX.Element | null;
declare namespace FileList {
    var displayName: string;
}

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Optional tile heading, rendered accent-colored above the body. */
    title?: ReactNode;
    /** Interactive tiles signal affordance with a hover-accent border. */
    interactive?: boolean;
}
declare const Card: react.ForwardRefExoticComponent<CardProps & react.RefAttributes<HTMLDivElement>>;

declare const Input: react.ForwardRefExoticComponent<InputHTMLAttributes<HTMLInputElement> & react.RefAttributes<HTMLInputElement>>;

declare const Select: react.ForwardRefExoticComponent<SelectHTMLAttributes<HTMLSelectElement> & react.RefAttributes<HTMLSelectElement>>;

interface SelectMenuOption {
    /** Handed back to `onChange`. Unique within `options`. */
    value: string;
    /**
     * The only text the user reads — on the closed trigger and on the row.
     *
     * Deliberately one string rather than a label plus a hint slot: a second slot
     * needs its own alignment, truncation and reading order, and the counts and
     * owners callers want there are part of what the operator reads as the *name*
     * of the thing. Compose it: `` `${title} (${count})` ``.
     */
    label: string;
    /** Rendered and announced, but not choosable. The arrows step over it. */
    disabled?: boolean;
}
interface SelectMenuProps {
    /** The list to choose from. Empty renders {@link SelectMenuProps.emptyLabel}. */
    options: SelectMenuOption[];
    /** The chosen `value`, or `null` for "nothing chosen yet". */
    value: string | null;
    /**
     * Called with the chosen `value` — never the label, and never `null`. There
     * is no un-choosing: a placeholder is a state you leave, not one you return
     * to, matching a native `<select>` whose placeholder option is disabled.
     */
    onChange: (value: string) => void;
    /**
     * Accessible name for the trigger and the list. Required: the trigger's
     * visible text is a data value, so it cannot serve as a stable name.
     */
    label: string;
    /** Trigger text while `value` matches nothing. */
    placeholder?: string;
    /** Trigger text while `options` is empty. Falls back to `placeholder`. */
    emptyLabel?: string;
    /** Which edge the panel hangs from. `'start'` = left, `'end'` = right. */
    align?: 'start' | 'end';
    /** Classes for the positioning wrapper — width and margins. Never `text-*`. */
    className?: string;
    /** Classes for the trigger. This is where a `text-2xl font-semibold` goes. */
    triggerClassName?: string;
    /** Blocks the control entirely — distinct from having nothing to offer. */
    disabled?: boolean;
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
declare function SelectMenu({ options, value, onChange, label, placeholder, emptyLabel, align, className, triggerClassName, disabled, }: SelectMenuProps): react.JSX.Element;
declare namespace SelectMenu {
    var displayName: string;
}

declare const badge: (props?: ({
    variant?: "danger" | "neutral" | "accent" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badge> {
}
declare function Badge({ className, variant, ...props }: BadgeProps): react.JSX.Element;

interface SpinnerProps {
    className?: string;
    label?: string;
}
declare function Spinner({ className, label }: SpinnerProps): react.JSX.Element;

/**
 * The states a queued unit of work can be in.
 *
 * Deliberately five and no more: apps name their statuses differently
 * (`queued`/`pending`, `completed`/`complete`/`done`), so callers map their own
 * union onto this one and the drawing stays the same across the federation.
 */
type StatusIconStatus = 'idle' | 'running' | 'done' | 'failed' | 'cancelled';
interface StatusIconProps {
    /** Which state to draw. */
    status: StatusIconStatus;
    /**
     * Accessible name and tooltip — the caller's own translated wording
     * ("Queued", "Läuft", "Abgeschlossen"). Required: the marker carries no text,
     * so this is the only thing a screen reader or a hovering pointer gets.
     */
    label: string;
    /** Sizing and colour overrides, applied last. */
    className?: string;
}
/**
 * The state of one job, task or upload, drawn rather than spelled out.
 *
 * A row of these is read down a list at a glance, which a column of words is
 * not — and the words are the part that changes length per language, pushing
 * the controls beside them around. The label is not lost: it becomes the
 * accessible name and the tooltip, so the wording still reaches a screen reader
 * and a hovering pointer.
 *
 * The vocabulary is the set's existing status pair plus the stopwatch —
 * `CheckIcon` and `XIcon` are already read as pass/fail, and `StopwatchIcon`
 * already means time taken, so nothing new is invented here. `failed` and
 * `cancelled` share the cross and differ by tint: one is an error the user
 * should look at, the other is a thing they themselves stopped.
 *
 * `running` is the `Spinner`, not an icon — motion is what says "still going",
 * and a static drawing for it would be indistinguishable from `idle` at a
 * glance. It keeps the spinner's own `role="status"`, so assistive tech
 * announces it as live rather than as an image.
 *
 * @param props - `status` picks the drawing; `label` names it.
 * @returns The status marker.
 */
declare function StatusIcon({ status, label, className }: StatusIconProps): react.JSX.Element;

declare const banner: (props?: ({
    variant?: "danger" | "info" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface BannerProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof banner> {
}
declare function Banner({ className, variant, ...props }: BannerProps): react.JSX.Element;

interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
    /** Route title — exactly one PageHeader (one h1) per route. */
    title: string;
    /** One-line muted subtitle under the title. */
    caption?: string;
    /** Right-aligned controls on the title row (e.g. a primary Button). */
    actions?: ReactNode;
}
declare function PageHeader({ title, caption, actions, className, ...props }: PageHeaderProps): react.JSX.Element;

interface AppHeaderProps extends HTMLAttributes<HTMLElement> {
    /** App display name, rendered next to the home link. */
    title: string;
    /** Signed-in user; block is omitted entirely when absent (e.g. standalone dev). */
    user?: string;
    /** App version, rendered muted next to the title; omitted entirely when absent. */
    version?: string;
    /** Portal URL; the gateway serves the portal at the origin root. */
    homeHref?: string;
    /** i18n hook for the home link text. */
    homeLabel?: string;
    /** i18n hook for the toggle's accessible names, keyed by mode. */
    themeLabels?: {
        system: string;
        light: string;
        dark: string;
    };
}
declare function AppHeader({ title, user, version, homeHref, homeLabel, themeLabels, className, ...props }: AppHeaderProps): react.JSX.Element;

interface ThemeToggleLabels {
    system: string;
    light: string;
    dark: string;
}

interface UserMenuProps {
    /** Signed-in user name (from the trusted X-Auth-User header). */
    user: string;
    /** Gateway logout endpoint. */
    signOutHref?: string;
    /** i18n hooks. */
    signOutLabel?: string;
    menuLabel?: string;
}
declare function UserMenu({ user, signOutHref, signOutLabel, menuLabel, }: UserMenuProps): react.JSX.Element;

declare const SIDEBAR_STORAGE_KEY = "infra-ui-sidebar";
interface AppShellProps {
    /** App display name in the chrome header. */
    title: string;
    version?: string;
    /** Signed-in user; UserMenu is omitted entirely when absent. */
    user?: string;
    homeHref?: string;
    homeLabel?: string;
    themeLabels?: ThemeToggleLabels;
    signOutHref?: string;
    signOutLabel?: string;
    /** Sidebar content; omit for header-only apps (Nextext, translator). */
    sidebar?: ReactNode;
    sidebarToggleLabel?: string;
    children: ReactNode;
}
declare function AppShell({ title, version, user, homeHref, homeLabel, themeLabels, signOutHref, signOutLabel, sidebar, sidebarToggleLabel, children, }: AppShellProps): react.JSX.Element;
declare function SidebarGroup({ label, children }: {
    label?: string;
    children: ReactNode;
}): react.JSX.Element;

interface ForceGraphNode {
    id: string;
    label: string;
    /** Style-map key; also shown in the legend. */
    kind: string;
    /** Relative size weight (≥1); mapped to radius by sqrt scale. */
    size?: number;
}
interface ForceGraphEdge {
    source: string;
    target: string;
    kind: string;
    /** Draw an arrowhead source → target. */
    directed?: boolean;
    /** Stroke-width weight (≥1). */
    weight?: number;
}
interface ForceGraphNodeStyle {
    /** SVG fill for the node circle (hex/rgb — consumer-supplied palette). */
    color: string;
    /** SVG fill for the node label text; defaults to `color`. Pick a lighter
     *  variant when `color` is too dark to read as text. */
    labelColor?: string;
}
interface ForceGraphEdgeStyle {
    dashed?: boolean;
    /** 0–1 stroke opacity when not dimmed (default 0.6). */
    opacity?: number;
}
interface ForceGraphExpandAction {
    id: string;
    label: string;
}
interface ForceGraphHandle {
    /** Live layout snapshot (id → x/y) of every currently-visible node, e.g. for baking a layout into an export. */
    getPositions(): Record<string, {
        x: number;
        y: number;
    }>;
}
interface ForceGraphLabels {
    minEdges: string;
    edgeLength: string;
    zoom: string;
    reset: string;
    fit: string;
    expandSelected: string;
    removeSelected: string;
    /** Rendered when >1 node is selected; the literal `{n}` is replaced with the count. */
    removeSelectedMany: string;
    maximize: string;
    minimize: string;
}
interface ForceGraphProps {
    nodes: ForceGraphNode[];
    edges: ForceGraphEdge[];
    nodeStyles: Record<string, ForceGraphNodeStyle>;
    edgeStyles?: Record<string, ForceGraphEdgeStyle>;
    /** Controlled selection set. */
    selectedIds?: string[];
    /** Called with the full new selection set on every selection mutation:
     *  click ([id]), shift+click toggle, marquee (union with previous), or
     *  background click ([]). */
    onSelectionChange?: (ids: string[]) => void;
    /** When set and exactly one node is selected, shows an Expand button and
     *  double-click expands. Superseded by `expandActions` when that prop is
     *  also supplied with `onExpandAction` (see below) — `expandActions` wins. */
    onExpandNode?: (id: string) => void;
    /** Node id currently being expanded (renders its Expand button, or all
     *  action chips, disabled). */
    expandingId?: string | null;
    /** Multiple named expand choices for the single selected node. When
     *  non-empty AND `onExpandAction` is set AND exactly one node is selected,
     *  renders one chip per action instead of the single `onExpandNode` Expand
     *  button — `onExpandNode`'s button is not rendered even if also supplied.
     *  Double-click also fires the FIRST action instead of `onExpandNode`. */
    expandActions?: ForceGraphExpandAction[];
    /** Fired when an expand-action chip is clicked, or on double-click (with
     *  the first action) when `expandActions` is active: `(actionId, nodeId)`. */
    onExpandAction?: (actionId: string, nodeId: string) => void;
    /** When set, selection shows a Remove button and Backspace/Delete removes
     *  the whole selected set (ignored while focus is in a text input). */
    onDeleteNodes?: (ids: string[]) => void;
    /** Status line above the canvas; consumer formats counts + hints. */
    statusText?: string;
    /** Legend entries; omit to hide the legend. */
    legend?: Array<{
        kind: string;
        label: string;
    }>;
    /** Control captions — consumer passes translated strings; en defaults built in. */
    labels?: Partial<ForceGraphLabels>;
    /** Canvas height class when not maximized (default 'h-[60vh]'). */
    heightClassName?: string;
    className?: string;
    /** Imperative access to the live layout, e.g. for exports. */
    apiRef?: React.Ref<ForceGraphHandle>;
}
/**
 * Interactive, force-directed graph primitive. Nodes are draggable (with
 * collision), the canvas zooms (wheel) and pans (background drag), a click
 * replaces the selection with a single node, shift+click toggles a node
 * in/out of a multi-node selection, shift+drag on the background marquee-
 * selects every node inside the drawn rectangle, a double-click (or the
 * Expand button, shown only for a single selected node) requests expansion,
 * and layouts merge incrementally — nodes already on screen keep their
 * position when the data set grows, instead of the whole graph re-seeding.
 * Rendering is plain SVG over the dependency-free {@link createForceSimulation}
 * layout.
 *
 * `nodes`/`edges` feed the simulation-building `useMemo` directly, so callers
 * must pass referentially stable arrays per logical data change (memoize the
 * mapper output on the API payload) — a fresh array identity every render
 * rebuilds and reseeds the simulation on every frame.
 */
declare function ForceGraph({ nodes, edges, nodeStyles, edgeStyles, selectedIds, onSelectionChange, onExpandNode, expandingId, expandActions, onExpandAction, onDeleteNodes, statusText, legend, labels, heightClassName, className, apiRef }: ForceGraphProps): react.JSX.Element;

/**
 * Client-side export of a `ForceGraph`-shaped graph — JSON, GraphML, and a
 * self-contained interactive HTML snapshot.
 *
 * Pure, no React, no network calls. Feed these directly with the
 * `{nodes, edges}` shape `ForceGraph` consumes — id/label/kind (nodes) and
 * source/target/kind/weight/directed (edges) — so this module needs no
 * per-app knowledge of node/edge shape.
 */

/**
 * Pretty-printed (2-space) JSON passthrough of `{nodes, edges}`.
 */
declare function toGraphJson(nodes: ForceGraphNode[], edges: ForceGraphEdge[]): string;
/**
 * Serialize a `{nodes, edges}` graph as GraphML (Gephi/yEd-compatible).
 *
 * Declares `<key>` attrs for node `label`/`kind` (string) and edge `kind`
 * (string) / `weight` (double). `edgedefault` is `"undirected"`; individual
 * edges carry `directed="true"` when the source edge does. All attribute
 * and text values are XML-escaped since labels are user-derived data.
 */
declare function toGraphML(nodes: ForceGraphNode[], edges: ForceGraphEdge[]): string;
interface Point {
    x: number;
    y: number;
}
interface GraphHtmlExportOptions {
    title: string;
    nodes: ForceGraphNode[];
    edges: ForceGraphEdge[];
    positions: Record<string, Point>;
    nodeStyles: Record<string, {
        color: string;
    }>;
    edgeStyles?: Record<string, {
        dashed?: boolean;
        opacity?: number;
    }>;
    legend?: {
        kind: string;
        label: string;
    }[];
}
/**
 * Render a single self-contained, "interactive-lite" HTML document: a dark
 * page embedding an inline SVG snapshot of the graph with the layout baked
 * from `positions`, plus a small vanilla-JS pan/zoom script.
 *
 * No external requests of any kind — everything (CSS, JS, graph data) is
 * inlined. No physics, no fetch, no node expansion: this is a static export
 * of what the user was already looking at, not a live client.
 */
declare function toGraphHtml(opts: GraphHtmlExportOptions): string;
/**
 * Trigger a client-side download of `text` as `filename` via a transient
 * Blob object URL — no backend round-trip.
 *
 * Defers URL.revokeObjectURL() via setTimeout(..., 0) to ensure the download
 * dispatch completes before the URL is revoked (older browsers may drop the
 * download if the URL is revoked too eagerly).
 */
declare function downloadText(filename: string, text: string, mimeType: string): void;

declare const THEME_STORAGE_KEY = "infra-ui-theme";
type ThemeMode = 'light' | 'dark' | 'system';
/**
 * Owns the federation theme contract: localStorage `infra-ui-theme`
 * ('light' | 'dark'; absent = follow the OS), mirrored to `data-theme`
 * on <html>. Nothing else may touch the key or the attribute.
 *
 * Uses a shared module-level store so all instances within a tab sync immediately.
 */
declare function useTheme(): {
    mode: ThemeMode;
    resolved: "light" | "dark";
    cycle: () => void;
};

export { AppHeader, type AppHeaderProps, AppShell, type AppShellProps, ArrowLeftIcon, Badge, type BadgeProps, Banner, type BannerProps, BrainActiveIcon, BrainIcon, Button, type ButtonProps, Card, type CardProps, CheckIcon, ChevronDownIcon, ChevronUpIcon, ChevronsUpDownIcon, CopyButton, type CopyButtonProps, DeleteButton, DisclosureButton, type DisclosureButtonProps, DownloadButton, DownloadIcon, DownloadLink, ExternalLinkIcon, type FileLike, FileList, type FileListLabels, type FileListProps, ForceGraph, type ForceGraphEdge, type ForceGraphEdgeStyle, type ForceGraphExpandAction, type ForceGraphHandle, type ForceGraphLabels, type ForceGraphNode, type ForceGraphNodeStyle, type ForceGraphProps, type GraphHtmlExportOptions, HoverIconAction, type HoverIconActionProps, IconButton, type IconButtonProps, IconLink, type IconLinkProps, type IconProps, InfoIcon, Input, MoveDownButton, MoveUpButton, NewButton, PageHeader, type PageHeaderProps, PlayButton, PlayIcon, PlusIcon, RefreshButton, RefreshIcon, RemoveButton, ReportCheckIcon, ReportIcon, SIDEBAR_STORAGE_KEY, SearchButton, SearchIcon, Select, SelectMenu, type SelectMenuOption, type SelectMenuProps, SendButton, SendIcon, SidebarGroup, Spinner, type SpinnerProps, StatusIcon, type StatusIconProps, type StatusIconStatus, StopwatchIcon, THEME_STORAGE_KEY, type ThemeMode, type ThemeToggleLabels, ToggleButton, type ToggleButtonProps, TrashIcon, UserMenu, type UserMenuProps, WarningIcon, XIcon, cn, downloadText, mergeFiles, toGraphHtml, toGraphJson, toGraphML, useTheme };
