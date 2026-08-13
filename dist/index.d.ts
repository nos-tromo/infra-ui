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

export { AppHeader, type AppHeaderProps, AppShell, type AppShellProps, Badge, type BadgeProps, Banner, type BannerProps, Button, type ButtonProps, Card, type CardProps, ChevronDownIcon, ChevronUpIcon, ChevronsUpDownIcon, CopyButton, type CopyButtonProps, DeleteButton, DownloadButton, DownloadIcon, DownloadLink, type FileLike, FileList, type FileListLabels, type FileListProps, ForceGraph, type ForceGraphEdge, type ForceGraphEdgeStyle, type ForceGraphExpandAction, type ForceGraphHandle, type ForceGraphLabels, type ForceGraphNode, type ForceGraphNodeStyle, type ForceGraphProps, type GraphHtmlExportOptions, HoverIconAction, type HoverIconActionProps, IconButton, type IconButtonProps, IconLink, type IconLinkProps, type IconProps, Input, MoveDownButton, MoveUpButton, NewButton, PageHeader, type PageHeaderProps, PlusIcon, RemoveButton, SIDEBAR_STORAGE_KEY, Select, SidebarGroup, Spinner, type SpinnerProps, THEME_STORAGE_KEY, type ThemeMode, type ThemeToggleLabels, TrashIcon, UserMenu, type UserMenuProps, WarningIcon, XIcon, cn, downloadText, mergeFiles, toGraphHtml, toGraphJson, toGraphML, useTheme };
