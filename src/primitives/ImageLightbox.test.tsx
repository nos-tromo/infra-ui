import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageLightbox, type ImageLightboxProps } from './ImageLightbox'

const PICTURE = 'data:image/png;base64,iVBORw0KGgo='

const outerClick = vi.fn()
const outerKey = vi.fn()

afterEach(() => {
  outerClick.mockReset()
  outerKey.mockReset()
  vi.restoreAllMocks()
})

/** An opener button, and the lightbox it opens, inside a page that listens for clicks and keys. */
function Harness({
  withOpener = true,
  mounted = true,
  ...extra
}: Partial<ImageLightboxProps> & { withOpener?: boolean; mounted?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div onClick={outerClick} onKeyDown={outerKey}>
      {withOpener && (
        <button type="button" onClick={() => setOpen(true)}>
          Open harbour-sketch.png
        </button>
      )}
      {mounted && (
        <ImageLightbox
          open={open}
          src={PICTURE}
          alt="harbour-sketch.png"
          closeLabel="Close"
          onClose={() => setOpen(false)}
          {...extra}
        />
      )}
    </div>
  )
}

const opener = () => screen.getByRole('button', { name: 'Open harbour-sketch.png' })

test('renders nothing while closed', () => {
  render(
    <ImageLightbox
      open={false}
      src={PICTURE}
      alt="harbour-sketch.png"
      closeLabel="Close"
      onClose={() => {}}
    />,
  )
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('opens as a modal dialog named by the picture, on the body, with focus on Close', async () => {
  const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
  render(<Harness />)
  await userEvent.setup().click(opener())
  const dialog = screen.getByRole('dialog', { name: 'harbour-sketch.png' })
  expect(showModal).toHaveBeenCalledTimes(1)
  expect(dialog).toHaveAttribute('aria-modal', 'true')
  expect(dialog.parentElement).toBe(document.body)
  expect(within(dialog).getByRole('img', { name: 'harbour-sketch.png' })).toHaveClass(
    'object-contain',
    'max-h-full',
    'max-w-full',
  )
  expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus()
})

test('Escape closes it once, goes no further, and hands focus back to the opener', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(opener())
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(outerKey).not.toHaveBeenCalled()
  expect(opener()).toHaveFocus()
})

test('Close closes it and hands focus back', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(opener())
  await user.click(screen.getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(opener()).toHaveFocus()
})

test('a click beside the picture closes it; a click on the picture does not, and neither reaches the page', () => {
  const onClose = vi.fn()
  render(
    <div onClick={outerClick}>
      <ImageLightbox
        open
        src={PICTURE}
        alt="harbour-sketch.png"
        closeLabel="Close"
        onClose={onClose}
      />
    </div>,
  )
  fireEvent.click(screen.getByRole('img', { name: 'harbour-sketch.png' }))
  expect(onClose).not.toHaveBeenCalled()
  fireEvent.click(document.querySelector('[data-part="stage"]')!)
  fireEvent.click(screen.getByRole('dialog'))
  expect(onClose).toHaveBeenCalledTimes(2)
  expect(outerClick).not.toHaveBeenCalled()
})

test('the browser’s own close request is a close', () => {
  const onClose = vi.fn()
  render(
    <ImageLightbox
      open
      src={PICTURE}
      alt="harbour-sketch.png"
      closeLabel="Close"
      onClose={onClose}
    />,
  )
  const cancel = new Event('cancel', { cancelable: true })
  fireEvent(screen.getByRole('dialog'), cancel)
  expect(cancel.defaultPrevented).toBe(true)
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('the browser’s own close request stops at the dialog, like every other event', () => {
  // `cancel` is a dialog event, so the page behind it is an outer dialog (not shown, no name).
  const outerCancel = vi.fn()
  render(
    <dialog onCancel={outerCancel}>
      <ImageLightbox
        open
        src={PICTURE}
        alt="harbour-sketch.png"
        closeLabel="Close"
        onClose={() => {}}
      />
    </dialog>,
  )
  fireEvent(
    screen.getByRole('dialog', { name: 'harbour-sketch.png' }),
    new Event('cancel', { cancelable: true }),
  )
  expect(outerCancel).not.toHaveBeenCalled()
})

test('Tab and Shift+Tab stay inside', async () => {
  const user = userEvent.setup()
  render(<Harness downloadHref={PICTURE} downloadName="harbour-sketch.png" />)
  await user.click(opener())
  const [download, close] = [
    screen.getByRole('link', { name: 'Download' }),
    screen.getByRole('button', { name: 'Close' }),
  ]
  await user.tab()
  expect(download).toHaveFocus()
  await user.tab()
  expect(close).toHaveFocus()
  await user.tab({ shift: true })
  expect(download).toHaveFocus()
  await user.tab({ shift: true })
  expect(close).toHaveFocus()
})

test('with Close alone, Tab keeps focus on Close', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(opener())
  const close = screen.getByRole('button', { name: 'Close' })
  await user.tab()
  expect(close).toHaveFocus()
  await user.tab()
  expect(close).toHaveFocus()
})

test('offers a download link, a download button, or neither', async () => {
  const onDownload = vi.fn()
  const { rerender } = render(
    <ImageLightbox
      open
      src={PICTURE}
      alt="harbour-sketch.png"
      closeLabel="Close"
      onClose={() => {}}
      downloadHref={PICTURE}
      downloadName="harbour-sketch.png"
      downloadLabel="Save picture"
    />,
  )
  expect(screen.getByRole('link', { name: 'Save picture' })).toHaveAttribute(
    'download',
    'harbour-sketch.png',
  )
  rerender(
    <ImageLightbox
      open
      src={PICTURE}
      alt="harbour-sketch.png"
      closeLabel="Close"
      onClose={() => {}}
      onDownload={onDownload}
    />,
  )
  await userEvent.setup().click(screen.getByRole('button', { name: 'Download' }))
  expect(onDownload).toHaveBeenCalledTimes(1)
  rerender(
    <ImageLightbox
      open
      src={PICTURE}
      alt="harbour-sketch.png"
      closeLabel="Close"
      onClose={() => {}}
    />,
  )
  expect(within(screen.getByRole('dialog')).getAllByRole('button')).toHaveLength(1)
})

test('a link without a name still downloads', () => {
  render(
    <ImageLightbox
      open
      src={PICTURE}
      alt="harbour-sketch.png"
      closeLabel="Close"
      onClose={() => {}}
      downloadHref={PICTURE}
    />,
  )
  expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute('download')
})

test('closing closes the native dialog too, so the page is live again', async () => {
  const close = vi.spyOn(HTMLDialogElement.prototype, 'close')
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(opener())
  expect(close).not.toHaveBeenCalled()
  await user.keyboard('{Escape}')
  expect(close).toHaveBeenCalledTimes(1)
})

test('closing after the opener is gone leaves focus on the body without an error', async () => {
  const user = userEvent.setup()
  const { rerender } = render(<Harness />)
  await user.click(opener())
  rerender(<Harness withOpener={false} />)
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(document.activeElement).toBe(document.body)
})

test('unmounting while open removes the dialog and hands focus back', async () => {
  const user = userEvent.setup()
  const { rerender } = render(<Harness />)
  await user.click(opener())
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  rerender(<Harness mounted={false} />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(opener()).toHaveFocus()
})
