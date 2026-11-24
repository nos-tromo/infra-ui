import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AudioIcon, FileIcon, ImageIcon, VideoIcon, WarningIcon } from '../icons'
import { AttachmentTile } from './AttachmentTile'

const PICTURE = 'data:image/png;base64,iVBORw0KGgo='
const OTHER = 'data:image/png;base64,AAAA'

const face = (c: HTMLElement) => c.querySelector('[data-part="face"]')!
const drawing = (icon: React.ReactElement) => render(icon).container.querySelector('svg')!.innerHTML

test('an image shows its picture as a square cover, named by the file', () => {
  const { container, rerender } = render(
    <AttachmentTile name="harbour-sketch.png" kind="image" status="ready" thumbnailUrl={PICTURE} />,
  )
  const img = screen.getByRole('img', { name: 'harbour-sketch.png' })
  expect(img).toHaveAttribute('src', PICTURE)
  expect(img).toHaveClass('object-cover')
  expect(face(container)).toHaveClass('size-14')
  expect(container.firstElementChild).toHaveAttribute('data-kind', 'image')
  expect(container.firstElementChild).toHaveAttribute('data-status', 'ready')
  expect(container.firstElementChild).toHaveAttribute('data-size', 'sm')
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  rerender(
    <AttachmentTile
      name="harbour-sketch.png"
      kind="image"
      status="ready"
      thumbnailUrl={PICTURE}
      size="md"
    />,
  )
  expect(face(container)).toHaveClass('size-28')
  expect(container.firstElementChild).toHaveAttribute('data-size', 'md')
})

test('with onOpen the face is one button named by the file; Enter, Space and a click open it', async () => {
  const onOpen = vi.fn()
  const user = userEvent.setup()
  render(
    <AttachmentTile
      name="harbour-sketch.png"
      kind="image"
      status="ready"
      thumbnailUrl={PICTURE}
      onOpen={onOpen}
    />,
  )
  const button = screen.getByRole('button', { name: 'harbour-sketch.png' })
  expect(button.querySelector('img')).toHaveAttribute('alt', '') // the button carries the name
  button.focus()
  await user.keyboard('{Enter}')
  await user.keyboard(' ')
  await user.click(button)
  expect(onOpen).toHaveBeenCalledTimes(3)
})

test('the remove button is its own control, after the face, and never opens', async () => {
  const [onOpen, onRemove] = [vi.fn(), vi.fn()]
  const user = userEvent.setup()
  render(
    <AttachmentTile
      name="quarterly-plan.pdf"
      kind="document"
      status="ready"
      onOpen={onOpen}
      onRemove={onRemove}
      removeLabel="Remove quarterly-plan.pdf"
    />,
  )
  await user.tab()
  expect(screen.getByRole('button', { name: 'quarterly-plan.pdf' })).toHaveFocus()
  await user.tab()
  expect(screen.getByRole('button', { name: 'Remove quarterly-plan.pdf' })).toHaveFocus()
  await user.keyboard('{Enter}')
  await user.click(screen.getByRole('button', { name: 'Remove quarterly-plan.pdf' }))
  expect(onRemove).toHaveBeenCalledTimes(2)
  expect(onOpen).not.toHaveBeenCalled()
})

test('the cross is small, and shows on hover or focus where a pointer can hover, always on touch', () => {
  const { container } = render(
    <AttachmentTile name="quarterly-plan.pdf" kind="document" status="ready" onRemove={() => {}} />,
  )
  expect(container.firstElementChild).toHaveClass('group/tile')
  const cross = screen.getByRole('button', { name: 'Remove quarterly-plan.pdf' })
  expect(cross).toHaveClass('h-5', 'w-5', '[&_svg]:h-3', '[&_svg]:w-3')
  expect(cross).toHaveClass('after:absolute', 'after:-inset-0.5') // a 24px target
  expect(cross).toHaveClass(
    '[@media(hover:hover)]:opacity-0',
    'group-hover/tile:opacity-100',
    'group-has-[:focus-visible]/tile:opacity-100',
  )
  expect(cross).not.toHaveClass('h-6')
  expect(cross).not.toHaveClass('h-8')
})

test('without a removeLabel the remove button is still named after the file', () => {
  render(
    <AttachmentTile name="quarterly-plan.pdf" kind="document" status="ready" onRemove={() => {}} />,
  )
  expect(screen.getByRole('button', { name: 'Remove quarterly-plan.pdf' })).toBeInTheDocument()
})

