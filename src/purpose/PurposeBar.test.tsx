import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagIcon, WarningIcon } from '../icons'
import {
  MAX_PURPOSE_FIELD,
  __resetPurposeStoreForTesting,
  getPurpose,
  purposeHeaders,
  requestPurpose,
  setPurpose,
  type Purpose,
} from './purpose'
import { PurposeBar, type PurposeBarLabels } from './PurposeBar'

afterEach(() => {
  sessionStorage.clear()
  __resetPurposeStoreForTesting()
  vi.restoreAllMocks()
})

/** The bar's button, in whichever of its three states it is. */
const bar = () => screen.getByRole('button', { name: /purpose/i })
const field = (label: string) => screen.getByLabelText(label)
const drawing = (icon: React.ReactElement) => render(icon).container.querySelector('svg')!.innerHTML

/** Ask for a purpose the way a fetch wrapper does after a 428. */
function ask(scope = 'chorus') {
  let pending!: Promise<Purpose | null>
  act(() => {
    pending = requestPurpose(scope)
  })
  return pending
}

async function open() {
  const user = userEvent.setup()
  await user.click(bar())
  return user
}

describe('the bar', () => {
  test('with no purpose stated, says so in a quiet, dashed slot', () => {
    render(<PurposeBar scope="chorus" />)
    const button = screen.getByRole('button', { name: 'No purpose stated' })
    expect(button).toHaveAttribute('aria-haspopup', 'dialog')
    expect(button).toHaveAttribute('data-state', 'empty')
    expect(button).toHaveClass('border-dashed', 'text-muted-foreground')
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(button.querySelector('svg')!.innerHTML).toBe(drawing(<TagIcon />))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('where a purpose is required, the empty bar is a warning', () => {
    render(<PurposeBar scope="chorus" required />)
    const button = screen.getByRole('button', { name: 'Purpose required' })
    expect(button).toHaveAttribute('data-state', 'required')
    // Banner's danger recipe: the colour is in the border, tint and icon, so
    // the words keep the foreground's contrast.
    expect(button).toHaveClass('bg-danger/10', 'text-foreground')
    const svg = button.querySelector('svg')!
    expect(svg).toHaveClass('text-danger')
    expect(svg.innerHTML).toBe(drawing(<WarningIcon />))
  })

  test('a stated purpose shows its fields, and the tooltip carries them whole', () => {
    setPurpose('chorus', { caseRef: 'AZ-12', reason: 'Prüfung des Hinweises' })
    render(<PurposeBar scope="chorus" required />)
    // The federation's "Name: Value" accessible name, as CycleButton has it.
    const button = screen.getByRole('button', { name: 'Purpose: AZ-12 · Prüfung des Hinweises' })
    expect(button).toHaveAttribute('data-state', 'set')
    expect(button).toHaveTextContent('AZ-12 · Prüfung des Hinweises')
    expect(button).toHaveAttribute('title', 'Case reference: AZ-12\nReason: Prüfung des Hinweises')
  })

  test('shows only the fields that were given', () => {
    setPurpose('chorus', { reason: 'Prüfung' })
    render(<PurposeBar scope="chorus" />)
    const button = screen.getByRole('button', { name: 'Purpose: Prüfung' })
    expect(button).toHaveAttribute('title', 'Reason: Prüfung')
  })

  test('follows a purpose set elsewhere, and shows its own scope only', () => {
    setPurpose('docint', { caseRef: 'AZ-99' })
    render(<PurposeBar scope="chorus" />)
    expect(bar()).toHaveAccessibleName('No purpose stated')
    act(() => {
      setPurpose('chorus', { caseRef: 'AZ-12' })
    })
    expect(bar()).toHaveAccessibleName('Purpose: AZ-12')
  })
})

describe('the dialog', () => {
  test('opens modally, labelled and described, with focus in the first field', async () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    setPurpose('chorus', { caseRef: 'AZ-12' })
    render(<PurposeBar scope="chorus" />)
    await open()

    const dialog = screen.getByRole('dialog', { name: 'Purpose' })
    expect(showModal).toHaveBeenCalledTimes(1)
    expect(dialog).toHaveAccessibleDescription(/sent with each request/i)
    // Portalled to the body, so it is not announced as part of the header's
    // banner landmark, nor styled by it.
    expect(dialog.parentElement).toBe(document.body)
    expect(within(dialog).getByLabelText('Case reference')).toHaveFocus()
    expect(within(dialog).getByLabelText('Case reference')).toHaveValue('AZ-12')
    expect(within(dialog).getByLabelText('Reason')).toHaveValue('')
  })

  test('saving states the purpose, closes, and hands focus back to the bar', async () => {
    render(<PurposeBar scope="chorus" />)
    const user = await open()
    await user.type(field('Case reference'), 'AZ-12')
    await user.type(field('Reason'), 'Prüfung des Hinweises')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(getPurpose('chorus')).toEqual({ caseRef: 'AZ-12', reason: 'Prüfung des Hinweises' })
    expect(purposeHeaders('chorus')).toEqual({
      'X-Audit-Purpose': 'case_ref=AZ-12&reason=Pr%C3%BCfung+des+Hinweises',
    })
    expect(
      screen.getByRole('button', { name: 'Purpose: AZ-12 · Prüfung des Hinweises' }),
    ).toHaveFocus()
  })

  test('is complete from the keyboard: Enter opens, Tab moves, Enter saves', async () => {
    const user = userEvent.setup()
    render(<PurposeBar scope="chorus" />)
    bar().focus()
    await user.keyboard('{Enter}')
    expect(field('Case reference')).toHaveFocus()
    await user.keyboard('AZ-12{Tab}')
    expect(field('Reason')).toHaveFocus()
    await user.keyboard('Prüfung{Enter}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(getPurpose('chorus')).toEqual({ caseRef: 'AZ-12', reason: 'Prüfung' })
    expect(bar()).toHaveFocus()
  })

  test('Escape discards the edit and hands focus back', async () => {
    setPurpose('chorus', { caseRef: 'AZ-12' })
    render(<PurposeBar scope="chorus" />)
    const user = await open()
    await user.type(field('Case reference'), '-changed')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(getPurpose('chorus')?.caseRef).toBe('AZ-12')
    expect(bar()).toHaveFocus()
  })

  test('one Escape closes one layer: a listener on document never sees it', async () => {
    const onDocumentKey = vi.fn()
    document.addEventListener('keydown', onDocumentKey)
    try {
      render(<PurposeBar scope="chorus" />)
      const user = await open()
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(onDocumentKey).not.toHaveBeenCalled()
    } finally {
      document.removeEventListener('keydown', onDocumentKey)
    }
  })

  test('Cancel discards the edit, and the next opening starts from what is stated', async () => {
    setPurpose('chorus', { caseRef: 'AZ-12' })
    render(<PurposeBar scope="chorus" />)
    const user = await open()
    await user.clear(field('Case reference'))
    await user.type(field('Case reference'), 'AZ-77')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(getPurpose('chorus')?.caseRef).toBe('AZ-12')

    await user.click(bar())
    expect(field('Case reference')).toHaveValue('AZ-12')
  })

  test('Clear removes the stated purpose, and is offered only while one is stated', async () => {
    render(<PurposeBar scope="chorus" />)
    const user = await open()
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')

    act(() => {
      setPurpose('chorus', { caseRef: 'AZ-12' })
    })
    await user.click(bar())
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(getPurpose('chorus')).toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No purpose stated' })).toHaveFocus()
  })

  test('the footer is one full-width bar, Save last', async () => {
    render(<PurposeBar scope="chorus" />)
    await open()
    const footer = screen.getByRole('button', { name: 'Save' }).parentElement!
    expect(footer).toHaveClass('flex-wrap', '*:flex-[1_1_8rem]')
    expect(
      within(footer)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Cancel', 'Save'])
  })

  test('with a purpose stated, Clear joins the bar as a bordered button', async () => {
    setPurpose('chorus', { caseRef: 'AZ-12' })
    render(<PurposeBar scope="chorus" />)
    await open()
    const footer = screen.getByRole('button', { name: 'Save' }).parentElement!
    expect(
      within(footer)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Clear', 'Cancel', 'Save'])
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveClass('border')
  })

  test('where none is required, saving both fields blank clears the purpose', async () => {
    setPurpose('chorus', { caseRef: 'AZ-12' })
    render(<PurposeBar scope="chorus" />)
    const user = await open()
    await user.clear(field('Case reference'))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(getPurpose('chorus')).toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('saving does not submit a form the bar happens to sit in', async () => {
    // The dialog is portalled out of the DOM, but React bubbles its events
    // through the component tree all the same.
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <PurposeBar scope="chorus" />
      </form>,
    )
    const user = await open()
    await user.keyboard('AZ-12{Enter}')
    expect(getPurpose('chorus')?.caseRef).toBe('AZ-12')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('a close the browser makes on its own counts as a cancel', async () => {
    render(<PurposeBar scope="chorus" />)
    const pending = ask()
    const dialog = screen.getByRole('dialog')
    // The browser's close request (a back gesture) is cancelled and handled
    // like Escape; a dialog it closes regardless is synced, not left stale.
    const cancelEvent = new Event('cancel', { cancelable: true })
    act(() => {
      fireEvent(dialog, cancelEvent)
    })
    expect(cancelEvent.defaultPrevented).toBe(true)
    await expect(pending).resolves.toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    const again = ask()
    act(() => {
      ;(screen.getByRole('dialog') as HTMLDialogElement).close()
    })
    await expect(again).resolves.toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('inline validation', () => {
  test('a field over the limit is flagged as it is typed, and Save keeps the dialog open', async () => {
    render(<PurposeBar scope="chorus" />)
    const user = await open()
    const reason = field('Reason')
    await user.click(reason)
    await user.paste('x'.repeat(MAX_PURPOSE_FIELD + 1))
    expect(reason).toHaveAttribute('aria-invalid', 'true')
    expect(reason).toHaveAccessibleDescription(`At most ${MAX_PURPOSE_FIELD} characters.`)

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(reason).toHaveFocus()
    expect(getPurpose('chorus')).toBeNull()

    await user.keyboard('{Backspace}')
    expect(reason).not.toHaveAttribute('aria-invalid')
    expect(reason).not.toHaveAccessibleDescription()
  })

  test('a pasted tab is flagged rather than silently sent', async () => {
    render(<PurposeBar scope="chorus" />)
    const user = await open()
    await user.paste('AZ\t12')
    expect(field('Case reference')).toHaveAccessibleDescription(
      'Remove line breaks, tabs and other control characters.',
    )
    expect(field('Reason')).not.toHaveAttribute('aria-invalid')
    await user.keyboard('{Enter}')
    expect(field('Case reference')).toHaveFocus()
    expect(getPurpose('chorus')).toBeNull()
  })

  test('two fields too long to send together are flagged on both', async () => {
    render(<PurposeBar scope="chorus" />)
    const user = await open()
    const cjk = '調'.repeat(MAX_PURPOSE_FIELD)
    await user.paste(cjk)
    await user.click(field('Reason'))
    await user.paste(cjk)
    const message = 'Too long to send together. Shorten one of the fields.'
    expect(screen.getByText(message)).toBeInTheDocument()
    for (const label of ['Case reference', 'Reason']) {
      expect(field(label)).toHaveAttribute('aria-invalid', 'true')
      expect(field(label)).toHaveAccessibleDescription(message)
    }
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(field('Reason')).toHaveFocus()
    expect(getPurpose('chorus')).toBeNull()
  })

  test('where a purpose is required, saving nothing is refused, and says why', async () => {
    render(<PurposeBar scope="chorus" required />)
    const user = await open()
    // Not before an attempt: an empty form is where everyone starts.
    expect(screen.queryByText('Enter a case reference or a reason.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(field('Case reference')).toHaveFocus()
    expect(field('Case reference')).toHaveAccessibleDescription(
      'Enter a case reference or a reason.',
    )
    await user.keyboard('AZ-12')
    expect(screen.queryByText('Enter a case reference or a reason.')).not.toBeInTheDocument()
  })
})

describe('answering requestPurpose', () => {
  test('opens the dialog, says why, and resolves with what is saved', async () => {
    const user = userEvent.setup()
    render(
      <>
        <button type="button">Search</button>
        <PurposeBar scope="chorus" />
      </>,
    )
    const search = screen.getByRole('button', { name: 'Search' })
    search.focus()
    const pending = ask()

    const dialog = screen.getByRole('dialog', { name: 'Purpose' })
    expect(dialog).toHaveAccessibleDescription(/this action needs a stated purpose/i)
    expect(field('Case reference')).toHaveFocus()
    await user.keyboard('AZ-12{Enter}')

    await expect(pending).resolves.toEqual({ caseRef: 'AZ-12', reason: '' })
    // Back to the control whose request asked, not to the bar.
    expect(search).toHaveFocus()
  })

  test('refuses a blank answer even where the bar is not marked required', async () => {
    // A 428 is the backend saying this action needs one, whatever the app passed.
    const user = userEvent.setup()
    render(<PurposeBar scope="chorus" />)
    const pending = ask()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Enter a case reference or a reason.')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await expect(pending).resolves.toBeNull()
  })

  test('cancelling resolves the request with null', async () => {
    const user = userEvent.setup()
    render(<PurposeBar scope="chorus" />)
    const pending = ask()
    await user.keyboard('{Escape}')
    await expect(pending).resolves.toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('a request arriving while the dialog is open joins it', async () => {
    render(<PurposeBar scope="chorus" />)
    const user = await open()
    await user.type(field('Case reference'), 'AZ-')
    expect(screen.queryByText('This action needs a stated purpose.')).not.toBeInTheDocument()

    const pending = ask()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(field('Case reference')).toHaveValue('AZ-')
    expect(screen.getByText('This action needs a stated purpose.')).toBeInTheDocument()
    await user.keyboard('12{Enter}')
    await expect(pending).resolves.toEqual({ caseRef: 'AZ-12', reason: '' })
  })

  test('a request waiting on a bar that unmounts settles with null', async () => {
    const { unmount } = render(<PurposeBar scope="chorus" />)
    const pending = ask()
    unmount()
    await expect(pending).resolves.toBeNull()
  })

  test('only the bar for the asking scope opens', () => {
    render(
      <>
        <PurposeBar scope="chorus" />
        <PurposeBar scope="docint" />
      </>,
    )
    void ask('docint')
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(getPurpose('chorus')).toBeNull()
  })
})

test('every string comes from labels, with {max} filled in', async () => {
  const labels: PurposeBarLabels = {
    purpose: 'Zweck',
    empty: 'Kein Zweck angegeben',
    required: 'Zweck erforderlich',
    title: 'Zweck angeben',
    description: 'Wird mit jeder Anfrage gesendet.',
    requested: 'Diese Aktion braucht einen Zweck.',
    caseRef: 'Aktenzeichen',
    reason: 'Begründung',
    save: 'Speichern',
    cancel: 'Abbrechen',
    clear: 'Entfernen',
    errorLength: 'Höchstens {max} Zeichen.',
    errorControl: 'Keine Steuerzeichen.',
    errorHeader: 'Zusammen zu lang.',
    errorEmpty: 'Aktenzeichen oder Begründung angeben.',
  }
  const user = userEvent.setup()
  const { rerender } = render(<PurposeBar scope="chorus" labels={labels} />)
  await user.click(screen.getByRole('button', { name: 'Kein Zweck angegeben' }))
  const dialog = screen.getByRole('dialog', { name: 'Zweck angeben' })
  expect(dialog).toHaveAccessibleDescription('Wird mit jeder Anfrage gesendet.')
  await user.click(within(dialog).getByLabelText('Begründung'))
  await user.paste('x'.repeat(MAX_PURPOSE_FIELD + 1))
  expect(within(dialog).getByText('Höchstens 256 Zeichen.')).toBeInTheDocument()
  await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }))

  act(() => {
    setPurpose('chorus', { caseRef: 'AZ-12' })
  })
  rerender(<PurposeBar scope="chorus" labels={labels} />)
  expect(screen.getByRole('button', { name: 'Zweck: AZ-12' })).toHaveAttribute(
    'title',
    'Aktenzeichen: AZ-12',
  )
})
