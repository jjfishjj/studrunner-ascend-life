import { BRICK_H, type BrickSpec, type LevelDef, type MoverSpec, type NoteSpec, type RouteStep, type Vec3 } from '../types'
import { C, rng } from '../colors'
import { cloud, coinStack, flower, house, pixelHeart, tree } from './scenery'

const slab = (x: number, z: number, w: number, d: number, color: string, extra: Partial<BrickSpec> = {}): BrickSpec =>
  ({ pos: [x, -BRICK_H, z], size: [w, BRICK_H, d], color, ...extra })

/** 事業：紅白相間的辦公大樓 */
function officeTower(x: number, z: number, baseY: number): BrickSpec[] {
  const out: BrickSpec[] = []
  for (let k = 0; k < 8; k++) {
    out.push({ pos: [x, baseY + k * BRICK_H, z], size: [4, BRICK_H, 4], color: k % 2 ? C.white : C.red, collide: false, studs: k === 7 })
    if (k % 2 === 0) out.push({ pos: [x, baseY + k * BRICK_H + 0.4, z + 2.02], size: [3, 0.5, 0.1], color: C.blue, collide: false, studs: false })
  }
  return out
}

const ISLAND_Z = [0, -30, -60, -90, -120]
const ISLAND_COLORS = [C.red, C.yellow, C.blue, C.green, C.white]

/**
 * 三階「親子與人生平衡」－五運群島
 * 事業、財富、感情、家庭、身體五座空中島，由四段不同的浮橋相連：
 * 上下起伏的升降平台、左右滑動的平台、旋轉橫桿橋、前後伸縮的平台。
 * 筆記磚 09～12 分別放在前四座島上；身體島是終點。
 */
