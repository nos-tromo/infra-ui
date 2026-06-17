import { render, screen } from '@testing-library/react'
import { Banner } from './Banner'

test('info variant uses the status role', () => {
  render(<Banner>Heads up</Banner>)
  expect(screen.getByRole('status')).toHaveTextContent('Heads up')
})

test('danger variant uses the alert role and danger border', () => {
  render(<Banner variant="danger">Boom</Banner>)
  const el = screen.getByRole('alert')
  expect(el).toHaveTextContent('Boom')
  expect(el).toHaveClass('border-danger/40')
})
