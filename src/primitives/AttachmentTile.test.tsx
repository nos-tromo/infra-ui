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
  expect(face(container).querySelector('svg')!.innerHTML).toBe(drawing(<ImageIcon />))
  expect(screen.getByText('Expired')).toBeInTheDocument()
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