export function buildLevel3(): LevelDef {
  const statics: BrickSpec[] = []
  const decor: BrickSpec[] = []
  const movers: MoverSpec[] = []
  const r = rng(616)

  // 五座島（12x12）：本體白色，四周鑲島色邊條
  ISLAND_Z.forEach((z, k) => {
    statics.push(slab(0, z, 12, 12, C.white))
    const col = ISLAND_COLORS[k]
    decor.push({ pos: [-5.5, 0, z], size: [1, 0.4, 12], color: col, collide: false })
    decor.push({ pos: [5.5, 0, z], size: [1, 0.4, 12], color: col, collide: false })
    for (let j = 1; j <= 3; j++) {
      decor.push({ pos: [0, -BRICK_H * (j + 1), z], size: [Math.max(2, 12 - j * 3), BRICK_H, Math.max(2, 12 - j * 3)], color: j === 1 ? col : C.brown, collide: false, studs: false })
    }
  })

  // 兩側的主題雕塑與矮台
  ISLAND_Z.forEach((z, k) => {
    for (const side of [-1, 1]) {
      const x = side * 10.5
      decor.push({ pos: [x, -BRICK_H * 2, z], size: [9, BRICK_H, 9], color: C.green, collide: false })
      const base = -BRICK_H
      if (k === 0) decor.push(...officeTower(x, z, base))
      if (k === 1) decor.push(...coinStack(x, z, base, 8))
      if (k === 2) decor.push(...pixelHeart(x, base, z, 0.8, side < 0 ? C.red : C.white, 1))
      if (k === 3) decor.push(...house(x, z, base))
      if (k === 4) {
        decor.push(...tree(x, z, base, 1.6))
        decor.push(...flower(x - 2.5, z + 2, base, C.red), ...flower(x + 2.5, z - 2, base, C.yellow))
      }
    }
  })

  // 第 1 段（事業→財富）：三個上下起伏的升降平台
  ;[-9.5, -15, -20.5].forEach((z, k) => {
    movers.push({ id: `elev-${k}`, brick: { pos: [0, -BRICK_H, z], size: [5, BRICK_H, 4], color: ISLAND_COLORS[0] }, motion: { type: 'slide', axis: 'y', amp: 0.9, speed: 1.4, phase: k * 2.1 } })
  })
  // 第 2 段（財富→感情）：三個左右滑動的平台
  ;[-39.5, -45, -50.5].forEach((z, k) => {
    movers.push({ id: `slide-${k}`, brick: { pos: [0, -BRICK_H, z], size: [5, BRICK_H, 4], color: ISLAND_COLORS[1] }, motion: { type: 'slide', axis: 'x', amp: 3.5, speed: 1.3, phase: k * 2.1 } })
  })
  // 第 3 段（感情→家庭）：窄橋 + 兩根旋轉橫桿
  statics.push(slab(0, -75, 5, 18, C.white))
  for (let z = -66; z > -84; z -= 2) decor.push({ pos: [0, 0, z - 1], size: [5, 0.4, 2], color: ((z / 2) | 0) % 2 ? C.red : C.white, collide: false })
  ;[-71, -79].forEach((z, k) => {
    movers.push({ id: `bar-${k}`, hazard: true, brick: { pos: [0, 0, z], size: [7, BRICK_H, 0.9], color: k ? C.yellow : C.red }, motion: { type: 'spin', speed: k ? -1.9 : 1.6, phase: k * 1.1 } })
    decor.push({ pos: [0, 0, z], size: [1, BRICK_H + 0.4, 1], color: C.black, collide: false })
  })
  // 第 4 段（家庭→身體）：前後伸縮的平台
  ;[-100.5, -105, -109.5].forEach((z, k) => {
    movers.push({ id: `reach-${k}`, brick: { pos: [0, -BRICK_H, z], size: [5, BRICK_H, 4], color: ISLAND_COLORS[3] }, motion: { type: 'slide', axis: 'z', amp: 1.8, speed: 1.3, phase: k * 2.1 } })
  })

  // 背景：雲海與飄浮的雲
  decor.push({ pos: [0, -14, -60], size: [220, BRICK_H, 260], color: C.white, collide: false, studs: false })
  for (let k = 0; k < 14; k++) decor.push(...cloud((r() - 0.5) * 120, -8 + r() * 28, -r() * 130 + 10, r))

  const notes: NoteSpec[] = [
    { id: '09', pos: [0, 1.9, -2] },
    { id: '10', pos: [0, 1.9, -30] },
    { id: '11', pos: [0, 1.9, -60] },
    { id: '12', pos: [0, 1.9, -90] },
  ]
  const coins: Vec3[] = [
    [-3, 1.5, -3], [0, 2.4, -15], [3, 1.5, -33], [0, 2.2, -45], [-3, 1.5, -63], [0, 2.8, -75], [3, 1.5, -93], [0, 2.0, -105],
  ]
  const route: RouteStep[] = [
    { pos: [0, 0, 0] },
    { pos: [0, 0, -9.5], mover: 'elev-0' }, { pos: [0, 0, -15], mover: 'elev-1' }, { pos: [0, 0, -20.5], mover: 'elev-2' },
    { pos: [0, 0, -30] },
    { pos: [0, 0, -39.5], mover: 'slide-0' }, { pos: [0, 0, -45], mover: 'slide-1' }, { pos: [0, 0, -50.5], mover: 'slide-2' },
    { pos: [0, 0, -60] }, { pos: [0, 0, -75] },
    { pos: [0, 0, -90] },
    { pos: [0, 0, -100.5], mover: 'reach-0' }, { pos: [0, 0, -105], mover: 'reach-1' }, { pos: [0, 0, -109.5], mover: 'reach-2' },
    { pos: [0, 0, -120] },
  ]
  return {
    id: 3,
    name: '五運群島',
    subtitle: '親子與人生平衡',
    hint: '依序走過事業、財富、感情、家庭、身體五座島；浮橋會升降、滑動、旋轉與伸縮，抓準時機再跳。',
    lives: 5,
    parTime: 110,
    requiredCoins: 0,
    sky: '#FFE2A8',
    fog: ['#FFEFC9', 50, 170],
    spawn: [0, 0.1, 3],
    killY: -11,
    fallDepth: 6,
    camera: { distance: 10, height: 6.2, mode: 'follow', yaw: 0 },
    light: { sun: '#FFE7B8', sunIntensity: 2.6, hemiSky: '#FFF1CF', hemiGround: '#B5A47A', hemiIntensity: 0.95, env: 0.5 },
    statics, decor, movers, coins,
    checkpoints: [{ pos: [3.5, 0, -27] }, { pos: [3.5, 0, -57] }, { pos: [3.5, 0, -87] }],
    switches: [],
    goal: [0, 0, -120],
    notes,
    goalNeedsNotes: true,
    route,
  }
}
