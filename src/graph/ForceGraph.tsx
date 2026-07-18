import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { cn } from '../cn'
import {
  createForceSimulation,
  type ForceLink,
  type ForceNode
} from './forceSimulation'
import { seedPositions } from './mergePositions'

const WIDTH = 960
const HEIGHT = 620
const CENTER_X = WIDTH / 2
const CENTER_Y = HEIGHT / 2
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const DRAG_THRESHOLD = 4 // px of movement before a press counts as a drag
// Edge-length ("spread") slider: bounds + the base spacing it scales. The bases
// mirror forceGraph's DEFAULTS (linkDistance 70, repulsion 320); a multiplier of
// 1 reproduces today's density, higher values push nodes farther apart. The max
// is deliberately generous (8×) so dense graphs can be pulled fully apart — pair
// it with zoom-out to fit the widened layout on screen.
const MIN_SPREAD = 0.5
const MAX_SPREAD = 8
const BASE_LINK_DISTANCE = 70
const BASE_REPULSION = 320

export interface ForceGraphNode {
  id: string
  label: string
  /** Style-map key; also shown in the legend. */
  kind: string
  /** Relative size weight (≥1); mapped to radius by sqrt scale. */
  size?: number
}

export interface ForceGraphEdge {
  source: string
  target: string
  kind: string
  /** Draw an arrowhead source → target. */
  directed?: boolean
  /** Stroke-width weight (≥1). */
  weight?: number
}

export interface ForceGraphNodeStyle {
  /** SVG fill for the node circle (hex/rgb — consumer-supplied palette). */
  color: string
  /** SVG fill for the node label text; defaults to `color`. Pick a lighter
   *  variant when `color` is too dark to read as text. */
  labelColor?: string
}

export interface ForceGraphEdgeStyle {
  dashed?: boolean
  /** 0–1 stroke opacity when not dimmed (default 0.6). */
  opacity?: number
}

export interface ForceGraphHandle {
  /** Live layout snapshot (id → x/y) of every currently-visible node, e.g. for baking a layout into an export. */
  getPositions(): Record<string, { x: number; y: number }>
}

export interface ForceGraphLabels {
  minEdges: string // "Min edges"
  edgeLength: string // "Edge length"
  zoom: string // "Zoom"
  reset: string // "Reset"
  fit: string // "Fit"
  expandSelected: string // "Expand node"
  maximize: string // "Expand graph"
  minimize: string // "Collapse graph"
}

export interface ForceGraphProps {
  nodes: ForceGraphNode[]
  edges: ForceGraphEdge[]
  nodeStyles: Record<string, ForceGraphNodeStyle>
  edgeStyles?: Record<string, ForceGraphEdgeStyle>
  selectedId?: string | null
  /** Called with a node id on selection, or `null` when the background is
   *  clicked to clear the selection. */
  onSelectNode?: (id: string | null) => void
  /** When set, selection shows an Expand button and double-click expands. */
  onExpandNode?: (id: string) => void
  /** Node id currently being expanded (renders its Expand button disabled). */
  expandingId?: string | null
  /** Status line above the canvas; consumer formats counts + hints. */
  statusText?: string
  /** Legend entries; omit to hide the legend. */
  legend?: Array<{ kind: string; label: string }>
  /** Control captions — consumer passes translated strings; en defaults built in. */
  labels?: Partial<ForceGraphLabels>
  /** Canvas height class when not maximized (default 'h-[60vh]'). */
  heightClassName?: string
  className?: string
  /** Imperative access to the live layout, e.g. for exports. */
  apiRef?: React.Ref<ForceGraphHandle>
}

const DEFAULT_LABELS: ForceGraphLabels = {
  minEdges: 'Min edges',
  edgeLength: 'Edge length',
  zoom: 'Zoom',
  reset: 'Reset',
  fit: 'Fit',
  expandSelected: 'Expand node',
  maximize: 'Expand graph',
  minimize: 'Collapse graph'
}

function radiusForSize(size: number | undefined): number {
  return Math.min(34, 7 + Math.sqrt(Math.max(1, size ?? 1)) * 2.4)
}

// Two-diagonal-arrows "expand to corners" glyph (lucide maximize-2).
function ExpandIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      {/* Diagonal ticks as <path>, not <line> — an SVG <line> tag would be
          indistinguishable from a graph edge to DOM queries like
          `querySelectorAll('line')`. */}
      <path d="M 21 3 L 14 10" />
      <path d="M 3 21 L 10 14" />
    </svg>
  )
}

