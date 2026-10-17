import { BRICK_H, PLATE_H, type BrickSpec, type Vec3 } from '../types'
import { C } from '../colors'

/** 五階用的自然配色（皆為樂高常見色） */
export const N = {
  sand: '#D9B873',
  sandDark: '#BF9A55',
  sandLight: '#EBDCB0',
  dirt: '#9C7A4F',
  dirtDark: '#7C503A',
  wood: '#7C503A',
  trunk: '#582A12',
  leaf: '#237841',
  leafLight: '#4B9F4A',
  leafDark: '#184632',
  lime: '#A5CA18',
  stone: '#A0A5A9',
  stoneDark: '#6C6E68',
  stoneLight: '#C1C2C1',
  waterShallow: '#5ABFEA',
  water: '#1E8FD0',
  waterDeep: '#0A5CA8',
  wet: '#9BC4E2',
  coral: '#FF8672',
  pink: '#FC97AC',
  purple: '#6C3FA5',
} as const

export type Biome = 'beach' | 'jungle' | 'falls'
/** 迷宮內的生態區：起點在海灘，中段是叢林，終點附近是瀑布岩壁。 */
const CENTERS: [Biome, number, number][] = [
  ['beach', -22, 22], ['beach', 2, 28], ['beach', -30, 6],
  ['jungle', -22, -8], ['jungle', 2, 0], ['jungle', 28, 20], ['jungle', -4, -22],
  ['falls', 20, -22], ['falls', 24, -4],
]
export function biomeAt(x: number, z: number): Biome {
  let best: Biome = 'jungle'
  let bd = Infinity
  for (const [b, cx, cz] of CENTERS) {
    const d = (x - cx) ** 2 + (z - cz) ** 2
    if (d < bd) { bd = d; best = b }
  }
  return best
}

const deco = (pos: Vec3, size: Vec3, color: string, studs = false): BrickSpec => ({ pos, size, color, studs, collide: false })

/** 棕櫚樹：彎曲的樹幹（逐段偏移）+ 向四方垂下的葉片，高度約 h。 */
export function palm(x: number, z: number, baseY: number, h = 3.6, lean = 1): BrickSpec[] {
  const out: BrickSpec[] = []
  const segs = Math.max(2, Math.round(h / 1.2))
  let cx = x
  for (let i = 0; i < segs; i++) {
    out.push(deco([cx, baseY + i * 1.2, z], [0.8, 1.2, 0.8], i % 2 ? N.wood : N.trunk))
    if (i === 1) cx += 0.35 * lean
  }
  const top = baseY + segs * 1.2
  out.push(deco([cx, top, z], [0.9, 0.5, 0.9], N.trunk)) // 椰子
  out.push(deco([cx + 0.5, top - 0.2, z + 0.2], [0.5, 0.5, 0.5], N.wood))
  // 葉片：四片長條 + 一片頂
  const L = 3.2
  out.push(deco([cx + L / 2, top + 0.5, z], [L, 0.3, 1], N.leafLight))
  out.push(deco([cx - L / 2, top + 0.5, z], [L, 0.3, 1], N.leaf))
  out.push(deco([cx, top + 0.5, z + L / 2], [1, 0.3, L], N.leaf))
  out.push(deco([cx, top + 0.5, z - L / 2], [1, 0.3, L], N.leafLight))
  out.push(deco([cx + L, top + 0.2, z], [1, 0.3, 0.9], N.leaf))
  out.push(deco([cx - L, top + 0.2, z], [1, 0.3, 0.9], N.leafLight))
  out.push(deco([cx, top + 0.2, z + L], [0.9, 0.3, 1], N.leafLight))
  out.push(deco([cx, top + 0.2, z - L], [0.9, 0.3, 1], N.leaf))
  out.push(deco([cx, top + 0.8, z], [1.2, 0.4, 1.2], N.leafDark))
  return out
}