test('uploading and processing veil the picture with a spinner named by the status', () => {
  const { rerender } = render(
    <AttachmentTile
      name="harbour-sketch.png"
      kind="image"
      status="uploading"
      thumbnailUrl={PICTURE}
      statusLabel="Attaching harbour-sketch.png"
      onOpen={() => {}}
    />,
  )
  expect(screen.getByRole('status', { name: 'Attaching harbour-sketch.png' })).toBeInTheDocument()
  expect(screen.getByRole('button')).toHaveAccessibleDescription('Attaching harbour-sketch.png')
  expect(screen.getByRole('button').querySelector('img')).toHaveAttribute('src', PICTURE) // the local preview stays
  rerender(
    <AttachmentTile
      name="harbour-sketch.png"
      kind="image"
      status="processing"
      thumbnailUrl={PICTURE}
    />,
  )
  expect(screen.getByRole('status', { name: 'Processing' })).toBeInTheDocument()
})

test('an image with no picture shows the marker in place of its drawing, not on top of it', () => {
  const { container, rerender } = render(
    <AttachmentTile name="harbour-sketch.png" kind="image" status="uploading" onOpen={() => {}} />,
  )
  expect(screen.getByRole('status', { name: 'Uploading' })).toBeInTheDocument()
  expect(face(container).querySelector('svg')).toBeNull() // the spinner is not a drawing
  expect(container.querySelector('[class*="bg-background/50"]')).toBeNull() // nothing to veil
  rerender(<AttachmentTile name="harbour-sketch.png" kind="image" status="failed" />)
  expect(face(container).querySelectorAll('svg')).toHaveLength(1)
  expect(face(container).querySelector('svg')!.innerHTML).toBe(drawing(<WarningIcon />))
  expect(screen.getByRole('img', { name: 'Failed' })).toBeInTheDocument()
  expect(screen.getByText('harbour-sketch.png')).toBeInTheDocument() // the tile keeps its name
  expect(container.querySelector('[class*="bg-background/50"]')).toBeNull()
})

test('a picture that fails to load while uploading gives way to the spinner alone', () => {
  const { container } = render(
    <AttachmentTile
      name="harbour-sketch.png"
      kind="image"
      status="uploading"
      thumbnailUrl={PICTURE}
    />,
  )
  fireEvent.error(container.querySelector('img')!)
  expect(container.querySelector('img')).toBeNull()
  expect(screen.getByRole('status', { name: 'Uploading' })).toBeInTheDocument()
  expect(face(container).querySelector('svg')).toBeNull()
})

test('the focus ring is offset from the face so it shows on the accent bubble', () => {
  render(<AttachmentTile name="harbour-sketch.png" kind="image" status="ready" onOpen={() => {}} />)
  expect(screen.getByRole('button', { name: 'harbour-sketch.png' })).toHaveClass(
    'focus-visible:ring-2',
    'focus-visible:ring-primary',
    'focus-visible:ring-offset-2',
    'focus-visible:ring-offset-background',
  )
})

test('a failed tile is marked in danger with the warning drawing, not a cross', () => {
  const { container } = render(
    <AttachmentTile
      name="harbour-sketch.png"
      kind="image"
      status="failed"
      thumbnailUrl={PICTURE}
      statusLabel="Could not be read"
    />,
  )
  expect(face(container)).toHaveClass('border-danger')
  const marker = screen.getByRole('img', { name: 'Could not be read' })
  expect(marker.querySelector('svg')!.innerHTML).toBe(drawing(<WarningIcon />))
})

test('an expired tile shows no picture, even when given one, and says so', () => {
  const { container } = render(
    <AttachmentTile
      name="harbour-sketch.png"
      kind="image"
      status="expired"
      thumbnailUrl={PICTURE}
      size="md"
    />,
  )
  expect(container.querySelector('img')).toBeNull()
  expect(face(container)).toHaveClass('size-28') // md keeps the square: the badge fits there
  expect(face(container).querySelector('svg')!.innerHTML).toBe(drawing(<ImageIcon />))
  expect(screen.getByText('Expired')).toBeInTheDocument()
})

