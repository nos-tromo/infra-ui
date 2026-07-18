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

  it('click selects a node (replacing any existing selection)', () => {
    const onSelectionChange = vi.fn()
    render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedIds={['b']}
        onSelectionChange={onSelectionChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Alpha/ }))
    expect(onSelectionChange).toHaveBeenCalledWith(['a'])
  })

  it('shift+click toggles a node into the selection', () => {
    const onSelectionChange = vi.fn()
    render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedIds={['b']}
        onSelectionChange={onSelectionChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Alpha/ }), { shiftKey: true })
    expect(onSelectionChange).toHaveBeenCalledWith(['b', 'a'])
  })

  it('shift+click toggles a node out of the selection', () => {
    const onSelectionChange = vi.fn()
    render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedIds={['a', 'b']}
        onSelectionChange={onSelectionChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Alpha/ }), { shiftKey: true })
    expect(onSelectionChange).toHaveBeenCalledWith(['b'])
  })

  it('keyboard Enter/Space still plain-selects even with multiple selected', () => {
    const onSelectionChange = vi.fn()
    render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedIds={['a', 'b']}
        onSelectionChange={onSelectionChange}
      />
    )
    fireEvent.keyDown(screen.getByRole('button', { name: /Alpha/ }), { key: 'Enter' })
    expect(onSelectionChange).toHaveBeenCalledWith(['a'])
  })

  it('shows the Expand button only when exactly one node is selected', () => {
    const onExpand = vi.fn()
    const { rerender } = render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedIds={['a']}
        onExpandNode={onExpand}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Expand node' }))
    expect(onExpand).toHaveBeenCalledWith('a')

    rerender(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedIds={['a', 'b']}
        onExpandNode={onExpand}
      />
    )
    expect(screen.queryByRole('button', { name: 'Expand node' })).toBeNull()
  })

  it('double-click expands', () => {
    const onExpand = vi.fn()
    render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} onExpandNode={onExpand} />)
    fireEvent.doubleClick(screen.getByRole('button', { name: /Beta/ }))
    expect(onExpand).toHaveBeenCalledWith('b')
  })

  it('hides the Expand button when onExpandNode is not provided', () => {
    render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} selectedIds={['a']} />)
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

  it('uses labelColor for label text while the circle keeps color', () => {
    const styles = {
      author: { color: '#7c3aed', labelColor: '#a78bfa' },
      topic: { color: '#4ade80' }
    }
    render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={styles} />)
    const alphaGroup = screen.getByRole('button', { name: /Alpha/ })
    const alphaText = alphaGroup.querySelector('text')
    const alphaCircle = alphaGroup.querySelector('circle')
    expect(alphaText?.getAttribute('fill')).toBe('#a78bfa')
    expect(alphaCircle?.getAttribute('fill')).toBe('#7c3aed')

    const betaGroup = screen.getByRole('button', { name: /Beta/ })
    const betaText = betaGroup.querySelector('text')
    // No labelColor set — falls back to color.
    expect(betaText?.getAttribute('fill')).toBe('#4ade80')
  })

  it('clicking the background clears selection', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedIds={['a']}
        onSelectionChange={onSelectionChange}
      />
    )
    const bgRect = container.querySelector('svg > rect')!
    fireEvent.pointerDown(bgRect, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(bgRect, { clientX: 100, clientY: 100 })
    expect(onSelectionChange).toHaveBeenCalledWith([])
  })

  it('does not clear selection when the background pointer moved (a pan, not a click)', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedIds={['a']}
        onSelectionChange={onSelectionChange}
      />
    )
    const bgRect = container.querySelector('svg > rect')!
    fireEvent.pointerDown(bgRect, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(bgRect, { clientX: 140, clientY: 140 })
    expect(onSelectionChange).not.toHaveBeenCalledWith([])
  })

  it('plain background drag pans without changing selection', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedIds={['a']}
        onSelectionChange={onSelectionChange}
      />
    )
    const g = container.querySelector('svg > g')
    const before = g?.getAttribute('transform')
    const bgRect = container.querySelector('svg > rect')!
    fireEvent.pointerDown(bgRect, { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(bgRect, { clientX: 160, clientY: 160 })
    fireEvent.pointerUp(bgRect, { clientX: 160, clientY: 160 })
    expect(g?.getAttribute('transform')).not.toBe(before)
    expect(onSelectionChange).not.toHaveBeenCalled()
  })

  it('shift+drag marquee-selects nodes within the drawn rectangle', () => {
    const ref = { current: null as ForceGraphHandle | null }
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedIds={['b']}
        onSelectionChange={onSelectionChange}
        apiRef={ref}
      />
    )
    const positions = ref.current!.getPositions()
    const svg = container.querySelector('svg')!
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 960, height: 620 }) as DOMRect

    const minX = Math.min(positions.a.x, positions.b.x) - 20
    const minY = Math.min(positions.a.y, positions.b.y) - 20
    const maxX = Math.max(positions.a.x, positions.b.x) + 20
    const maxY = Math.max(positions.a.y, positions.b.y) + 20

    const bgRect = container.querySelector('svg > rect')!
    fireEvent.pointerDown(bgRect, { clientX: minX, clientY: minY, shiftKey: true })
    fireEvent.pointerMove(bgRect, { clientX: maxX, clientY: maxY, shiftKey: true })

    // While dragging, a marquee rect is rendered inside the transform group.
    const g = container.querySelector('svg > g')!
    expect(g.querySelector('rect')).not.toBeNull()

    fireEvent.pointerUp(bgRect, { clientX: maxX, clientY: maxY, shiftKey: true })

    expect(onSelectionChange).toHaveBeenCalledWith(expect.arrayContaining(['a', 'b']))
    const [calledWith] = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1]
    expect(new Set(calledWith)).toEqual(new Set(['a', 'b']))

    // Marquee rect is gone after pointerup.
    expect(g.querySelector('rect')).toBeNull()
  })

  it('dim logic: with two nodes selected, a neighbor of either is not dimmed', () => {
    const nodes = [
      { id: 'a', label: 'Alpha', kind: 'author' },
      { id: 'b', label: 'Beta', kind: 'topic' },
      { id: 'c', label: 'Gamma', kind: 'author' },
      { id: 'd', label: 'Delta', kind: 'topic' }
    ]
    const edges = [
      { source: 'a', target: 'b', kind: 'mentions' },
      { source: 'c', target: 'd', kind: 'mentions' }
    ]
    render(
      <ForceGraph nodes={nodes} edges={edges} nodeStyles={STYLES} selectedIds={['a', 'c']} />
    )
    const betaGroup = screen.getByRole('button', { name: /Beta/ })
    const deltaGroup = screen.getByRole('button', { name: /Delta/ })
    expect(betaGroup.getAttribute('opacity')).toBe('1')
    expect(deltaGroup.getAttribute('opacity')).toBe('1')
  })

  it('aria-pressed reflects set membership', () => {
    render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} selectedIds={['a', 'b']} />)
    expect(screen.getByRole('button', { name: /Alpha/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: /Beta/ }).getAttribute('aria-pressed')).toBe('true')
  })

  it('shows a singular Remove button for one selected node and fires onDeleteNodes', () => {
    const onDeleteNodes = vi.fn()
    render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedIds={['a']}
        onDeleteNodes={onDeleteNodes}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove node' }))
    expect(onDeleteNodes).toHaveBeenCalledWith(['a'])
  })

  it('shows a count Remove label for 3 selected nodes and fires with the full set', () => {
    const onDeleteNodes = vi.fn()
    const nodes = [
      { id: 'a', label: 'Alpha', kind: 'author' },
      { id: 'b', label: 'Beta', kind: 'topic' },
      { id: 'c', label: 'Gamma', kind: 'author' }
    ]
    render(
      <ForceGraph
        nodes={nodes}
        edges={[]}
        nodeStyles={STYLES}
        selectedIds={['a', 'b', 'c']}
        onDeleteNodes={onDeleteNodes}
      />
    )
    const button = screen.getByRole('button', { name: 'Remove 3 nodes' })
    fireEvent.click(button)
    expect(onDeleteNodes).toHaveBeenCalledWith(['a', 'b', 'c'])
  })

  it('Backspace deletes the full selected set', () => {
    const onDeleteNodes = vi.fn()
    render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedIds={['a', 'b']}
        onDeleteNodes={onDeleteNodes}
      />
    )
    fireEvent.keyDown(window, { key: 'Backspace' })
    expect(onDeleteNodes).toHaveBeenCalledWith(['a', 'b'])
  })

  it('Backspace inside an input does not delete the selection', () => {
    const onDeleteNodes = vi.fn()
    render(
      <div>
        <input data-testid="text-input" />
        <ForceGraph
          nodes={NODES}
          edges={EDGES}
          nodeStyles={STYLES}
          selectedIds={['a']}
          onDeleteNodes={onDeleteNodes}
        />
      </div>
    )
    const input = screen.getByTestId('text-input')
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(onDeleteNodes).not.toHaveBeenCalled()
  })

  it('hides the Remove button and ignores Backspace when onDeleteNodes is not provided', () => {
    render(<ForceGraph nodes={NODES} edges={EDGES} nodeStyles={STYLES} selectedIds={['a']} />)
    expect(screen.queryByRole('button', { name: 'Remove node' })).toBeNull()
    expect(() => fireEvent.keyDown(window, { key: 'Backspace' })).not.toThrow()
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

  it('shift+drag marquee cancelled (pointercancel) clears marquee rect without selection', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        selectedIds={['b']}
        onSelectionChange={onSelectionChange}
      />
    )
    const g = container.querySelector('svg > g')!
    const bgRect = container.querySelector('svg > rect')!

    // Start a marquee (shift+pointerdown + pointermove)
    fireEvent.pointerDown(bgRect, { clientX: 100, clientY: 100, shiftKey: true })
    fireEvent.pointerMove(bgRect, { clientX: 150, clientY: 150, shiftKey: true })

    // Marquee rect should be visible now
    expect(g.querySelector('rect')).not.toBeNull()

    // Fire pointercancel
    fireEvent.pointerCancel(bgRect)

    // Marquee rect should be cleared
    expect(g.querySelector('rect')).toBeNull()

    // onSelectionChange should NOT have been called (no selection committed)
    expect(onSelectionChange).not.toHaveBeenCalled()
  })

  it('node drag cancelled (pointercancel) releases node without selection change', () => {
    const onSelectionChange = vi.fn()
    render(
      <ForceGraph
        nodes={NODES}
        edges={EDGES}
        nodeStyles={STYLES}
        onSelectionChange={onSelectionChange}
      />
    )
    const nodeGroup = screen.getByRole('button', { name: /Alpha/ })

    // Start dragging a node
    fireEvent.pointerDown(nodeGroup, { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(nodeGroup, { clientX: 150, clientY: 150 })

    // Fire pointercancel
    fireEvent.pointerCancel(nodeGroup)

    // onSelectionChange should NOT have been called (drag was not a click)
    expect(onSelectionChange).not.toHaveBeenCalled()
  })
})
