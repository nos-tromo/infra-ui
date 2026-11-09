import { render, screen } from '@testing-library/react'
import { ActionBar } from './ActionBar'

test('children share the full width and never squeeze their label', () => {
  const { container } = render(
    <ActionBar>
      <button>Apply</button>
    </ActionBar>,
  )
  expect(container.firstElementChild).toHaveClass(
    'flex',
    'flex-wrap',
    '*:flex-[1_1_8rem]',
    '*:whitespace-nowrap',
  )
})

test('a conditional child that renders nothing leaves no gap', () => {
  const { container } = render(
    <ActionBar>
      {false}
      <button>Discard</button>
      <button>Apply</button>
    </ActionBar>,
  )
  expect(container.firstElementChild!.children).toHaveLength(2)
})

test('keeps the order it is given, primary last', () => {
  render(
    <ActionBar>
      <button>Discard</button>
      <button>Apply</button>
    </ActionBar>,
  )
  expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Discard', 'Apply'])
})

test('merges a className', () => {
  const { container } = render(
    <ActionBar className="pt-1">
      <button>Save</button>
    </ActionBar>,
  )
  expect(container.firstElementChild).toHaveClass('pt-1', 'flex-wrap')
})
