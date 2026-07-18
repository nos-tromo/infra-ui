/**
 * Seed layout positions for a (possibly grown) node set.
 *
 * Existing nodes keep their previous positions so an incremental expansion
 * never re-scrambles the layout the user is looking at; new nodes bloom out
 * of an already-placed neighbor (deterministic index-derived angle) or, when
 * unconnected, take fresh phyllotaxis slots around the center.
 */
import { phyllotaxisSeed } from './forceGraph'

const BLOOM_RADIUS = 30
const GOLDEN = Math.PI * (3 - Math.sqrt(5))

export function seedPositions(
  nodes: readonly { id: string }[],
  edges: readonly { source: string; target: string }[],
  previous: ReadonlyMap<string, { x: number; y: number }>,
  centerX: number,
  centerY: number
): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>()
  const neighborOf = new Map<string, string>()
  for (const e of edges) {
    if (previous.has(e.source) && !previous.has(e.target) && !neighborOf.has(e.target))
      neighborOf.set(e.target, e.source)
    if (previous.has(e.target) && !previous.has(e.source) && !neighborOf.has(e.source))
      neighborOf.set(e.source, e.target)
  }

  const orphans: string[] = []
  let bloomIndex = 0
  for (const n of nodes) {
    const prev = previous.get(n.id)
    if (prev) {
      out.set(n.id, { x: prev.x, y: prev.y })
      continue
    }
    const anchorId = neighborOf.get(n.id)
    const anchor = anchorId ? previous.get(anchorId) : undefined
    if (anchor) {
      const theta = bloomIndex * GOLDEN
      bloomIndex += 1
      out.set(n.id, {
        x: anchor.x + BLOOM_RADIUS * Math.cos(theta),
        y: anchor.y + BLOOM_RADIUS * Math.sin(theta)
      })
      continue
    }
    orphans.push(n.id)
  }

  // Unconnected newcomers: fresh spiral slots offset past the already-used
  // count so they do not stack onto slots earlier nodes may occupy.
  const base = out.size
  const spiral = phyllotaxisSeed(base + orphans.length, centerX, centerY, 30)
  orphans.forEach((id, i) => out.set(id, spiral[base + i]))
  return out
}
