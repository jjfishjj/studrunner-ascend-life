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

/** 以方形層疊出的「體素星球」；可選擇加上方形光環。 */
export function planet(x: number, y: number, z: number, radius: number, color: string, opts: { ring?: string; stripe?: string } = {}): BrickSpec[] {
  const out: BrickSpec[] = []
  const layerH = 0.8
  const n = Math.max(3, Math.round((radius * 2) / layerH))
  const widths: number[] = []
  for (let i = 0; i < n; i++) {
    const h = -radius + (i + 0.5) * layerH
    widths.push(Math.max(1, Math.round(2 * Math.sqrt(Math.max(0, radius * radius - h * h)))))
  }
  widths.forEach((w, i) => {
    const exposed = i === n - 1 || widths[i + 1] < w
    const stripe = opts.stripe && i % 4 === 2
    out.push(deco([x, y - radius + i * layerH, z], [w, layerH, w], stripe ? opts.stripe! : color, exposed && w <= 6))
  })
  if (opts.ring) {
    const o = radius * 1.25, t = 1.2
    const yy = y - 0.2
    out.push(deco([x, yy, z - o + t / 2], [o * 2, 0.4, t], opts.ring, false))
    out.push(deco([x, yy, z + o - t / 2], [o * 2, 0.4, t], opts.ring, false))
    out.push(deco([x - o + t / 2, yy, z], [t, 0.4, o * 2 - t * 2], opts.ring, false))
    out.push(deco([x + o - t / 2, yy, z], [t, 0.4, o * 2 - t * 2], opts.ring, false))
  }
  return out
}

/** 隨機散落的小星星（1x1 薄片）。 */
export function stars(count: number, spread: [number, number, number], center: [number, number, number], r: () => number): BrickSpec[] {
  const out: BrickSpec[] = []
  for (let i = 0; i < count; i++) {
    const big = r() < 0.12
    const s = big ? 1.4 : 0.8
    out.push(deco(
      [center[0] + (r() - 0.5) * spread[0], center[1] + (r() - 0.5) * spread[1], center[2] + (r() - 0.5) * spread[2]],
      [s, 0.4, s], r() < 0.7 ? C.white : C.yellow, false,
    ))
  }
  return out
}

const HEART = [
  '.XX...XX.',
  'XXXX.XXXX',
  'XXXXXXXXX',
  'XXXXXXXXX',
  '.XXXXXXX.',
  '..XXXXX..',
  '...XXX...',
  '....X....',
]
/** 立在地上的像素愛心牆（面向 +Z）。cell 為每格的寬度。 */
export function pixelHeart(cx: number, baseY: number, cz: number, cell: number, color: string, thick = 1.2): BrickSpec[] {
  const out: BrickSpec[] = []
  const rows = HEART.length
  HEART.forEach((row, ri) => {
    const y = baseY + (rows - 1 - ri) * BRICK_H
    let c = 0
    while (c < row.length) {
      if (row[c] !== 'X') { c++; continue }
      let e = c
      while (e + 1 < row.length && row[e + 1] === 'X') e++
      const len = e - c + 1
      const x = cx + ((c + e) / 2 - (row.length - 1) / 2) * cell
      out.push(deco([x, y, cz], [len * cell, BRICK_H, thick], color, ri === 0 || HEART[ri - 1].slice(c, e + 1).includes('.')))
      c = e + 1
    }
  })
  return out
}

/** 小房子：白牆、紅屋頂、藍色門。 */
export function house(x: number, z: number, baseY: number): BrickSpec[] {
  const out: BrickSpec[] = []
  out.push(deco([x, baseY, z], [6, BRICK_H * 2, 5], C.white, false))
  out.push(deco([x, baseY, z + 2.55], [1.2, BRICK_H * 1.6, 0.2], C.blue, false))
  out.push(deco([x - 1.8, baseY + 0.7, z + 2.55], [1, 1, 0.2], C.yellow, false))
  out.push(deco([x + 1.8, baseY + 0.7, z + 2.55], [1, 1, 0.2], C.yellow, false))
  const y0 = baseY + BRICK_H * 2
  ;[7, 5, 3].forEach((w, i) => out.push(deco([x, y0 + i * BRICK_H, z], [w, BRICK_H, 6], C.red, i === 2)))
  return out
}

/** 金幣堆。 */
export function coinStack(x: number, z: number, baseY: number, levels = 6): BrickSpec[] {
  const out: BrickSpec[] = []
  for (let i = 0; i < levels; i++) {
    const w = i % 2 ? 3 : 4
    out.push(deco([x + (i % 2 ? 0.3 : 0), baseY + i * 0.8, z], [w, 0.8, w], i % 2 ? C.orange : C.yellow, i === levels - 1))
  }
  return out
}

/** 一朵花：綠莖 + 彩色花瓣。 */
export function flower(x: number, z: number, baseY: number, color: string): BrickSpec[] {
  return [
    deco([x, baseY, z], [0.4, BRICK_H * 1.4, 0.4], C.green, false),
    deco([x, baseY + BRICK_H * 1.4, z], [1.4, 0.4, 1.4], color, false),
    deco([x, baseY + BRICK_H * 1.4 + 0.4, z], [0.6, 0.4, 0.6], C.yellow, true),
  ]
}
