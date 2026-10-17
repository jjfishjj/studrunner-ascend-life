import { describe, expect, it } from 'vitest'
import { buildLevel } from '../src/game/levels'
import { studGrid } from '../src/components/brickKit'

describe('五階地景與音景對應', () => {
  const expected: Record<number, string[]> = {
    1: ['forest', 'river', 'birds'],
    2: ['sea', 'birds'],
    3: ['river', 'falls', 'forest'],
    4: ['cosmos', 'wind', 'night'],
    5: ['sea', 'falls', 'jungle', 'river', 'birds'],
  }
  it.each([1, 2, 3, 4, 5])('關卡 %i 有對應的自然音景區與四個筆記地標', id => {
    const level = buildLevel(id)
    expect(level.nature?.zones.length).toBeGreaterThan(0)
    const kinds = new Set(level.nature?.zones.map(z => z.kind))
    for (const kind of expected[id]) expect(kinds).toContain(kind)
    expect(level.notes).toHaveLength(4)
  })
  it('河谷瀑布與合一迷宮包含可見的程序自然景物', () => {
    expect(buildLevel(3).nature?.falls.length).toBeGreaterThanOrEqual(8)
    expect(buildLevel(5).nature?.falls.length).toBeGreaterThanOrEqual(3)
    expect(buildLevel(5).nature?.waves.length).toBeGreaterThanOrEqual(1)
  })
})

const studCount = (id: number) => {
  const l = buildLevel(id)
  return [...l.statics, ...l.decor].filter(b => b.visible !== false && b.studs !== false).reduce((n, b) => n + studGrid(b.size[0], b.size[2]).length, 0)
}

describe('繪製預算', () => {
  it.each([1, 2, 3, 4, 5, 6])('關卡 %i 的凸點數量維持在預算內（避免低階 GPU 卡頓）', id => {
    expect(studCount(id)).toBeLessThan(9000)
  })
  it('凸點排列：每 1x1 一顆，且置中', () => {
    expect(studGrid(2, 4)).toHaveLength(8)
    const g = studGrid(3, 1)
    expect(g.map(([x]) => x)).toEqual([-1, 0, 1])
  })
})
