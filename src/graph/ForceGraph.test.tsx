import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ForceGraph } from './ForceGraph'

const NODES = [
  { id: 'a', label: 'Alpha', kind: 'author' },
  { id: 'b', label: 'Beta', kind: 'topic', size: 4 }
]
const EDGES = [{ source: 'a', target: 'b', kind: 'mentions', directed: true, weight: 2 }]
const STYLES = { author: { color: '#7c3aed' }, topic: { color: '#4ade80' } }

describe('ForceGraph', () => {
  it('renders one circle per node and one line per edge', () => {
    const { container } = render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} />)
    expect(container.querySelectorAll('g[role="button"]')).toHaveLength(2)
    expect(container.querySelectorAll('line')).toHaveLength(1)
  })

  it('node labels use their kind color, not the edge grey', () => {
    render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} />)
    const alphaText = screen.getByRole('button', { name: /Alpha/ }).querySelector('text')
    const betaText = screen.getByRole('button', { name: /Beta/ }).querySelector('text')
    expect(alphaText?.getAttribute('fill')).toBe('#7c3aed')
    expect(betaText?.getAttribute('fill')).toBe('#4ade80')
    expect(alphaText?.getAttribute('class')).not.toContain('fill-muted-foreground')
    expect(betaText?.getAttribute('class')).not.toContain('fill-muted-foreground')
  })

  it('draws an arrowhead marker on directed edges only', () => {
    const { container } = render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} />)
    expect(container.querySelector('line')?.getAttribute('marker-end')).toBe('url(#fg-arrow)')
    const { container: c2 } = render(
      <ForceGraph
        nodes={NODES}
        edges={[{ source: 'a', target: 'b', kind: 'friends' }]}
        nodeStyles={STYLES}
      />
    )
    expect(c2.querySelector('line')?.getAttribute('marker-end')).toBeNull()
  })

  it('click selects a node', () => {
    const onSelect = vi.fn()
    render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} onSelectNode={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /Alpha/ }))
    expect(onSelect).toHaveBeenCalledWith('a')
  })

  it('shows the Expand button for the selected node and fires onExpandNode', () => {
    const onExpand = vi.fn()
    render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedId="a"
        onExpandNode={onExpand}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Expand node' }))
    expect(onExpand).toHaveBeenCalledWith('a')
  })

  it('double-click expands', () => {
    const onExpand = vi.fn()
    render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} onExpandNode={onExpand} />)
    fireEvent.doubleClick(screen.getByRole('button', { name: /Beta/ }))
    expect(onExpand).toHaveBeenCalledWith('b')
  })

  it('hides the Expand button when onExpandNode is not provided', () => {
    render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} selectedId="a" />)
    expect(screen.queryByRole('button', { name: 'Expand node' })).toBeNull()
  })

  it('renders the legend from the prop', () => {
    render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        legend={[{ kind: 'author', label: 'Authors' }]}
      />
    )
    expect(screen.getByText('Authors')).toBeInTheDocument()
  })

  it('grows without unmounting existing nodes (merge path)', () => {
    const { container, rerender } = render(
      <ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} />
    )
    rerender(
      <ForceGraph
        nodes={[...NODES, { id: 'c', label: 'Gamma', kind: 'author' }]}
        edges={[...EDGES, { source: 'a', target: 'c', kind: 'mentions' }]}
        nodeStyles={STYLES}
      />
    )
    expect(container.querySelectorAll('g[role="button"]')).toHaveLength(3)
  })

  it('uses translated labels when provided', () => {
    render(
      <ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} labels={{ reset: 'Zurücksetzen' }} />
    )
    expect(screen.getByRole('button', { name: 'Zurücksetzen' })).toBeInTheDocument()
  })
})