/** 叢林大樹：粗樹幹 + 板根 + 多層闊葉樹冠 + 垂下的藤蔓。scale 越大越高。 */
export function jungleTree(x: number, z: number, baseY: number, scale = 1): BrickSpec[] {
  const out: BrickSpec[] = []
  const tw = 1.6 * scale
  const th = 5 * scale
  out.push(deco([x, baseY, z], [tw + 1.2, 0.8, tw + 1.2], N.trunk)) // 板根
  out.push(deco([x, baseY, z], [tw, th, tw], N.wood))
  out.push(deco([x, baseY + th * 0.4, z], [tw + 0.3, 0.5, tw + 0.3], N.trunk))
  out.push(deco([x, baseY + th * 0.75, z], [tw + 0.3, 0.5, tw + 0.3], N.trunk))
  let y = baseY + th
  const layers: [number, string][] = [[6.5, N.leafDark], [5.5, N.leaf], [4, N.leafLight], [2.4, N.leaf]]
  for (const [w, col] of layers) {
    const s = w * scale
    out.push(deco([x, y, z], [s, BRICK_H, s], col))
    y += BRICK_H
  }
  // 藤蔓
  const v = 6.5 * scale / 2
  out.push(deco([x + v - 0.2, baseY + th - 2.6 * scale, z + 1], [0.25, 2.6 * scale, 0.25], N.leafLight))
  out.push(deco([x - v + 0.2, baseY + th - 1.8 * scale, z - 1], [0.25, 1.8 * scale, 0.25], N.leaf))
  out.push(deco([x + 1, baseY + th - 2.2 * scale, z - v + 0.2], [0.25, 2.2 * scale, 0.25], N.leafLight))
  return out
}

/** 灌木叢（兩層），可疊在牆頂 */
export function bush(x: number, z: number, baseY: number, w = 2.4): BrickSpec[] {
  return [
    deco([x, baseY, z], [w, 0.8, w * 0.9], N.leafDark),
    deco([x + 0.1, baseY + 0.8, z], [w * 0.7, 0.7, w * 0.65], N.leaf),
    deco([x - 0.3, baseY + 1.5, z + 0.1], [w * 0.35, 0.4, w * 0.35], N.leafLight),
  ]
}

/** 蕨類：中心莖 + 四片長葉 */
export function fern(x: number, z: number, baseY: number): BrickSpec[] {
  return [
    deco([x, baseY, z], [0.4, 0.7, 0.4], N.leafDark),
    deco([x + 0.9, baseY + 0.6, z], [1.6, 0.2, 0.5], N.leafLight),
    deco([x - 0.9, baseY + 0.6, z], [1.6, 0.2, 0.5], N.leaf),
    deco([x, baseY + 0.6, z + 0.9], [0.5, 0.2, 1.6], N.leaf),
    deco([x, baseY + 0.6, z - 0.9], [0.5, 0.2, 1.6], N.leafLight),
  ]
}

/** 巨大蘑菇：白莖 + 紅傘（白點） */
export function mushroom(x: number, z: number, baseY: number, s = 1): BrickSpec[] {
  return [
    deco([x, baseY, z], [0.7 * s, 0.9 * s, 0.7 * s], C.white),
    deco([x, baseY + 0.9 * s, z], [2 * s, 0.5 * s, 2 * s], C.red, true),
    deco([x + 0.5 * s, baseY + 1.4 * s + 0.2, z + 0.3 * s], [0.4 * s, 0.1, 0.4 * s], C.white),
  ]
}

/** 岩石堆 */
export function rocks(x: number, z: number, baseY: number, s = 1): BrickSpec[] {
  return [
    deco([x, baseY, z], [2.2 * s, 0.9 * s, 1.8 * s], N.stoneDark),
    deco([x + 0.3 * s, baseY + 0.9 * s, z], [1.4 * s, 0.7 * s, 1.2 * s], N.stone),
    deco([x - 0.8 * s, baseY, z + 1 * s], [1 * s, 0.6 * s, 1 * s], N.stoneLight),
  ]
}

/** 沙灘傘：插在沙中的長桿 + 兩色傘面 */
export function umbrella(x: number, z: number, baseY: number, color: string): BrickSpec[] {
  return [
    deco([x, baseY, z], [0.25, 2.6, 0.25], C.white),
    deco([x, baseY + 2.6, z], [3.2, 0.3, 3.2], color),
    deco([x, baseY + 2.9, z], [1.8, 0.3, 1.8], C.white),
    deco([x, baseY + 3.2, z], [0.5, 0.3, 0.5], color),
  ]
}

