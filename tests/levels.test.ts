import { describe, expect, it } from 'vitest'
import { buildLevel } from '../src/game/levels'
import { studGrid } from '../src/components/brickKit'

const studCount = (id: number) => {
  const l = buildLevel(id)
  return [...l.statics, ...l.decor].filter(b => b.visible !== false && b.studs !== false).reduce((n, b) => n + studGrid(b.size[0], b.size[2]).length, 0)
}

describe('繪製預算', () => {
  it.each([1, 2, 3, 4, 5])('關卡 %i 的凸點數量維持在預算內（避免低階 GPU 卡頓）', id => {
    expect(studCount(id)).toBeLessThan(9000)
  })
  it('凸點排列：每 1x1 一顆，且置中', () => {
    expect(studGrid(2, 4)).toHaveLength(8)
    const g = studGrid(3, 1)
    expect(g.map(([x]) => x)).toEqual([-1, 0, 1])
  })
})
