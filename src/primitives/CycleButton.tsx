import type { ReactNode } from 'react'
import { IconButton, type IconButtonProps } from './IconButton'

export interface CycleButtonOption<V extends string> {
  /** The value this option selects. */
  value: V
  /** Its drawing. Each option needs its own — the icon is the only visible state. */
  icon: ReactNode
  /** Names the value; joined to `name` for the accessible name and the tooltip. */
  label: string
}

export interface CycleButtonProps<V extends string>
  extends Omit<
    IconButtonProps,
    // The last three are the native `<button>` attributes of the same names.
    // They are shadowed rather than merged: all three are consumed here and
    // none reaches the DOM, and `onChange`'s native form takes an event.
    'icon' | 'label' | 'onClick' | 'children' | 'busy' | 'name' | 'value' | 'onChange'
  > {
  /** The setting's name — the constant half of "Name: Value". */
  name: string
  /** The values, in the order the button steps through them. */
  options: readonly CycleButtonOption<V>[]
  /** The selected value. Controlled — the caller owns the step. */
  value: V
  /** Called with the next value in the run, wrapping at the end. */
  onChange: (next: V) => void
}

/**
 * One icon button that steps through a short run of values.
 *
 * The shape `ThemeToggle` already had, exported so an app stops reaching for a
 * dropdown: for a setting with three or four values that is changed rarely and
 * sits in a row of 32px icons, a labelled `SelectMenu` is a lot of furniture,
 * and it reads as a different *kind* of control than the toggles beside it.
 *
 * Each value draws its own icon, never one icon tinted — a state legible only
 * on hover is a state people leave set wrong — and the accessible name and
 * tooltip read "Name: Value", so what is selected reaches a screen reader and
 * the pointer alike. That is why the name does *not* say what the next click
 * does, unlike `DisclosureButton`: this control has a persistent value.
 *
 * Reach for it only when every value has a drawing someone can tell apart.
 * A binary on/off is `IconButton` with `aria-pressed` and a two-icon state
 * pair; a labelled choice is `ToggleButton`; more than about four values, or a
 * form row, is `SelectMenu`, which can be read without clicking through it.
 *
 * @param props - `name`, `options`, `value` and `onChange`; the rest go to `IconButton`.
 * @returns The button, drawn as the current value.
 */
export function CycleButton<V extends string>({
  name,
  options,
  value,
  onChange,
  ...props
}: CycleButtonProps<V>) {
  // A value outside the run (a stale persisted setting, an option list that
  // changed under it) shows the first option rather than rendering nothing.
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const current = options[index]!
  const next = options[(index + 1) % options.length]!

  return (
    <IconButton
      icon={current.icon}
      label={`${name}: ${current.label}`}
      onClick={() => onChange(next.value)}
      {...props}
    />
  )
}