test('an expired sm image is a row, so the whole label has room, not "Ex…"', () => {
  const { container } = render(
    <AttachmentTile
      name="old-photo.png"
      kind="image"
      status="expired"
      thumbnailUrl={PICTURE}
      onOpen={() => {}}
    />,
  )
  const row = face(container)
  expect(container.firstElementChild).toHaveAttribute('data-kind', 'image') // still an image
  expect(row).toHaveClass('h-14', 'w-56') // the row's width, not the 56px square's
  expect(row).not.toHaveClass('size-14')
  expect(container.querySelector('img')).toBeNull()
  expect(row.querySelector('svg')!.innerHTML).toBe(drawing(<ImageIcon />))
  const name = screen.getByText('old-photo.png')
  const badge = screen.getByText('Expired')
  expect(name).toHaveClass('truncate')
  expect(name.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy() // the badge ends the row
  expect(badge.parentElement).not.toHaveClass('flex-col')
  expect(screen.getByRole('button', { name: 'old-photo.png' })).toHaveAccessibleDescription(
    'Expired',
  )
})

test('an expired sm image without onOpen is a row too, and a custom label is shown whole', () => {
  const { container } = render(
    <AttachmentTile name="old-photo.png" kind="image" status="expired" statusLabel="Abgelaufen" />,
  )
  expect(face(container)).toHaveClass('w-56')
  expect(screen.getByText('Abgelaufen')).toBeInTheDocument()
  expect(screen.getByText('old-photo.png')).toBeInTheDocument()
})

test('only an expired sm image becomes a row: a failed one stays the square', () => {
  const { container } = render(
    <AttachmentTile name="old-photo.png" kind="image" status="failed" thumbnailUrl={PICTURE} />,
  )
  expect(face(container)).toHaveClass('size-14')
})

test.each([
  ['document', 'quarterly-plan.pdf', '24 slides', FileIcon],
  ['video', 'site-walk.mp4', '01:12', VideoIcon],
  ['audio', 'standup-notes.m4a', '04:30', AudioIcon],
] as const)(
  'a %s tile shows its drawn kind, the name and the detail',
  (kind, name, detail, Icon) => {
    const { container } = render(
      <AttachmentTile
        name={name}
        kind={kind}
        status="ready"
        detail={detail}
        thumbnailUrl={PICTURE}
      />,
    )
    expect(container.querySelector('img')).toBeNull() // a thumbnail is for images only
    expect(face(container).querySelector('svg')!.innerHTML).toBe(drawing(<Icon />))
    expect(screen.getByText(name)).toHaveAttribute('title', name)
    expect(screen.getByText(detail)).toBeInTheDocument()
  },
)

test('a picture that fails to load falls back to the drawing, and a new one is tried', () => {
  const { container, rerender } = render(
    <AttachmentTile name="harbour-sketch.png" kind="image" status="ready" thumbnailUrl={PICTURE} />,
  )
  fireEvent.error(container.querySelector('img')!)
  expect(container.querySelector('img')).toBeNull()
  expect(face(container).querySelector('svg')!.innerHTML).toBe(drawing(<ImageIcon />))
  rerender(
    <AttachmentTile name="harbour-sketch.png" kind="image" status="ready" thumbnailUrl={OTHER} />,
  )
  expect(container.querySelector('img')).toHaveAttribute('src', OTHER)
})

test('a long name keeps the tile’s width: truncated, whole in the tooltip and the name', () => {
  const name = `${'minutes-of-the-planning-meeting-'.repeat(4)}final.pdf` // 137 characters, no spaces
  const { container } = render(
    <AttachmentTile name={name} kind="document" status="ready" onOpen={() => {}} />,
  )
  expect(face(container)).toHaveClass('w-56')
  expect(screen.getByText(name)).toHaveClass('truncate')
  expect(screen.getByText(name)).toHaveAttribute('title', name)
  expect(screen.getByRole('button', { name })).toBeInTheDocument()
})

const LONG = 'Very long: read only in parts'

test('a ready document shows its warning under the detail, drawn and said, without hiding either', () => {
  const { container } = render(
    <AttachmentTile
      name="field-survey.pdf"
      kind="document"
      status="ready"
      detail="18.6 MB"
      warning={LONG}
    />,
  )
  const text = screen.getByText(LONG)
  expect(text).toHaveClass('truncate')
  expect(text).toHaveAttribute('title', LONG)
  expect(text.parentElement).toHaveClass('text-warning')
  expect(text.parentElement!.querySelector('svg')!.innerHTML).toBe(drawing(<WarningIcon />))
  const detail = screen.getByText('18.6 MB')
  expect(detail.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy() // under it
  expect(screen.getByText('field-survey.pdf')).toHaveAttribute('title', 'field-survey.pdf')
  expect(face(container)).toHaveClass('h-14', 'w-56', 'border-border') // the row's size; a caution, not a failure
  expect(face(container).querySelector('svg')!.innerHTML).toBe(drawing(<FileIcon />)) // the kind still leads
})

test('each face button is described by its own warning', () => {
  render(
    <>
      <AttachmentTile
        name="field-survey.pdf"
        kind="document"
        status="ready"
        detail="18.6 MB"
        warning={LONG}
        onOpen={() => {}}
      />
      <AttachmentTile
        name="site-ledger.xlsx"
        kind="document"
        status="ready"
        detail="4.1 MB"
        warning="Sheets read in parts"
        onOpen={() => {}}
      />
    </>,
  )
  const first = screen.getByRole('button', { name: 'field-survey.pdf' })
  const text = screen.getByText(LONG)
  expect(text.id).not.toBe('')
  expect(first.getAttribute('aria-describedby')!.split(' ')).toContain(text.id)
  expect(first).toHaveAccessibleDescription(`18.6 MB ${LONG}`)
  expect(screen.getByRole('button', { name: 'site-ledger.xlsx' })).toHaveAccessibleDescription(
    '4.1 MB Sheets read in parts',
  )
})

test('failed and expired keep their own marker and drop the warning', () => {
  const props = {
    name: 'field-survey.pdf',
    kind: 'document',
    detail: '18.6 MB',
    warning: LONG,
    onOpen: () => {},
  } as const
  const { rerender } = render(
    <AttachmentTile {...props} status="failed" statusLabel="Could not be read" />,
  )
  expect(screen.getByRole('img', { name: 'Could not be read' })).toBeInTheDocument()
  expect(screen.queryByText(LONG)).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'field-survey.pdf' })).toHaveAccessibleDescription(
    '18.6 MB Could not be read',
  )
  rerender(<AttachmentTile {...props} status="expired" statusLabel="Expired" />)
  expect(screen.getByText('Expired')).toBeInTheDocument()
  expect(screen.queryByText(LONG)).not.toBeInTheDocument()
})

