import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ForceGraph, type ForceGraphHandle } from './ForceGraph'

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

  it('fit-to-view recenters after panning/zooming', () => {
    const { container } = render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} />)
    const g = container.querySelector('svg > g')
    const before = g?.getAttribute('transform')

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))

    const fitButton = screen.getByRole('button', { name: 'Fit' })
    expect(() => fireEvent.click(fitButton)).not.toThrow()

    const after = g?.getAttribute('transform')
    expect(after).not.toBe(before)
  })

  it('fit-to-view is a no-op when there are no nodes', () => {
    render(<ForceGraph nodes={[]} edges={[]} nodeStyles={STYLES} />)
    const fitButton = screen.getByRole('button', { name: 'Fit' })
    expect(() => fireEvent.click(fitButton)).not.toThrow()
  })

  it('renders a background-color halo behind node labels', () => {
    render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} />)
    const alphaText = screen.getByRole('button', { name: /Alpha/ }).querySelector('text')
    expect(alphaText?.getAttribute('class')).toContain('stroke-background')
    expect(alphaText?.style.paintOrder).toBe('stroke')
  })

  it('shows the full untruncated label in a native title tooltip', () => {
    const longLabel = 'A Very Long Node Label That Exceeds Twenty Four Characters'
    const nodes = [{ id: 'z', label: longLabel, kind: 'author' }]
    render(<ForceGraph nodes={nodes} edges={[]} nodeStyles={STYLES} />)
    const group = screen.getByRole('button', { name: new RegExp(longLabel) })
    const title = group.querySelector('title')
    expect(title).not.toBeNull()
    expect(title?.textContent).toBe(`${longLabel} (author)`)
    expect(group.firstElementChild?.tagName.toLowerCase()).toBe('title')
  })

  it('apiRef exposes current positions for every node', () => {
    const ref = { current: null as ForceGraphHandle | null }
    render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} apiRef={ref} />)
    const positions = ref.current?.getPositions()
    expect(positions).toBeDefined()
    for (const n of NODES) {
      const p = positions![n.id]
      expect(p).toBeDefined()
      expect(Number.isFinite(p.x)).toBe(true)
      expect(Number.isFinite(p.y)).toBe(true)
    }
  })

  it('getPositions returns a snapshot, not a live reference', () => {
    const ref = { current: null as ForceGraphHandle | null }
    render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} apiRef={ref} />)
    const first = ref.current!.getPositions()
    first.a.x = 999999
    first.a.y = 999999
    const second = ref.current!.getPositions()
    expect(second.a.x).not.toBe(999999)
    expect(second.a.y).not.toBe(999999)
  })
})
