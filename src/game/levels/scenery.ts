import { BRICK_H, PLATE_H, type BrickSpec } from '../types'
import { C, CLASSIC } from '../colors'

const deco = (pos: BrickSpec['pos'], size: BrickSpec['size'], color: string, studs = true): BrickSpec =>
  ({ pos, size, color, studs, collide: false })

/** 樂高樹：棕色樹幹 + 由大到小堆疊的綠色積木 */
export function tree(x: number, z: number, baseY: number, scale = 1): BrickSpec[] {
  const out: BrickSpec[] = []
  out.push(deco([x, baseY, z], [1, BRICK_H * 2 * scale, 1], C.brown, false))
  let y = baseY + BRICK_H * 2 * scale
  for (const w of [5, 4, 3, 2].map(v => Math.max(1, Math.round(v * scale)))) {
    out.push(deco([x, y, z], [w, BRICK_H, w], w % 2 ? C.green : C.darkGreen, w === 2 || w === 1))
    y += BRICK_H
  }
  return out
}

/** 白色薄片堆成的雲 */
export function cloud(x: number, y: number, z: number, r: () => number): BrickSpec[] {
  const out: BrickSpec[] = []
  const n = 3 + Math.floor(r() * 3)
  for (let i = 0; i < n; i++) {
    const w = 3 + Math.floor(r() * 5)
    const d = 2 + Math.floor(r() * 3)
    out.push(deco([x + (r() - 0.5) * 8, y + (i % 2) * PLATE_H, z + (r() - 0.5) * 4], [w, PLATE_H * 2, d], C.white, i === n - 1))
  }
  return out
}

/** 隨機彩色積木塔 */
export function tower(x: number, z: number, baseY: number, levels: number, r: () => number): BrickSpec[] {
  const out: BrickSpec[] = []
  let y = baseY
  let w = 3 + Math.floor(r() * 2)
  for (let i = 0; i < levels; i++) {
    const color = CLASSIC[Math.floor(r() * CLASSIC.length)]
    out.push(deco([x + (r() - 0.5) * 0.5, y, z + (r() - 0.5) * 0.5], [w, BRICK_H, w], color, i === levels - 1))
    y += BRICK_H
    if (r() < 0.3 && w > 2) w -= 1
  }
  return out
}
