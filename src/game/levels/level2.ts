import { BRICK_H, type BrickSpec, type LevelDef, type MoverSpec, type Vec3 } from '../types'
import { C, CLASSIC, rng } from '../colors'
import { cloud } from './scenery'

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
 * 關卡 2：積木高塔－垂直跳躍
 * 中央彩色高柱，四周以方形螺旋排列 30 塊浮空積木，越往上間距越大、積木越小，
 * 中途有會移動的平台與三個檢查點，頂端是金色獎盃。
 */
export function buildLevel2(): LevelDef {
  const statics: BrickSpec[] = []
  const decor: BrickSpec[] = []
  const movers: MoverSpec[] = []
  const coins: Vec3[] = []
  const checkpoints: { pos: Vec3 }[] = []
  const r = rng(202)

  // 起始浮島
  statics.push({ pos: [0, -BRICK_H, 0], size: [22, BRICK_H, 22], color: C.green })
  decor.push({ pos: [0, -BRICK_H * 2, 0], size: [18, BRICK_H, 18], color: C.darkGreen, collide: false, studs: false })
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
    if ([3, 6, 10, 13, 17, 21, 25, 28].includes(i)) coins.push([p.x, top + 1.5, p.z])
    s += 3.9 + 1.7 * (i / TOWER_STEPS)
  }
  // 塔頂平台
  const g = perimeterPoint(s + 0.8)
  const goalTop = BRICK_H * (TOWER_STEPS + 1)
  statics.push({ pos: [g.x, goalTop - BRICK_H, g.z], size: [6, BRICK_H, 6], color: C.yellow })
  decor.push({ pos: [g.x, goalTop - BRICK_H * 2, g.z], size: [4, BRICK_H, 4], color: C.orange, collide: false, studs: false })

  for (let k = 0; k < 16; k++) {
    const a = r() * Math.PI * 2
    const d = 26 + r() * 30
    decor.push(...cloud(Math.cos(a) * d, -6 + r() * 50, Math.sin(a) * d, r))
  }
  decor.push({ pos: [0, -46, 0], size: [160, BRICK_H, 160], color: C.blue, collide: false, studs: false })

  return {
    id: 2,
    name: '積木高塔',
    subtitle: '垂直跳躍',
    hint: '按住 D（→）沿著螺旋向上，跳上浮空積木直達塔頂！',
    lives: 5,
    parTime: 75,
    requiredCoins: 0,
    sky: '#8AD4F5',
    fog: ['#CFEFFB', 50, 150],
    spawn: [-5, 0.1, 3.6],
    killY: -12,
    fallDepth: 6,
    camera: { distance: 10, height: 5, mode: 'orbit', center: [0, 0, 0] },
    statics, decor, movers, coins, checkpoints,
    switches: [],
    goal: [g.x, goalTop, g.z],
    goalNeedsCoins: false,
    meta: { goalTop },
  }
}
