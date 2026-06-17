import { render, screen } from '@testing-library/react'
import { Select } from './Select'

test('renders a combobox with options', () => {
  render(
    <Select aria-label="pick">
      <option value="a">A</option>
    </Select>,
  )
  expect(screen.getByRole('combobox', { name: 'pick' })).toHaveClass('rounded-md')
})
