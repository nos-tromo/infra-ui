import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CycleButton } from './CycleButton'

const OPTIONS = [
  { value: 'all', icon: <svg data-icon="all" />, label: 'Everything' },
  { value: 'documents', icon: <svg data-icon="documents" />, label: 'Documents' },
  { value: 'visual', icon: <svg data-icon="visual" />, label: 'Images' },
] as const

test('names the setting and its value, and draws that value', () => {
  // The icon is the whole affordance, so the value has to reach a screen
  // reader and the pointer some other way: the name and the tooltip.
  render(<CycleButton name="Answer from" options={OPTIONS} value="documents" onChange={() => {}} />)

  const button = screen.getByRole('button', { name: 'Answer from: Documents' })
  expect(button).toHaveAttribute('title', 'Answer from: Documents')
  expect(button.querySelector('[data-icon="documents"]')).not.toBeNull()
})

test('steps to the next value and wraps at the end of the run', async () => {
  const onChange = vi.fn()
  const { rerender } = render(
    <CycleButton name="Answer from" options={OPTIONS} value="documents" onChange={onChange} />,
  )

  await userEvent.click(screen.getByRole('button'))
  expect(onChange).toHaveBeenLastCalledWith('visual')

  rerender(<CycleButton name="Answer from" options={OPTIONS} value="visual" onChange={onChange} />)
  await userEvent.click(screen.getByRole('button'))
  expect(onChange).toHaveBeenLastCalledWith('all')
})

test('a value outside the run falls back to the first option', async () => {
  // A stale persisted setting, or an option list that changed under it. Showing
  // the first option beats rendering nothing at all.
  const onChange = vi.fn()
  render(
    <CycleButton
      name="Answer from"
      options={OPTIONS}
      value={'bogus' as 'all'}
      onChange={onChange}
    />,
  )

  expect(screen.getByRole('button', { name: 'Answer from: Everything' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button'))
  expect(onChange).toHaveBeenCalledWith('documents')
})

test('never submits the form it sits in', () => {
  render(<CycleButton name="Answer from" options={OPTIONS} value="all" onChange={() => {}} />)
  expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
})

test('takes the icon-button props a caller needs', async () => {
  const onChange = vi.fn()
  render(
    <CycleButton
      name="Answer from"
      options={OPTIONS}
      value="all"
      onChange={onChange}
      disabled
      className="ml-2"
    />,
  )

  const button = screen.getByRole('button')
  expect(button).toHaveClass('ml-2')
  await userEvent.click(button)
  expect(onChange).not.toHaveBeenCalled()
})
