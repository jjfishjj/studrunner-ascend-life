import { BRICK_H, type BrickSpec, type LevelDef, type MoverSpec, type NoteSpec, type RouteStep, type Vec3 } from '../types'
import { C, rng } from '../colors'
import { cloud, pixelHeart } from './scenery'

/** 頂面 y = 0 的實心積木板（中心 x、z）。 */
const slab = (x: number, z: number, w: number, d: number, color: string, extra: Partial<BrickSpec> = {}): BrickSpec =>
  ({ pos: [x, -BRICK_H, z], size: [w, BRICK_H, d], color, ...extra })

/** 島嶼下方逐層縮小的棕色基座（純裝飾）。 */
function islandBase(x: number, z: number, w: number, d: number, out: BrickSpec[]) {
  for (let k = 1; k <= 3; k++) {
    const sw = Math.max(2, w - k * 3), sd = Math.max(2, d - k * 3)
    out.push({ pos: [x, -BRICK_H * (k + 1), z], size: [sw, BRICK_H, sd], color: k === 1 ? C.darkGreen : C.brown, collide: false, studs: false })
  }
}

/**
 * 二階「情感與親密關係」－心橋
 * 一座座漂浮在湖面上的心形浮橋：先踩幾塊小浮板、搭上左右滑動的平台、
 * 通過「爭吵」陷阱走廊、跳過旋轉橫桿，最後抵達愛心雕塑下的終點島。
 * 筆記磚 05～08；集齊才能通過終點。
 */