// Arrows pointing inward "collapse" glyph (lucide minimize-2).
function CollapseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <path d="M 14 10 L 21 3" />
      <path d="M 3 21 L 10 14" />
    </svg>
  )
}

interface View {
  x: number
  y: number
  k: number
}

/**
 * Interactive, force-directed graph primitive. Nodes are draggable (with
 * collision), the canvas zooms (wheel) and pans (background drag), a click
 * selects a node, a double-click (or the Expand button) requests expansion,
 * and layouts merge incrementally — nodes already on screen keep their
 * position when the data set grows, instead of the whole graph re-seeding.
 * Rendering is plain SVG over the dependency-free {@link createForceSimulation}
 * layout.
 *
 * `nodes`/`edges` feed the simulation-building `useMemo` directly, so callers
 * must pass referentially stable arrays per logical data change (memoize the
 * mapper output on the API payload) — a fresh array identity every render
 * rebuilds and reseeds the simulation on every frame.
 */
export function ForceGraph({
  nodes,
  edges,
  nodeStyles,
  edgeStyles,
  selectedId,
  onSelectNode,
  onExpandNode,
  expandingId,
  statusText,
  legend,
  labels,
  heightClassName,
  className,
  apiRef
}: ForceGraphProps) {
  const L = { ...DEFAULT_LABELS, ...labels }

  const svgRef = useRef<SVGSVGElement | null>(null)

  // Edge-count (degree) filter: hide any node with fewer than `minDegree`
  // incident edges. Default 0 shows every node.
  const [minDegree, setMinDegree] = useState(0)

  // Edge-length multiplier from the "Edge length" slider; 1 = today's density.
  // Applied to the live sim's link rest-length + repulsion (see effect below).
  const [spread, setSpread] = useState(1)

  // In-app "maximize": grows the whole panel to a full-window overlay.
  const [isMaximized, setIsMaximized] = useState(false)

  // Incident-edge count per node id, from the full edge set.
  const degreeById = useMemo(() => {
    const deg = new Map<string, number>()
    for (const e of edges) {
      deg.set(e.source, (deg.get(e.source) ?? 0) + 1)
      deg.set(e.target, (deg.get(e.target) ?? 0) + 1)
    }
    return deg
  }, [edges])

  const maxDegree = useMemo(() => {
    let m = 0
    for (const n of nodes) m = Math.max(m, degreeById.get(n.id) ?? 0)
    return m
  }, [nodes, degreeById])

  // Keep the threshold valid when a smaller graph loads (e.g. a merge-mode
  // switch) so it never strands the view on an all-filtered, empty graph.
  useEffect(() => {
    setMinDegree((d) => Math.min(d, maxDegree))
  }, [maxDegree])

  const visibleNodes = useMemo(
    () =>
      minDegree <= 0 ? nodes : nodes.filter((n) => (degreeById.get(n.id) ?? 0) >= minDegree),
    [nodes, degreeById, minDegree]
  )

  const visibleEdges = useMemo(() => {
    if (minDegree <= 0) return edges
    const ids = new Set(visibleNodes.map((n) => n.id))
    return edges.filter((e) => ids.has(e.source) && ids.has(e.target))
  }, [edges, visibleNodes, minDegree])

  // Positions persist across sim rebuilds (data changes) so growth merges
  // into the existing layout instead of re-seeding it. Entries for departed nodes
  // are retained (negligible overhead at ≤ few-hundred-node scale) so re-appearing nodes keep their spot.
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())

  const sim = useMemo(() => {
    const seeds = seedPositions(visibleNodes, visibleEdges, positionsRef.current, CENTER_X, CENTER_Y)
    const simNodes: ForceNode[] = visibleNodes.map((n) => {
      const p = seeds.get(n.id)!
      return { id: n.id, x: p.x, y: p.y, vx: 0, vy: 0, r: radiusForSize(n.size) }
    })
    const simLinks: ForceLink[] = visibleEdges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight ?? 1
    }))
    return createForceSimulation(simNodes, simLinks, { centerX: CENTER_X, centerY: CENTER_Y })
  }, [visibleNodes, visibleEdges])

  // `frame` is bumped each animation step purely to re-render at the sim's
  // current positions; the authoritative state lives on the mutated sim nodes.
  const [, setFrame] = useState(0)
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 })
  const draggingNodeRef = useRef<string | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(false)
  const panRef = useRef<{ startX: number; startY: number; view: View } | null>(null)
  const panMovedRef = useRef(false)
  const rafRef = useRef(0)
  const runningRef = useRef(false)

  // Start (or resume) the animation loop. It ticks until the layout settles and
  // no node is being dragged, then idles — drag handlers call this again to
  // re-kick it so neighbors spring while a node is moved. Guarded for
  // environments without requestAnimationFrame (tests render the seed layout).
  const runLoop = useCallback(() => {
    if (typeof requestAnimationFrame !== 'function' || runningRef.current) return
    runningRef.current = true
    const step = () => {
      // A few ticks per frame settles the layout in well under a second.
      for (let i = 0; i < 3; i++) sim.tick()
      // Snapshot positions so the next rebuild (data growth) can reuse them.
      for (const n of sim.nodes) positionsRef.current.set(n.id, { x: n.x, y: n.y })
      setFrame((f) => (f + 1) % 1_000_000)
      if (!sim.isSettled() || draggingNodeRef.current) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        runningRef.current = false
        rafRef.current = 0
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }, [sim])

  useEffect(() => {
    runLoop()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      runningRef.current = false
    }
  }, [runLoop])

  useImperativeHandle(
    apiRef,
    () => ({
      getPositions: () => {
        const out: Record<string, { x: number; y: number }> = {}
        for (const n of sim.nodes) out[n.id] = { x: n.x, y: n.y }
        return out
      }
    }),
    [sim]
  )

  // Apply the edge-length multiplier to the live simulation (no reseed): scale
  // link rest-length and repulsion together so clusters open up, not just
  // directly-linked pairs. Re-runs on a fresh graph (sim) and on slider moves.
  useEffect(() => {
    sim.setOptions({
      linkDistance: BASE_LINK_DISTANCE * spread,
      repulsion: BASE_REPULSION * spread
    })
    sim.reheat()
    runLoop()
  }, [sim, spread, runLoop])

  // While maximized: Escape exits, and body scroll is locked so the page behind
  // can't scroll under the overlay. Both are torn down on collapse/unmount.
  useEffect(() => {
    if (!isMaximized) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMaximized(false)
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isMaximized])

  // If the graph empties (e.g. collection switch) the overlay would otherwise
  // stay up while leaving body scroll locked — auto-collapse to keep the
  // teardown effect honest.
  useEffect(() => {
    if (nodes.length === 0) setIsMaximized(false)
  }, [nodes.length])

  /** Convert client (screen) coords to layout-space coords. */
  const screenToLayout = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      const w = rect.width || WIDTH
      const h = rect.height || HEIGHT
      const px = ((clientX - rect.left) / w) * WIDTH
      const py = ((clientY - rect.top) / h) * HEIGHT
      return { x: (px - view.x) / view.k, y: (py - view.y) / view.k }
    },
    [view]
  )

  // Wheel-zoom, bound as a *non-passive* native listener via a ref callback
  // rather than React's synthetic `onWheel`. React registers wheel listeners as
  // passive, so a synthetic handler's preventDefault() is a no-op and the page
  // scrolls behind the graph while zooming; a directly-attached
  // { passive: false } listener lets us cancel that default scroll. The
  // ref-callback form (with React 19's cleanup return) re-binds correctly if the
  // <svg> unmounts and remounts — e.g. an initially-empty collection later fills
  // in. setView's functional updater keeps the handler free of stale view state,
  // so it never needs re-binding on its own.
  const setSvgRef = useCallback((svg: SVGSVGElement | null) => {
    svgRef.current = svg
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = svg.getBoundingClientRect()
      const w = rect.width || WIDTH
      const h = rect.height || HEIGHT
      const px = ((e.clientX - rect.left) / w) * WIDTH
      const py = ((e.clientY - rect.top) / h) * HEIGHT
      setView((v) => {
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
        const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.k * factor))
        // Keep the layout point under the cursor stationary.
        const lx = (px - v.x) / v.k
        const ly = (py - v.y) / v.k
        return { k, x: px - lx * k, y: py - ly * k }
      })
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      svg.removeEventListener('wheel', onWheel)
      svgRef.current = null
    }
  }, [])

  const zoomBy = useCallback((factor: number) => {
    setView((v) => {
      const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.k * factor))
      // Zoom about the canvas center.
      const lx = (CENTER_X - v.x) / v.k
      const ly = (CENTER_Y - v.y) / v.k
      return { k, x: CENTER_X - lx * k, y: CENTER_Y - ly * k }
    })
  }, [])

  // Fit the current node set into the viewBox: bounding box over the sim's
  // live node positions (padded), scaled/centered so it fills WIDTH×HEIGHT.
  // No-op when there are no nodes (nothing to fit around).
  const fitToView = useCallback(() => {
    const simNodes = sim.nodes
    if (simNodes.length === 0) return
    const PAD = 24
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const n of simNodes) {
      minX = Math.min(minX, n.x - n.r)
      minY = Math.min(minY, n.y - n.r)
      maxX = Math.max(maxX, n.x + n.r)
      maxY = Math.max(maxY, n.y + n.r)
    }
    minX -= PAD
    minY -= PAD
    maxX += PAD
    maxY += PAD
    const w = Math.max(1, maxX - minX)
    const h = Math.max(1, maxY - minY)
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(WIDTH / w, HEIGHT / h)))
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    setView({ k, x: CENTER_X - cx * k, y: CENTER_Y - cy * k })
  }, [sim])

  // Reset every graph control back to its default: edge filter (min edges → 0),
  // edge length (→ 1x), and zoom/pan (→ home).
  const resetControls = useCallback(() => {
    setMinDegree(0)
    setSpread(1)
    setView({ x: 0, y: 0, k: 1 })
  }, [])

  // --- background pan ---
  const onBackgroundPointerDown = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      e.currentTarget.setPointerCapture?.(e.pointerId)
      panRef.current = { startX: e.clientX, startY: e.clientY, view }
      panMovedRef.current = false
    },
    [view]
  )

  const onBackgroundPointerMove = useCallback((e: React.PointerEvent<SVGRectElement>) => {
    const pan = panRef.current
    if (!pan) return
    if (Math.hypot(e.clientX - pan.startX, e.clientY - pan.startY) > DRAG_THRESHOLD) {
      panMovedRef.current = true
    }
    const svg = svgRef.current
    const rect = svg?.getBoundingClientRect()
    const w = rect?.width || WIDTH
    const h = rect?.height || HEIGHT
    const dx = ((e.clientX - pan.startX) / w) * WIDTH
    const dy = ((e.clientY - pan.startY) / h) * HEIGHT
    setView({ k: pan.view.k, x: pan.view.x + dx, y: pan.view.y + dy })
  }, [])

  const onBackgroundPointerUp = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      e.currentTarget.releasePointerCapture?.(e.pointerId)
      const pan = panRef.current
      const movedAtUp =
        pan != null && Math.hypot(e.clientX - pan.startX, e.clientY - pan.startY) > DRAG_THRESHOLD
      const wasClick = pan != null && !panMovedRef.current && !movedAtUp
      panRef.current = null
      if (wasClick) onSelectNode?.(null)
    },
    [onSelectNode]
  )

  // --- node drag ---
  const onNodePointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      e.stopPropagation()
      ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
      draggingNodeRef.current = id
      movedRef.current = false
      dragStartRef.current = { x: e.clientX, y: e.clientY }
      const p = screenToLayout(e.clientX, e.clientY)
      sim.fixNode(id, p.x, p.y)
      sim.reheat(0.3)
      runLoop()
    },
    [runLoop, screenToLayout, sim]
  )

  const onNodePointerMove = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (draggingNodeRef.current !== id) return
      // Ignore sub-threshold jitter so a plain click is not read as a drag.
      const start = dragStartRef.current
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > DRAG_THRESHOLD) {
        movedRef.current = true
      }
      const p = screenToLayout(e.clientX, e.clientY)
      sim.fixNode(id, p.x, p.y)
      sim.reheat(0.3)
      runLoop()
    },
    [runLoop, screenToLayout, sim]
  )

  const onNodePointerUp = useCallback(
    (e: React.PointerEvent, id: string) => {
      ;(e.currentTarget as Element).releasePointerCapture?.(e.pointerId)
      if (draggingNodeRef.current === id) {
        draggingNodeRef.current = null
        sim.releaseNode(id)
      }
    },
    [sim]
  )

  const handleSelect = useCallback(
    (id: string) => {
      // Suppress the click that ends a drag gesture.
      if (movedRef.current) {
        movedRef.current = false
        return
      }
      onSelectNode?.(id)
    },
    [onSelectNode]
  )

  // Highlight neighbors of the selected node so its relations stand out.
  const neighborIds = useMemo(() => {
    if (selectedId == null) return null
    const set = new Set<string>()
    for (const e of visibleEdges) {
      if (e.source === selectedId) set.add(e.target)
      else if (e.target === selectedId) set.add(e.source)
    }
    return set
  }, [visibleEdges, selectedId])

  const transform = `translate(${view.x} ${view.y}) scale(${view.k})`

  return (
    <div
      data-maximized={isMaximized}
      className={cn(
        'space-y-2',
        isMaximized && 'fixed inset-0 z-50 flex flex-col bg-background p-4',
        className
      )}
    >
      <div className="space-y-2">
        {statusText && <p className="text-sm text-muted-foreground">{statusText}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-2">
          <div className="flex items-center gap-1" role="group" aria-label="Minimum edges per node">
            <span className="text-xs text-muted-foreground">{L.minEdges}</span>
            <button
              type="button"
              aria-label="Decrease minimum edges"
              disabled={minDegree <= 0}
              onClick={() => setMinDegree((d) => Math.max(0, d - 1))}
              className="h-7 w-7 rounded-md border border-border text-sm leading-none disabled:opacity-40"
            >
              −
            </button>
            <span aria-live="polite" className="w-5 text-center text-xs tabular-nums">
              {minDegree}
            </span>
            <button
              type="button"
              aria-label="Increase minimum edges"
              disabled={minDegree >= maxDegree}
              onClick={() => setMinDegree((d) => Math.min(maxDegree, d + 1))}
              className="h-7 w-7 rounded-md border border-border text-sm leading-none disabled:opacity-40"
            >
              +
            </button>
          </div>

          <span aria-hidden="true" className="h-5 border-l border-border" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{L.edgeLength}</span>
            <input
              type="range"
              min={MIN_SPREAD}
              max={MAX_SPREAD}
              step={0.1}
              value={spread}
              onChange={(e) => setSpread(Number(e.target.value))}
              aria-label={L.edgeLength}
              title="Spread nodes apart to de-clutter a dense graph"
              className="w-28 cursor-pointer accent-primary"
            />
          </div>

          <span aria-hidden="true" className="h-5 border-l border-border" />

          <div className="flex items-center gap-1" role="group" aria-label="Zoom">
            <span className="text-xs text-muted-foreground">{L.zoom}</span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => zoomBy(1.25)}
              className="h-7 w-7 rounded-md border border-border text-sm leading-none"
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => zoomBy(1 / 1.25)}
              className="h-7 w-7 rounded-md border border-border text-sm leading-none"
            >
              −
            </button>
            <button
              type="button"
              aria-label={L.fit}
              onClick={fitToView}
              title="Fit graph to view"
              className="h-7 px-2 rounded-md border border-border text-xs"
            >
              {L.fit}
            </button>
          </div>

          <span aria-hidden="true" className="h-5 border-l border-border" />

          {/* Standalone (not part of the Zoom group): resets every control. */}
          <button
            type="button"
            onClick={resetControls}
            title="Reset min edges, edge length, and zoom"
            className="h-7 px-2 rounded-md border border-border text-xs"
          >
            {L.reset}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'relative rounded-md border border-border bg-background overflow-hidden',
          isMaximized && 'flex-1 min-h-0'
        )}
      >
        <svg
          ref={setSvgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={cn(
            'w-full touch-none select-none',
            isMaximized ? 'h-full' : (heightClassName ?? 'h-[60vh]')
          )}
          role="application"
          aria-label="Force-directed graph"
        >
          {/* Background capture rect for panning. */}
          <rect
            x={0}
            y={0}
            width={WIDTH}
            height={HEIGHT}
            fill="transparent"
            onPointerDown={onBackgroundPointerDown}
            onPointerMove={onBackgroundPointerMove}
            onPointerUp={onBackgroundPointerUp}
          />
          <g transform={transform}>
            <defs>
              <marker
                id="fg-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
                className="fill-muted-foreground"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" />
              </marker>
            </defs>
            {visibleEdges.map((e, i) => {
              const a = sim.nodeById(e.source)
              const b = sim.nodeById(e.target)
              if (!a || !b) return null
              const style = edgeStyles?.[e.kind]
              const incident = selectedId != null && (e.source === selectedId || e.target === selectedId)
              const dimmed = selectedId != null && !incident
              const dx = b.x - a.x
              const dy = b.y - a.y
              const dist = Math.hypot(dx, dy) || 1
              // Pull the tip back to the target's rim so the arrowhead stays visible.
              const tx = e.directed ? b.x - (dx / dist) * (b.r + 2) : b.x
              const ty = e.directed ? b.y - (dy / dist) * (b.r + 2) : b.y
              return (
                <line
                  key={`${e.source}->${e.target}:${e.kind}:${i}`}
                  x1={a.x}
                  y1={a.y}
                  x2={tx}
                  y2={ty}
                  className="stroke-muted-foreground"
                  strokeOpacity={dimmed ? 0.15 : (style?.opacity ?? 0.6)}
                  strokeWidth={Math.min(4, 0.6 + Math.log2((e.weight ?? 1) + 1)) / view.k}
                  strokeDasharray={style?.dashed ? `${4 / view.k} ${3 / view.k}` : undefined}
                  markerEnd={e.directed ? 'url(#fg-arrow)' : undefined}
                />
              )
            })}
            {visibleNodes.map((n) => {
              const sn = sim.nodeById(n.id)
              if (!sn) return null
              const isSelected = n.id === selectedId
              const isNeighbor = neighborIds?.has(n.id) ?? false
              const dimmed = selectedId != null && !isSelected && !isNeighbor
              const r = sn.r
              return (
                <g
                  key={n.id}
                  transform={`translate(${sn.x} ${sn.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${n.label} (${n.kind})`}
                  aria-pressed={isSelected}
                  className="cursor-pointer outline-none"
                  opacity={dimmed ? 0.35 : 1}
                  onPointerDown={(e) => onNodePointerDown(e, n.id)}
                  onPointerMove={(e) => onNodePointerMove(e, n.id)}
                  onPointerUp={(e) => onNodePointerUp(e, n.id)}
                  onClick={() => handleSelect(n.id)}
                  onDoubleClick={() => {
                    if (onExpandNode) onExpandNode(n.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectNode?.(n.id)
                    }
                  }}
                >
                  <title>{`${n.label} (${n.kind})`}</title>
                  <circle
                    r={r}
                    fill={nodeStyles[n.kind]?.color ?? 'currentColor'}
                    fillOpacity={isSelected ? 1 : 0.85}
                    className={isSelected ? 'stroke-foreground' : 'stroke-border'}
                    strokeWidth={(isSelected ? 3 : 1.5) / view.k}
                  />
                  <text
                    y={r + 11 / view.k}
                    textAnchor="middle"
                    fontSize={11 / view.k}
                    className="pointer-events-none stroke-background"
                    strokeWidth={3 / view.k}
                    strokeLinejoin="round"
                    style={{ paintOrder: 'stroke' }}
                    fill={nodeStyles[n.kind]?.labelColor ?? nodeStyles[n.kind]?.color ?? 'currentColor'}
                  >
                    {n.label.length > 24 ? `${n.label.slice(0, 23)}…` : n.label}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        <button
          type="button"
          aria-label={isMaximized ? L.minimize : L.maximize}
          aria-pressed={isMaximized}
          title={isMaximized ? L.minimize : L.maximize}
          onClick={() => setIsMaximized((m) => !m)}
          className="absolute left-2 top-2 z-10 rounded-md border border-border bg-background/90 p-1.5 text-muted-foreground hover:text-foreground"
        >
          {isMaximized ? <CollapseIcon /> : <ExpandIcon />}
        </button>

        {selectedId && onExpandNode && (
          <button
            type="button"
            disabled={expandingId === selectedId}
            onClick={() => onExpandNode(selectedId)}
            className="absolute bottom-2 left-2 z-10 rounded-md border border-border bg-background/90 px-2 py-1 text-xs text-foreground disabled:opacity-40"
          >
            {L.expandSelected}
          </button>
        )}

        {legend && legend.length > 0 && (
          <div className="absolute right-2 top-2 max-w-[12rem] rounded-md border border-border bg-background/90 p-2 text-xs space-y-1">
            <ul className="space-y-0.5">
              {legend.map(({ kind, label }) => (
                <li key={kind} className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: nodeStyles[kind]?.color ?? 'currentColor' }}
                  />
                  <span className="truncate">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
