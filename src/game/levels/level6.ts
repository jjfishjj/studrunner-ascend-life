import { BRICK_H, type BrickSpec, type LevelDef, type MoverSpec, type RouteStep, type Vec3 } from '../types'
import { C, rng } from '../colors'
import { planet, stars } from './scenery'

const STAR_VIOLET = '#7658D6'
const STAR_CYAN = '#51D8EE'
const STAR_DARK = '#111943'

type Island = { x: number; z: number; top: number; w: number; d: number; color: string }

/**
 * 終章「星空之門」：沿固定星島路線收集六枚星之碎片，開啟星門後抵達終點。
 * 這是五階學習旅程的尾聲，不新增筆記分類；全關無倒數，路線含安全軌道橋與兩個檢查點。
 */
export function buildLevel6(): LevelDef {
  const statics: BrickSpec[] = []
  const decor: BrickSpec[] = []
  const islands: Island[] = [
    { x: 0, z: 8, top: 0, w: 10, d: 10, color: C.darkBlue },
    { x: 0, z: 2, top: 0, w: 6, d: 6, color: C.blue },
    { x: 5, z: -5, top: 0.8, w: 7, d: 7, color: STAR_VIOLET },
    { x: 7, z: -14, top: 1.6, w: 8, d: 8, color: C.darkBlue },
    { x: 2, z: -22, top: 2.4, w: 8, d: 8, color: STAR_VIOLET },
    { x: -4, z: -30, top: 3.2, w: 9, d: 9, color: C.darkBlue },
    { x: -4, z: -39, top: 4, w: 14, d: 14, color: STAR_DARK },
  ]

  for (const [i, island] of islands.entries()) {
    statics.push({
      pos: [island.x, island.top - BRICK_H, island.z],
      size: [island.w, BRICK_H, island.d],
      color: island.color,
    })
    // 浮島底部的另一層色磚只作裝飾，保持碰撞體數量精簡。
    decor.push({
      pos: [island.x, island.top - BRICK_H * 2, island.z],
      size: [Math.max(3, island.w - 2), BRICK_H, Math.max(3, island.d - 2)],
      color: i % 2 ? STAR_VIOLET : STAR_DARK,
      collide: false,
      studs: false,
    })
  }

  const orbitBridge: MoverSpec = {
    id: 'star-orbit-bridge',
    brick: { pos: [2.5, -0.8, -1.5], size: [4.6, BRICK_H, 4.6], color: STAR_CYAN },
    motion: { type: 'slide', axis: 'x', amp: 0.9, speed: 0.52, phase: 0.4 },
    hazard: false,
  }
  const movers = [orbitBridge]
  const coins: Vec3[] = [
    [0, 1.5, 8],
    [5, 2.3, -5],
    [7, 3.1, -14],
    [2, 3.9, -22],
    [-4, 4.7, -30],
    [-4, 5.5, -32.8],
  ]
  const gatePos: Vec3 = [-4, 4, -35]

  // 星門外框是非碰撞裝飾；門片本身是引擎管理的金幣閘門。
  decor.push(
    { pos: [-10.35, 4, -35], size: [0.7, 7.2, 1], color: STAR_VIOLET, collide: false, studs: false },
    { pos: [2.35, 4, -35], size: [0.7, 7.2, 1], color: STAR_VIOLET, collide: false, studs: false },
    { pos: [-4, 10.6, -35], size: [13.4, 1, 1], color: STAR_CYAN, collide: false, studs: false },
  )

  // 星空遠景完全由程式生成，固定種子確保關卡與測試可重現。
  const r = rng(606)
  decor.push(...planet(-39, 21, -55, 5, STAR_CYAN, { ring: STAR_VIOLET, stripe: C.white }))
  decor.push(...planet(38, 28, -36, 6, STAR_VIOLET, { ring: STAR_CYAN, stripe: C.white }))
  decor.push(...planet(32, 12, 32, 4, C.orange, { stripe: C.yellow }))
  decor.push(...stars(90, [190, 110, 170], [0, 24, -14], r))

  const route: RouteStep[] = [
    { pos: [0, 0, 8] },
    { pos: [0, 0, 2] },
    { pos: [2.5, 1, -1.5], mover: orbitBridge.id },
    { pos: [5, 0.8, -5] },
    { pos: [7, 1.6, -14] },
    { pos: [2, 2.4, -22] },
    { pos: [-4, 3.2, -30] },
    { pos: [-4, 4, -32.8] },
    { pos: [-4, 4, -41] },
  ]

  return {
    id: 6,
    name: '星空之門',
    subtitle: '五階之後的最終旅程',
    hint: '沿著浮空星島前進，搭上緩慢移動的軌道橋，收集 6 枚星之碎片開啟星門。終章沒有倒數，也不新增筆記分類。',
    lives: 5,
    parTime: 65,
    requiredCoins: 6,
    sky: '#070B2A',
    fog: ['#10174A', 42, 135],
    spawn: [0, 0.1, 8],
    killY: -18,
    fallDepth: 8,
    camera: { distance: 12, height: 5.5, mode: 'follow' },
    light: { sun: '#DCE4FF', sunIntensity: 1.65, hemiSky: '#9FB9FF', hemiGround: '#24234D', hemiIntensity: 0.85, env: 0.4 },
    statics,
    decor,
    movers,
    coins,
    checkpoints: [
      { pos: [islands[2].x, islands[2].top, islands[2].z] },
      { pos: [islands[4].x, islands[4].top, islands[4].z] },
    ],
    gate: {
      brick: { pos: gatePos, size: [13, 6, 0.9], color: STAR_VIOLET, studs: false },
      sink: 6.5,
      mode: 'coins',
    },
    switches: [],
    goal: [-4, 4, -41],
    notes: [],
    goalNeedsNotes: false,
    route,
    meta: { goalTop: 4, pathLength: route.length },
  }
}