/** 沙堡：三塔 + 小旗 */
export function sandcastle(x: number, z: number, baseY: number, s = 1): BrickSpec[] {
  const out: BrickSpec[] = [
    deco([x, baseY, z], [3.2 * s, 0.9 * s, 3.2 * s], N.sandDark, true),
    deco([x - 1.1 * s, baseY + 0.9 * s, z - 1.1 * s], [1 * s, 1.4 * s, 1 * s], N.sand, true),
    deco([x + 1.1 * s, baseY + 0.9 * s, z - 1.1 * s], [1 * s, 1.4 * s, 1 * s], N.sand, true),
    deco([x, baseY + 0.9 * s, z + 0.3 * s], [1.3 * s, 2 * s, 1.3 * s], N.sand, true),
    deco([x, baseY + 2.9 * s, z + 0.3 * s], [0.12, 1.2, 0.12], C.white),
    deco([x + 0.4 * s, baseY + 3.5 * s, z + 0.3 * s], [0.7, 0.5, 0.1], C.red),
  ]
  return out
}

/** 海星（平放）與貝殼 */
export function starfish(x: number, z: number, baseY: number, color: string = N.coral): BrickSpec[] {
  return [
    deco([x, baseY, z], [0.9, 0.2, 0.4], color),
    deco([x, baseY, z], [0.4, 0.2, 0.9], color),
    deco([x, baseY + 0.2, z], [0.4, 0.15, 0.4], C.orange),
  ]
}
export function shell(x: number, z: number, baseY: number): BrickSpec[] {
  return [deco([x, baseY, z], [0.6, 0.25, 0.5], C.white), deco([x, baseY + 0.25, z], [0.35, 0.2, 0.3], N.pink)]
}

/** 海灘球（三色疊成） */
export function beachBall(x: number, z: number, baseY: number): BrickSpec[] {
  return [
    deco([x, baseY, z], [1.4, 0.5, 1.4], C.red),
    deco([x, baseY + 0.5, z], [1.4, 0.5, 1.4], C.white),
    deco([x, baseY + 1, z], [1.4, 0.5, 1.4], C.blue),
  ]
}

/** 救生員高台 */
export function lifeguard(x: number, z: number, baseY: number): BrickSpec[] {
  const out: BrickSpec[] = []
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) out.push(deco([x + dx, baseY, z + dz], [0.3, 3, 0.3], C.white))
  out.push(deco([x, baseY + 3, z], [3, 0.4, 3], C.red, true))
  out.push(deco([x, baseY + 3.4, z - 1.3], [3, 1.4, 0.3], C.white))
  out.push(deco([x - 1.3, baseY + 3.4, z], [0.3, 1.4, 2.5], C.white))
  out.push(deco([x, baseY + 4.8, z], [3.6, 0.3, 3.6], C.red))
  out.push(deco([x, baseY + 5.1, z], [2.2, 0.3, 2.2], C.white))
  out.push(deco([x, baseY + 1, z + 2], [1.2, 0.2, 3], C.white)) // 階梯斜板（簡化）
  return out
}

/** 立在沙裡的衝浪板 */
export function surfboard(x: number, z: number, baseY: number, color: string): BrickSpec[] {
  return [
    deco([x, baseY, z], [0.6, 3.2, 0.25], color),
    deco([x, baseY + 3.2, z], [0.4, 0.5, 0.25], color),
    deco([x, baseY + 1.2, z + 0.02], [0.3, 0.5, 0.3], C.white),
  ]
}

/** 木棧橋：往海裡延伸（沿 +z），寬 w、長 len */
export function pier(x: number, z0: number, baseY: number, len: number, w = 4): BrickSpec[] {
  const out: BrickSpec[] = []
  for (let i = 0; i < len / 2; i++) {
    out.push(deco([x, baseY, z0 + i * 2 + 1], [w, 0.4, 1.9], i % 2 ? N.wood : N.dirt, true))
  }
  for (let i = 0; i <= len / 6; i++) {
    for (const s of [-1, 1]) out.push(deco([x + s * (w / 2 - 0.2), baseY - 1.6, z0 + i * 6 + 0.4], [0.5, 1.6, 0.5], N.trunk))
  }
  return out
}

