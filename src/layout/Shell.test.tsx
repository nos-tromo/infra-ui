import { render, screen } from '@testing-library/react'
import { Shell } from './Shell'

test('renders the title, actions slot and page body', () => {
  render(
    <Shell title="Nextext" actions={<button>status</button>}>
      <p>page-body</p>
    </Shell>,
  )
  expect(screen.getByRole('heading', { name: 'Nextext' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'status' })).toBeInTheDocument()
  expect(screen.getByText('page-body')).toBeInTheDocument()
})

test('pins the header to the top with an opaque background so it stays visible while scrolling', () => {
  render(<Shell title="Nextext">body</Shell>)
  // The <header> landmark maps to role="banner".
  expect(screen.getByRole('banner')).toHaveClass('sticky', 'top-0', 'bg-background')
})

test('merges a caller className onto the root wrapper', () => {
  const { container } = render(<Shell title="X" className="custom-root">body</Shell>)
  expect(container.firstChild).toHaveClass('min-h-full', 'custom-root')
})
