import { render, screen } from '@testing-library/react'
import { Input } from './Input'

test('renders a text field with base classes', () => {
  render(<Input placeholder="Name" />)
  expect(screen.getByPlaceholderText('Name')).toHaveClass('rounded-md')
})

test('forwards native input attributes', () => {
  render(<Input defaultValue="hi" aria-label="greeting" />)
  expect(screen.getByLabelText('greeting')).toHaveValue('hi')
})
