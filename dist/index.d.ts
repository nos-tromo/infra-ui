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
    /** Relative size weight (≥1); mapped to radius by sqrt scale, like docint's mentions. */
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
}
interface ForceGraphEdgeStyle {
    dashed?: boolean;
    /** 0–1 stroke opacity when not dimmed (default 0.6). */
    opacity?: number;
}
interface ForceGraphLabels {
    minEdges: string;
    edgeLength: string;
    zoom: string;
    reset: string;
    expandSelected: string;
    maximize: string;
    minimize: string;
}
interface ForceGraphProps {
    nodes: ForceGraphNode[];
    edges: ForceGraphEdge[];
    nodeStyles: Record<string, ForceGraphNodeStyle>;
    edgeStyles?: Record<string, ForceGraphEdgeStyle>;
    selectedId?: string | null;
    onSelectNode?: (id: string) => void;
    /** When set, selection shows an Expand button and double-click expands. */
    onExpandNode?: (id: string) => void;
    /** Node id currently being expanded (renders its Expand button disabled). */
    expandingId?: string | null;
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
}
/**
 * Interactive, force-directed graph primitive. Nodes are draggable (with
 * collision), the canvas zooms (wheel) and pans (background drag), a click
 * selects a node, a double-click (or the Expand button) requests expansion,
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
declare function ForceGraph({ nodes, edges, nodeStyles, edgeStyles, selectedId, onSelectNode, onExpandNode, expandingId, statusText, legend, labels, heightClassName, className }: ForceGraphProps): react.JSX.Element;

export { Badge, type BadgeProps, Banner, type BannerProps, Button, type ButtonProps, Card, CopyButton, type CopyButtonProps, type FileLike, FileList, type FileListLabels, type FileListProps, ForceGraph, type ForceGraphEdge, type ForceGraphEdgeStyle, type ForceGraphLabels, type ForceGraphNode, type ForceGraphNodeStyle, type ForceGraphProps, HoverIconAction, type HoverIconActionProps, Input, Select, Shell, type ShellProps, Spinner, type SpinnerProps, cn, mergeFiles };
