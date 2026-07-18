import { describe, expect, it } from 'vitest'
import { createForceSimulation, phyllotaxisSeed, type ForceNode } from './forceGraph'

function mkNodes(n: number): ForceNode[] {
  const seeds = phyllotaxisSeed(n, 0, 0)
  return seeds.map((s, i) => ({ id: `n${i}`, x: s.x, y: s.y, vx: 0, vy: 0, r: 10 }))
}

describe('phyllotaxisSeed', () => {
  it('generates the requested count, deterministically', () => {
    const a = phyllotaxisSeed(5, 100, 50)
    const b = phyllotaxisSeed(5, 100, 50)
    expect(a).toHaveLength(5)
    expect(a).toEqual(b)
  })

  it('spreads points apart (no two coincide)', () => {
    const pts = phyllotaxisSeed(20, 0, 0)
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        expect(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)).toBeGreaterThan(1)
  })
})

describe('createForceSimulation', () => {
  it('settles below alphaMin after enough ticks', () => {
    const sim = createForceSimulation(mkNodes(6), [
      { source: 'n0', target: 'n1', weight: 1 },
      { source: 'n1', target: 'n2', weight: 1 }
    ])
    for (let i = 0; i < 500 && !sim.isSettled(); i++) sim.tick()
    expect(sim.isSettled()).toBe(true)
  })

  it('is deterministic: same inputs, same final positions', () => {
    const run = () => {
      const sim = createForceSimulation(mkNodes(8), [{ source: 'n0', target: 'n7', weight: 2 }])
      for (let i = 0; i < 300; i++) sim.tick()
      return sim.nodes.map((n) => [n.x, n.y])
    }
    expect(run()).toEqual(run())
  })

  it('pins a fixed node and releases it', () => {
    const sim = createForceSimulation(mkNodes(4), [])
    sim.fixNode('n2', 123, 456)
    sim.tick()
    const n2 = sim.nodeById('n2')!
    expect(n2.x).toBe(123)
    expect(n2.y).toBe(456)
    sim.releaseNode('n2')
    expect(n2.fx).toBeNull()
    expect(n2.fy).toBeNull()
  })

  it('reheat raises alpha so a settled sim moves again', () => {
    const sim = createForceSimulation(mkNodes(3), [])
    for (let i = 0; i < 500; i++) sim.tick()
    expect(sim.isSettled()).toBe(true)
    sim.reheat()
    expect(sim.isSettled()).toBe(false)
  })

  it('setOptions changes live behavior (wider linkDistance spreads endpoints)', () => {
    const mk = () =>
      createForceSimulation(mkNodes(2), [{ source: 'n0', target: 'n1', weight: 1 }])
    const near = mk()
    for (let i = 0; i < 400; i++) near.tick()
    const far = mk()
    far.setOptions({ linkDistance: 300 })
    for (let i = 0; i < 400; i++) far.tick()
    const dist = (s: ReturnType<typeof mk>) => {
      const a = s.nodeById('n0')!
      const b = s.nodeById('n1')!
      return Math.hypot(a.x - b.x, a.y - b.y)
    }
    expect(dist(far)).toBeGreaterThan(dist(near))
  })

  it('drops links whose endpoints are missing or self-referential', () => {
    const sim = createForceSimulation(mkNodes(2), [
      { source: 'n0', target: 'ghost', weight: 1 },
      { source: 'n1', target: 'n1', weight: 1 }
    ])
    // Must not throw while ticking with the bogus links filtered out.
    for (let i = 0; i < 50; i++) sim.tick()
    expect(sim.nodes).toHaveLength(2)
  })
})
