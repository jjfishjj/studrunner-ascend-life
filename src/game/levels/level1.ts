import { BRICK_H, type BrickSpec, type LevelDef, type MoverSpec, type NoteSpec, type Vec3 } from '../types'
import { C, rng } from '../colors'
import { cloud, tower, tree } from './scenery'

/**
 * 一階「自我與原生家庭」－原點大道（新手教學）
 * 一條沿 -Z 延伸的直線大道（x ∈ [-6, 6]，路面頂部 y = 0），
 * 中段有三道左右滑動的樂高牆，之後是一個缺口與可跳越的矮牆。
 * 路上散落 10 枚金幣（星等用）與 4 張筆記磚（01～04）；集齊筆記磚終點閘門才會打開。
 */
export function buildLevel1(): LevelDef {
  const statics: BrickSpec[] = []
  const decor: BrickSpec[] = []
  const r = rng(101)

  // 路段：[起點 z, 終點 z]（z 遞減）
  const sections: [number, number][] = [[6, -50], [-54, -96]]
  for (const [z0, z1] of sections) {
    const len = z0 - z1
    // 僅碰撞的整段路面
    statics.push({ pos: [0, -BRICK_H, (z0 + z1) / 2], size: [12, BRICK_H, len], color: C.darkGray, visible: false })
    // 視覺：每 4 格一段，中間深灰、兩側紅白相間路緣
    let i = 0
    for (let z = z0; z > z1; z -= 4, i++) {
      const d = Math.min(4, z - z1)
      const cz = z - d / 2
      statics.push({ pos: [0, -BRICK_H, cz], size: [10, BRICK_H, d], color: i % 2 ? C.darkGray : C.gray, collide: false })
      const curb = i % 2 ? C.red : C.white
      statics.push({ pos: [-5.5, -BRICK_H, cz], size: [1, BRICK_H, d], color: curb, collide: false })
      statics.push({ pos: [5.5, -BRICK_H, cz], size: [1, BRICK_H, d], color: curb, collide: false })
    }
  }

  // 後段：可跳越的矮牆（高 1 塊積木）
  statics.push({ pos: [-3, 0, -63], size: [6, BRICK_H, 2], color: C.yellow })
  statics.push({ pos: [3, 0, -70], size: [6, BRICK_H, 2], color: C.blue })
  statics.push({ pos: [0, 0, -78], size: [12, BRICK_H, 2], color: C.green })

  // 移動的樂高牆（危險）
  const walls: [number, string, number, number][] = [[-16, C.red, 1.0, 0], [-28, C.blue, 1.3, 2.1], [-40, C.yellow, 1.6, 4.2]]
  const movers: MoverSpec[] = walls.map(([z, color, speed, phase], k) => ({
    id: `wall-${k}`,
    hazard: true,
    brick: { pos: [0, 0, z], size: [5, BRICK_H * 2, 1.6], color },
    motion: { type: 'slide', axis: 'x', amp: 3.5, speed, phase },
  }))

  // 終點拱門（裝飾）
  for (const x of [-6.75, 6.75]) {
    for (let k = 0; k < 5; k++) decor.push({ pos: [x, k * BRICK_H, -90], size: [1.5, BRICK_H, 1.5], color: k % 2 ? C.white : C.black, collide: false, studs: false })
  }
  for (let k = 0; k < 8; k++) {
    decor.push({ pos: [-7 + k * 2 + 1, 5 * BRICK_H, -90], size: [2, BRICK_H, 1.5], color: k % 2 ? C.black : C.white, collide: false })
  }

  // 背景：下方綠色底板與兩側風景
  decor.push({ pos: [0, -8.4, -45], size: [64, BRICK_H, 120], color: C.green, collide: false, studs: false })
  // 根脈溪：沿大道兩側向下游延伸，四張筆記磚依序對應覺察、感恩、種子與家園。
  decor.push({ pos: [-24, -7.85, -45], size: [6, 0.12, 116], color: '#48B7C5', collide: false, studs: false })
  decor.push({ pos: [24, -7.85, -45], size: [6, 0.12, 116], color: '#48B7C5', collide: false, studs: false })
  ;[-40, -29, -17, -3, 13, 27, 39].forEach((z, k) => decor.push({ pos: [k % 2 ? -20 : 20, -7.6, z], size: [2, 0.18, 2], color: k % 2 ? '#B6E5D8' : '#F2CD37', collide: false, studs: false }))
  for (let z = 0; z > -100; z -= 9) {
    for (const side of [-1, 1]) {
      const x = side * (13 + r() * 7)
      if (r() < 0.55) decor.push(...tree(x, z + r() * 4, -7.2, 1 + r() * 0.4))
      else decor.push(...tower(x, z + r() * 4, -7.2, 4 + Math.floor(r() * 8), r))
    }
  }
  for (let k = 0; k < 9; k++) decor.push(...cloud((r() - 0.5) * 70, 14 + r() * 8, -k * 12 + 10, r))

  const coins: Vec3[] = [
    [0, 1.4, -6], [-3, 1.4, -11], [3, 1.4, -22], [-3, 1.4, -34], [0, 1.4, -46],
    [0, 2.6, -52], [-3, 2.5, -63], [3, 2.5, -70], [0, 2.5, -78], [0, 1.4, -83],
  ]

  const notes: NoteSpec[] = [
    { id: '01', pos: [3, 1.9, -9] },
    { id: '02', pos: [0, 1.9, -34] },
    { id: '03', pos: [3, 1.9, -59] },
    { id: '04', pos: [0, 1.9, -74] },
  ]
  return {
    id: 1,
    name: '原點大道',
    subtitle: '自我與原生家庭',
    hint: '集齊 4 張筆記磚才能打開終點閘門；金幣越多，星星越多。',
    lives: 3,
    parTime: 45,
    requiredCoins: 0,
    sky: '#7CCBF2',
    fog: ['#BDE6F7', 40, 130],
    spawn: [0, 0.1, 2],
    killY: -5,
    camera: { distance: 9, height: 4.6, mode: 'follow', yaw: 0 },
    statics, decor, movers, coins,
    checkpoints: [{ pos: [0, 0, -57] }],
    gate: { brick: { pos: [0, 0, -86], size: [12, BRICK_H * 3, 1], color: C.red }, sink: 3.9, mode: 'notes' },
    switches: [],
    goal: [0, 0, -91],
    notes,
    goalNeedsNotes: true,
    nature: {
      falls: [],
      waves: [
        { x0: -27, x1: -21, z0: 8, z1: -98, y: -7.72 },
        { x0: 21, x1: 27, z0: 8, z1: -98, y: -7.72 },
      ],
      crabs: [], boats: [],
      flyers: [
        { center: [-11, 9, -13], radius: 3.5, kind: 'bird', color: C.yellow },
        { center: [12, 11, -47], radius: 4.5, kind: 'bird', color: C.white },
        { center: [-10, 10, -77], radius: 3, kind: 'butterfly', color: C.orange },
      ],
      zones: [
        { kind: 'forest', pos: [0, -15], radius: 43 },
        { kind: 'forest', pos: [0, -65], radius: 48 },
        { kind: 'river', pos: [-24, -40], radius: 32 },
        { kind: 'river', pos: [24, -72], radius: 32 },
        { kind: 'birds', pos: [0, -37], radius: 52 },
      ],
    },
  }
}