/** 浮木 */
export function driftwood(x: number, z: number, baseY: number): BrickSpec[] {
  return [deco([x, baseY, z], [3, 0.6, 0.7], N.wood), deco([x + 1.6, baseY + 0.3, z + 0.3], [0.9, 0.4, 0.5], N.trunk)]
}

/** 倒木（叢林） */
export function log(x: number, z: number, baseY: number, horizontal = true): BrickSpec[] {
  const size: Vec3 = horizontal ? [3.4, 0.9, 1] : [1, 0.9, 3.4]
  return [deco([x, baseY, z], size, N.wood), deco([x, baseY + 0.9, z], horizontal ? [2.4, 0.2, 0.8] : [0.8, 0.2, 2.4], N.leafLight)]
}

/** 睡蓮葉（浮在水面） */
export function lilypad(x: number, z: number, baseY: number): BrickSpec[] {
  return [deco([x, baseY, z], [1.4, 0.15, 1.4], N.leafLight), deco([x + 0.2, baseY + 0.15, z], [0.4, 0.1, 0.4], N.pink)]
}

/** 牆面藤蔓：貼在牆的側面（dir：'+x' 等） */
export function vine(x: number, z: number, baseY: number, h: number, dir: '+x' | '-x' | '+z' | '-z'): BrickSpec[] {
  const t = 0.18
  const off = 2 + t / 2 + 0.02
  const along = [0.9, 0.3, 1.5]
  return along.map((o, i) => {
    const hh = h * (1 - i * 0.28)
    const sx = dir.endsWith('x') ? (dir === '+x' ? 1 : -1) * off : o - 0.9 + (i - 1) * 0.1
    const sz = dir.endsWith('z') ? (dir === '+z' ? 1 : -1) * off : o - 0.9
    const size: Vec3 = dir.endsWith('x') ? [t, hh, 0.35] : [0.35, hh, t]
    return deco([x + sx, baseY + h - hh, z + sz], size, i % 2 ? N.leaf : N.leafLight)
  })
}

/** 像素拱形彩虹（朝 +z 的 x–y 平面），由外而內：紅橙黃綠藍紫 */
export function rainbow(cx: number, baseY: number, z: number, radius: number): BrickSpec[] {
  const bands = [C.red, C.orange, C.yellow, C.green, C.blue, N.purple]
  const out: BrickSpec[] = []
  const seen = new Set<string>()
  bands.forEach((col, bi) => {
    const r = radius - bi * 1.1
    for (let a = 0; a <= 180; a += 4) {
      const rad = (a * Math.PI) / 180
      const x = Math.round((cx + Math.cos(rad) * r) / 1.1) * 1.1
      const y = Math.round((baseY + Math.sin(rad) * r) / 1.1) * 1.1
      const k = `${x.toFixed(1)},${y.toFixed(1)}`
      if (seen.has(k)) continue
      seen.add(k)
      out.push(deco([x, y, z], [1.1, 1.1, 1], col))
    }
  })
  return out
}

/** 階梯狀岩壁：由 tiers 描述每一層的 [中心x, 寬, 深, 高] 與 z 位置，由下往上疊 */
export function cliff(tiers: { x: number; w: number; z: number; d: number; h: number; color: string }[], baseY: number): BrickSpec[] {
  const out: BrickSpec[] = []
  let y = baseY
  tiers.forEach((t, i) => {
    out.push(deco([t.x, y, t.z], [t.w, t.h, t.d], t.color, false))
    // 岩層分縫（淺色橫條，增加積木感）
    out.push(deco([t.x, y + t.h * 0.5, t.z + t.d / 2 + 0.03], [t.w - 0.2, 0.25, 0.05], i % 2 ? N.stoneLight : N.stone))
    y += t.h
  })
  return out
}

/** 一個小水池（藍色薄片 + 邊緣石塊），可放在走道旁的平地 */
export function pond(x: number, z: number, baseY: number, w: number, d: number): BrickSpec[] {
  return [
    deco([x, baseY, z], [w + 0.6, PLATE_H, d + 0.6], N.stoneDark),
    deco([x, baseY + PLATE_H, z], [w, 0.15, d], N.waterShallow),
  ]
}
