import { ClassValue } from 'clsx';
import * as react from 'react';
import { ButtonHTMLAttributes, ReactNode, HTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';

/** Merge conditional Tailwind classes, resolving utility conflicts (last wins). */
declare function cn(...inputs: ClassValue[]): string;

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
}
/**
 * Append `incoming` to `existing`, skipping any file already present (matched
 * by `name` + `size`) and preserving the existing order. Use in a file-input
 * "add" handler so re-selecting the same file never produces duplicate rows.
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

declare const Card: react.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & react.RefAttributes<HTMLDivElement>>;

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

interface ShellProps {
    /** Heading rendered on the left of the sticky header. */
    title: ReactNode;
    /** Optional right-aligned slot (e.g. a status bar or action buttons). */
    actions?: ReactNode;
    /** Page body rendered inside the centered main container. */
    children?: ReactNode;
    /** Extra classes merged onto the full-height root wrapper. */
    className?: string;
}
/**
 * App shell: a full-height wrapper with a sticky top header (title + optional
 * actions slot) above a centered main content column. The header stays pinned
 * to the top and keeps an opaque `bg-background` so it remains visible — and
 * does not let content bleed through — while the page scrolls.
 */
declare function Shell({ title, actions, children, className }: ShellProps): react.JSX.Element;

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

export { Badge, type BadgeProps, Banner, type BannerProps, Button, type ButtonProps, Card, CopyButton, type CopyButtonProps, type FileLike, FileList, type FileListLabels, type FileListProps, ForceGraph, type ForceGraphEdge, type ForceGraphEdgeStyle, type ForceGraphExpandAction, type ForceGraphHandle, type ForceGraphLabels, type ForceGraphNode, type ForceGraphNodeStyle, type ForceGraphProps, type GraphHtmlExportOptions, HoverIconAction, type HoverIconActionProps, Input, Select, Shell, type ShellProps, Spinner, type SpinnerProps, cn, downloadText, mergeFiles, toGraphHtml, toGraphJson, toGraphML };
