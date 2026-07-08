import { ClassValue } from 'clsx';
import * as react from 'react';
import { ButtonHTMLAttributes, ReactNode, HTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';

/** Merge conditional Tailwind classes, resolving utility conflicts (last wins). */
declare function cn(...inputs: ClassValue[]): string;

/**
 * Append `incoming` files to `existing`, dropping any incoming file that
 * duplicates one already present (including duplicates within `incoming`
 * itself). Two files are treated as the same when both their `name` and
 * `size` match — enough to dedup a re-selected file without reading its
 * contents. Order is stable: existing files keep their positions and new,
 * non-duplicate files are appended in selection order.
 *
 * @param existing - Files already selected.
 * @param incoming - Newly selected files to merge in.
 * @returns A new array; the input arrays are not mutated.
 */
declare function mergeFiles(existing: File[], incoming: File[]): File[];

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

interface FileListProps extends HTMLAttributes<HTMLDivElement> {
    /** The selected files to display, in order. */
    files: File[];
    /**
     * Called with a file's index to remove it. Omit to hide the per-row remove
     * controls (e.g. while an upload is in flight).
     */
    onRemove?: (index: number) => void;
    /** Called to clear every file. Omit to hide the "Clear all" control. */
    onClear?: () => void;
}
/**
 * Render a selected-files panel: a count header with an optional "Clear all"
 * action, and one row per file showing its name, size, and an optional remove
 * control. Renders nothing when `files` is empty.
 *
 * Each control appears only when its handler is supplied, so a disabled or
 * pending caller can pass `undefined` to hide the remove/clear affordances
 * without changing the layout otherwise.
 */
declare function FileList({ files, onRemove, onClear, className, ...props }: FileListProps): react.JSX.Element | null;

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

export { Badge, type BadgeProps, Banner, type BannerProps, Button, type ButtonProps, Card, CopyButton, type CopyButtonProps, FileList, type FileListProps, HoverIconAction, type HoverIconActionProps, Input, Select, Shell, type ShellProps, Spinner, type SpinnerProps, cn, mergeFiles };
