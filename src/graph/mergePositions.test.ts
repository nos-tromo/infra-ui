import { describe, expect, it } from 'vitest'
import { seedPositions } from './mergePositions'

const CX = 480
const CY = 310

describe('seedPositions', () => {
  it('keeps previous positions for existing ids', () => {
    const prev = new Map([['a', { x: 10, y: 20 }]])
    const out = seedPositions([{ id: 'a' }], [], prev, CX, CY)
    expect(out.get('a')).toEqual({ x: 10, y: 20 })
  })

  it('seeds a new node near an already-placed neighbor', () => {
    const prev = new Map([['a', { x: 100, y: 100 }]])
    const out = seedPositions(
      [{ id: 'a' }, { id: 'b' }],
      [{ source: 'a', target: 'b' }],
      prev,
      CX,
      CY
    )
    const b = out.get('b')!
    expect(Math.hypot(b.x - 100, b.y - 100)).toBeLessThanOrEqual(30.001)
    expect(Math.hypot(b.x - 100, b.y - 100)).toBeGreaterThan(0)
  })

  it('two new neighbors of the same anchor get distinct positions', () => {
    const prev = new Map([['a', { x: 0, y: 0 }]])
    const out = seedPositions(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      [
        { source: 'a', target: 'b' },
        { source: 'a', target: 'c' }
      ],
      prev,
      CX,
      CY
    )
    expect(out.get('b')).not.toEqual(out.get('c'))
  })

  it('falls back to phyllotaxis for unconnected new nodes', () => {
    const out = seedPositions([{ id: 'x' }, { id: 'y' }], [], new Map(), CX, CY)
    expect(out.get('x')).toBeDefined()
    expect(out.get('y')).toBeDefined()
    expect(out.get('x')).not.toEqual(out.get('y'))
  })

  it('is deterministic', () => {
    const args = [
      [{ id: 'a' }, { id: 'b' }],
      [{ source: 'a', target: 'b' }],
      new Map([['a', { x: 5, y: 5 }]]),
      CX,
      CY
    ] as const
    expect(seedPositions(...args)).toEqual(seedPositions(...args))
  })
})