export function buildLevel2(): LevelDef {
  const statics: BrickSpec[] = []
  const decor: BrickSpec[] = []
  const movers: MoverSpec[] = []
  const r = rng(515)

  // A：起點島
  statics.push(slab(0, 2, 12, 12, C.white))
  islandBase(0, 2, 12, 12, decor)
  // 三塊小浮板
  const steps: [number, number, string][] = [[0, -9, C.red], [-3, -16, C.yellow], [3, -23, C.red]]
  for (const [x, z, c] of steps) statics.push(slab(x, z, 4, 4, c))
  // 兩個左右滑動的平台（相位相反）
  const lanes: [string, number, number][] = [['slide-a', -28, 0], ['slide-b', -33, Math.PI]]
  for (const [id, z, phase] of lanes) {
    movers.push({ id, brick: { pos: [0, -BRICK_H, z], size: [4, BRICK_H, 4], color: C.blue }, motion: { type: 'slide', axis: 'x', amp: 3.5, speed: 1.2, phase } })
  }
  // B：中繼島（檢查點）
  statics.push(slab(0, -43, 12, 12, C.white))
  islandBase(0, -43, 12, 12, decor)
  // 走廊：寬 4、長 26，三個週期升起的紅色陷阱
  const corridorZ0 = -49, corridorZ1 = -75
  statics.push(slab(0, (corridorZ0 + corridorZ1) / 2, 4, corridorZ0 - corridorZ1, C.darkGray, { visible: false }))
  let i = 0
  for (let z = corridorZ0; z > corridorZ1; z -= 2, i++) {
    statics.push(slab(0, z - 1, 4, 2, i % 2 ? C.gray : C.white, { collide: false }))
    for (const sx of [-2.25, 2.25]) decor.push({ pos: [sx, 0, z - 1], size: [0.5, 0.4, 2], color: i % 2 ? C.red : C.white, collide: false, studs: false })
  }
  const trapZ = [-55, -63, -71]
  trapZ.forEach((z, k) => {
    movers.push({
      id: `quarrel-${k}`, hazard: true,
      brick: { pos: [0, 0, z], size: [3.7, BRICK_H, 3.7], color: C.red },
      motion: { type: 'pulse', rise: BRICK_H, period: 2.8 + (k % 2) * 0.4, up: 0.4, phase: k * 1.0 },
    })
  })
  // C：旋轉橫桿島（檢查點在入口）
  statics.push(slab(0, -85, 18, 18, C.white))
  islandBase(0, -85, 18, 18, decor)
  ;[[-4.5, 1.8], [4.5, -2.0]].forEach(([x, sp], k) => {
    movers.push({
      id: `misunderstand-${k}`, hazard: true,
      brick: { pos: [x, 0, -85], size: [9, BRICK_H, 0.9], color: k ? C.yellow : C.red },
      motion: { type: 'spin', speed: sp, phase: k * 1.3 },
    })
    decor.push({ pos: [x, 0, -85], size: [1, BRICK_H + 0.4, 1], color: C.black, collide: false })
  })
  // D：終點島 + 愛心雕塑
  statics.push(slab(0, -104, 12, 14, C.white))
  islandBase(0, -104, 12, 14, decor)
  decor.push(...pixelHeart(0, 0, -109.6, 1.3, C.red))
  for (const sx of [-5.4, 5.4]) for (let k = 0; k < 3; k++) decor.push({ pos: [sx, k * BRICK_H, -100], size: [1.2, BRICK_H, 1.2], color: k % 2 ? C.white : C.red, collide: false })

  // 背景：湖面、飄浮的小愛心與雲
  decor.push({ pos: [0, -9.6, -50], size: [150, BRICK_H, 200], color: C.blue, collide: false, studs: false })
  for (let k = 0; k < 10; k++) {
    const side = k % 2 ? 1 : -1
    decor.push(...pixelHeart(side * (17 + r() * 14), -3 + r() * 6, -r() * 110 + 5, 0.55 + r() * 0.35, r() < 0.5 ? C.red : C.white, 0.6))
  }
  for (let k = 0; k < 10; k++) decor.push(...cloud((r() - 0.5) * 90, 12 + r() * 10, -k * 12 + 8, r))

  const notes: NoteSpec[] = [
    { id: '05', pos: [-3, 1.9, -16] },
    { id: '06', pos: [-3.5, 1.9, -43] },
    { id: '07', pos: [0, 1.9, -67] },
    { id: '08', pos: [0, 1.9, -91] },
  ]
  const coins: Vec3[] = [
    [0, 1.5, -9], [3, 1.5, -23], [3.5, 1.5, -46], [0, 1.5, -59], [0, 1.5, -74],
    [-7, 1.5, -80], [7, 1.5, -90], [0, 1.5, -101],
  ]
  const route: RouteStep[] = [
    { pos: [0, 0, 2] }, { pos: [0, 0, -9] }, { pos: [-3, 0, -16] }, { pos: [3, 0, -23] },
    { pos: [0, 0, -28], mover: 'slide-a' }, { pos: [0, 0, -33], mover: 'slide-b' },
    { pos: [0, 0, -43] }, { pos: [-3.5, 0, -43] }, { pos: [0, 0, -52] }, { pos: [0, 0, -59] }, { pos: [0, 0, -67] }, { pos: [0, 0, -75] },
    { pos: [0, 0, -78] }, { pos: [0, 0, -91] }, { pos: [0, 0, -104] },
  ]
  return {
    id: 2,
    name: '心橋',
    subtitle: '情感與親密關係',
    hint: '搭上滑動平台、等紅色陷阱縮回去再通過、跳過旋轉橫桿，一路收集 4 張筆記磚。',
    lives: 5,
    parTime: 95,
    requiredCoins: 0,
    sky: '#F6B4B7',
    fog: ['#FAD2CB', 45, 150],
    spawn: [0, 0.1, 3],
    killY: -9,
    fallDepth: 6,
    camera: { distance: 9.5, height: 6, mode: 'follow', yaw: 0 },
    light: { sun: '#FFD8B0', sunIntensity: 2.4, hemiSky: '#FFE0E6', hemiGround: '#C58A9C', hemiIntensity: 0.9, env: 0.5 },
    statics, decor, movers, coins,
    checkpoints: [{ pos: [0, 0, -43] }, { pos: [0, 0, -77.5] }],
    switches: [],
    goal: [0, 0, -104],
    notes,
    goalNeedsNotes: true,
    route,
  }
}