test.each(['uploading', 'processing'] as const)(
  'a %s tile shows its spinner, not the warning yet',
  (status) => {
    render(
      <AttachmentTile
        name="field-survey.pdf"
        kind="document"
        status={status}
        detail="18.6 MB"
        warning={LONG}
      />,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText(LONG)).not.toBeInTheDocument()
  },
)

test('without a warning, or with an empty one, the tile is as before', () => {
  const props = {
    name: 'field-survey.pdf',
    kind: 'document',
    status: 'ready',
    detail: '18.6 MB',
    onOpen: () => {},
  } as const
  const { container, rerender } = render(<AttachmentTile {...props} />)
  expect(face(container).querySelectorAll('svg')).toHaveLength(1) // the kind alone
  expect(screen.getByRole('button')).toHaveAccessibleDescription('18.6 MB')
  rerender(<AttachmentTile {...props} warning="" />)
  expect(face(container).querySelectorAll('svg')).toHaveLength(1)
  expect(screen.getByRole('button')).toHaveAccessibleDescription('18.6 MB')
  rerender(<AttachmentTile {...props} warning="   " />) // blank is none
  expect(face(container).querySelectorAll('svg')).toHaveLength(1)
  expect(screen.getByRole('button')).toHaveAccessibleDescription('18.6 MB')
})

test('on an image’s square the warning is the drawing in a corner, its text the tooltip and the description', () => {
  const { container } = render(
    <AttachmentTile
      name="harbour-sketch.png"
      kind="image"
      status="ready"
      thumbnailUrl={PICTURE}
      warning={LONG}
      onOpen={() => {}}
    />,
  )
  expect(face(container)).toHaveClass('size-14') // still the square
  expect(container.querySelector('img')).toHaveAttribute('src', PICTURE)
  expect(container.querySelector('[class*="bg-background/50"]')).toBeNull() // not veiled
  const corner = face(container).querySelector(`[title="${LONG}"]`)!
  expect(corner).toHaveClass('text-warning')
  expect(corner).toHaveClass('bottom-1', 'left-1') // the lower left, as the cross is the upper right
  expect(corner.querySelector('svg')!.innerHTML).toBe(drawing(<WarningIcon />))
  expect(screen.getByText(LONG)).toHaveClass('sr-only')
  expect(screen.getByRole('button', { name: 'harbour-sketch.png' })).toHaveAccessibleDescription(
    LONG,
  )
})
