import { render, screen, fireEvent, act } from '@testing-library/react'
import { CopyButton } from './CopyButton'

function setClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    writable: true,
    configurable: true,
  })
}

function clearClipboard() {
  Object.defineProperty(navigator, 'clipboard', {
    value: undefined,
    writable: true,
    configurable: true,
  })
}

afterEach(() => {
  vi.useRealTimers()
  clearClipboard()
})

test('renders an idle copy button with the default "Copy" accessible name', () => {
  render(<CopyButton text="hello" />)
  expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
})

test('writes the given text to the clipboard on click', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  setClipboard(writeText)

  render(<CopyButton text="hello world" />)
  await act(async () => {
    fireEvent.click(screen.getByRole('button'))
  })

  expect(writeText).toHaveBeenCalledWith('hello world')
})

test('swaps to the copied label after a click, then reverts after resetDelayMs', async () => {
  vi.useFakeTimers()
  setClipboard(vi.fn().mockResolvedValue(undefined))

  render(<CopyButton text="hello" resetDelayMs={1500} />)
  expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()

  await act(async () => {
    fireEvent.click(screen.getByRole('button'))
    await Promise.resolve()
  })
  expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()

  await act(async () => {
    vi.advanceTimersByTime(1600)
  })
  expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
})

test('honors custom label and copiedLabel', async () => {
  setClipboard(vi.fn().mockResolvedValue(undefined))

  render(<CopyButton text="hello" label="Kopieren" copiedLabel="Kopiert" />)
  expect(screen.getByRole('button', { name: 'Kopieren' })).toBeInTheDocument()

  await act(async () => {
    fireEvent.click(screen.getByRole('button'))
    await Promise.resolve()
  })
  expect(screen.getByRole('button', { name: 'Kopiert' })).toBeInTheDocument()
})

test('does not throw when navigator.clipboard is unavailable', () => {
  clearClipboard()
  render(<CopyButton text="hello" />)
  expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow()
})

test('merges a custom className onto the underlying button', () => {
  render(<CopyButton text="hello" className="absolute right-2 top-2" />)
  expect(screen.getByRole('button')).toHaveClass('absolute', 'right-2', 'top-2')
})
