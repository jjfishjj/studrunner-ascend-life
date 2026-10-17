import { BRICK_H, type BrickSpec, type LevelDef, type MoverSpec, type NoteSpec, type Vec3 } from '../types'
import { C, CLASSIC, rng } from '../colors'
import { planet, stars } from './scenery'

const R = 8
const SIDE = R * 2
const PERIM = SIDE * 4

/** 沿著邊長 16 的方形環繞路徑取點；回傳座標與所在邊的切線/法線軸。 */
export function perimeterPoint(s: number): { x: number; z: number; side: number } {
  const t = ((s % PERIM) + PERIM) % PERIM
  const side = Math.floor(t / SIDE)
  const u = t - side * SIDE
  switch (side) {
    case 0: return { x: -R + u, z: R, side }
    case 1: return { x: R, z: R - u, side }
    case 2: return { x: R - u, z: -R, side }
    default: return { x: -R, z: -R + u, side }
  }
}

export const TOWER_STEPS = 30

/**
 * 四階「宇宙觀與更高層次能量」－揚升之塔（垂直跳躍）
 * 夜空中的中央彩色高柱，四周以方形螺旋排列 30 塊浮空積木，越往上間距越大、積木越小，
 * 中途有會移動的平台與三個檢查點，頂端是金色終點。筆記磚 13～16 各藏在螺旋的不同高度。
 */
export function buildLevel4(): LevelDef {
  const statics: BrickSpec[] = []
  const decor: BrickSpec[] = []
  const movers: MoverSpec[] = []
  const coins: Vec3[] = []
  const checkpoints: { pos: Vec3 }[] = []
  const notes: NoteSpec[] = []
  const NOTE_AT: Record<number, string> = { 5: '13', 12: '14', 20: '15', 27: '16' }
  const r = rng(202)

  // 起始浮島
  statics.push({ pos: [0, -BRICK_H, 0], size: [22, BRICK_H, 22], color: C.darkBlue })
  decor.push({ pos: [0, -BRICK_H * 2, 0], size: [18, BRICK_H, 18], color: C.black, collide: false, studs: false })
  decor.push({ pos: [0, -BRICK_H * 3, 0], size: [12, BRICK_H, 12], color: C.brown, collide: false, studs: false })
  decor.push({ pos: [0, -BRICK_H * 4, 0], size: [6, BRICK_H, 6], color: C.brown, collide: false, studs: false })

  // 中央高柱（碰撞體一個，視覺分層上色）
  const pillarLevels = TOWER_STEPS + 4
  statics.push({ pos: [0, 0, 0], size: [4, BRICK_H * pillarLevels, 4], color: C.white, visible: false })
  for (let k = 0; k < pillarLevels; k++) {
    statics.push({ pos: [0, k * BRICK_H, 0], size: [4, BRICK_H, 4], color: CLASSIC[k % 4], collide: false, studs: k === pillarLevels - 1 })
  }

  let s = 3
  for (let i = 0; i < TOWER_STEPS; i++) {
    const p = perimeterPoint(s)
    const top = BRICK_H * (i + 1)
    const w = i < 10 ? 4 : i < 20 ? 3 : 2
    const isCheckpoint = i === 7 || i === 15 || i === 23
    const size: Vec3 = isCheckpoint ? [4, BRICK_H, 4] : [w, BRICK_H, w]
    const color = isCheckpoint ? C.white : CLASSIC[(i * 3) % 4]
    const brick: BrickSpec = { pos: [p.x, top - BRICK_H, p.z], size, color }
    if (i === 11 || i === 19 || i === 26) {
      // 會移動的平台：沿法線（內外）或切線來回
      const radial = i !== 26
      const axis: 'x' | 'z' = (p.side % 2 === 0) === radial ? 'z' : 'x'
      movers.push({ id: `lift-${i}`, brick: { ...brick, color: C.orange }, motion: { type: 'slide', axis, amp: radial ? 1.8 : 1.0, speed: 1.1 + i * 0.01 } })
    } else {
      statics.push(brick)
    }
    if (isCheckpoint) checkpoints.push({ pos: [p.x, top, p.z] })
    if ([3, 8, 10, 14, 17, 22, 25, 29].includes(i)) coins.push([p.x, top + 1.5, p.z])
    if (NOTE_AT[i]) notes.push({ id: NOTE_AT[i], pos: [p.x, top + 1.9, p.z] })
    s += 3.9 + 1.7 * (i / TOWER_STEPS)
  }
  // 塔頂平台
  const g = perimeterPoint(s + 0.8)
  const goalTop = BRICK_H * (TOWER_STEPS + 1)
  statics.push({ pos: [g.x, goalTop - BRICK_H, g.z], size: [6, BRICK_H, 6], color: C.yellow })
  decor.push({ pos: [g.x, goalTop - BRICK_H * 2, g.z], size: [4, BRICK_H, 4], color: C.orange, collide: false, studs: false })

  // 宇宙背景：體素星球與星星
  decor.push(...planet(-42, 18, -46, 6, C.white, { stripe: C.gray }))
  decor.push(...planet(46, 30, -34, 7, C.orange, { ring: C.yellow, stripe: C.red }))
  decor.push(...planet(34, 4, 52, 5, C.blue, { stripe: C.green }))
  decor.push(...planet(-54, 46, 40, 8, C.yellow, { stripe: C.orange }))
  decor.push(...planet(12, 52, -66, 4, C.red))
  decor.push(...planet(-30, 8, 58, 3, C.green))
  decor.push(...stars(170, [170, 120, 170], [0, 22, 0], r).filter(b => Math.hypot(b.pos[0], b.pos[2]) > 22))

  return {
    id: 4,
    name: '揚升之塔',
    subtitle: '宇宙觀與更高層次能量',
    hint: '沿著螺旋跳上浮空積木，穿過星空向上揚升；集齊 4 張筆記磚，塔頂的終點才會亮起。',
    lives: 5,
    parTime: 75,
    requiredCoins: 0,
    sky: '#0A1038',
    fog: ['#141C58', 60, 190],
    spawn: [-5, 0.1, 3.6],
    killY: -12,
    fallDepth: 6,
    camera: { distance: 10, height: 5, mode: 'orbit', center: [0, 0, 0] },
    light: { sun: '#CFD8FF', sunIntensity: 2.0, hemiSky: '#9AA6FF', hemiGround: '#3A3A7A', hemiIntensity: 1.0, env: 0.45 },
    statics, decor, movers, coins, checkpoints,
    switches: [],
    goal: [g.x, goalTop, g.z],
    notes,
    goalNeedsNotes: true,
    meta: { goalTop },
  }
}
