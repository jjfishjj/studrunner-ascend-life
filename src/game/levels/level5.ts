import { BRICK_H, type BrickSpec, type LevelDef, type MoverSpec, type NoteSpec, type Vec3, type GateSpec } from '../types'
import { C, rng } from '../colors'
import { cloud, flower } from './scenery'
import {
  N, biomeAt, beachBall, bush, cliff, driftwood, fern, jungleTree, lifeguard, lilypad, log, mushroom, palm, pier, pond,
  rainbow, rocks, sandcastle, shell, starfish, surfboard, umbrella, vine,
} from './nature'
import { MAZE_TILES, TILE, cellToWorld, generateMaze, tileToWorld } from './maze'

export const MAZE_SEED = 303
export const WALL_LAYERS = 3
export const WALL_H = BRICK_H * WALL_LAYERS

/** 以主路為起點做 BFS，找出離主路最近的死路（回傳依主路順序排列的前 4 條）。 */
export function pickNoteDeadEnds(maze: ReturnType<typeof generateMaze>, skipFrom: number, skipTo: number): { cell: [number, number]; origin: number; dist: number }[] {
  const T = MAZE_TILES
  const dist = Array.from({ length: T }, () => Array.from({ length: T }, () => -1))
  const origin = Array.from({ length: T }, () => Array.from({ length: T }, () => -1))
  const queue: [number, number][] = []
  maze.path.forEach(([cx, cy], i) => { dist[cy * 2 + 1][cx * 2 + 1] = 0; origin[cy * 2 + 1][cx * 2 + 1] = i; queue.push([cx * 2 + 1, cy * 2 + 1]) })
  for (let h = 0; h < queue.length; h++) {
    const [c, rr] = queue[h]
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = rr + dr
      if (nc < 0 || nr < 0 || nc >= T || nr >= T || maze.walls[nr][nc] || dist[nr][nc] >= 0) continue
      dist[nr][nc] = dist[rr][c] + 1
      origin[nr][nc] = origin[rr][c]
      queue.push([nc, nr])
    }
  }
  const cands = maze.deadEnds
    .map(([cx, cy]) => ({ cell: [cx, cy] as [number, number], origin: origin[cy * 2 + 1][cx * 2 + 1], dist: dist[cy * 2 + 1][cx * 2 + 1] }))
    .filter(b => b.origin >= 2 && !(b.origin >= skipFrom && b.origin <= skipTo))
    .sort((a, b) => a.dist - b.dist || a.origin - b.origin)
  return cands.slice(0, 4).sort((a, b) => a.origin - b.origin)
}

/**
 * 五階「合一與環境能量」－合一迷宮（終極挑戰）
 * 綠意環繞的 7x7 迷宮；四張筆記磚（17～20）藏在離主路最近的四條死路；路上有旋轉的低矮橫桿（跳過去）、週期升起的紅色陷阱塊、
 * 以及「踩下藍色按鈕後只開 12 秒」的限時閘門，整關另有倒數計時。
 */
export function buildLevel5(): LevelDef {
  const maze = generateMaze(MAZE_SEED)
  const statics: BrickSpec[] = []
  const decor: BrickSpec[] = []
  const movers: MoverSpec[] = []
  const coins: Vec3[] = []
  const r = rng(404)
  const T = MAZE_TILES
  const half = (T * TILE) / 2

  // 地面碰撞板（含外圈）
  statics.push({ pos: [0, -BRICK_H, 0], size: [T * TILE, BRICK_H, T * TILE], color: C.gray, visible: false })

  // 路徑上的特殊格
  const L = maze.path.length
  const cellOf = (i: number) => cellToWorld(maze.path[i][0], maze.path[i][1])
  const passOf = (i: number): { x: number; z: number; horizontal: boolean } => {
    const [ax, az] = cellOf(i)
    const [bx, bz] = cellOf(i + 1)
    return { x: (ax + bx) / 2, z: (az + bz) / 2, horizontal: maze.path[i][1] === maze.path[i + 1][1] }
  }
  const spinnerAt = [Math.round(L * 0.2), Math.round(L * 0.62), Math.round(L * 0.84)]
  const checkpointAt = Math.round(L * 0.4)
  const switchAt = Math.round(L * 0.5)
  const gateAt = Math.min(L - 4, switchAt + 5)
  const trapPass = [Math.round(L * 0.1), Math.round(L * 0.3), switchAt + 2, Math.round(L * 0.74)]

  // 預先標記「陷阱磚格」，地板視覺改為凹槽
  const trapTiles = new Set<string>()
  const trapSpecs: { x: number; z: number; phase: number; period: number }[] = []
  trapPass.forEach((idx, k) => {
    const p = passOf(idx)
    trapSpecs.push({ x: p.x, z: p.z, phase: k * 0.9, period: 2.6 + (k % 2) * 0.4 })
    const c = Math.round(p.x / TILE + (T - 1) / 2), rr = Math.round(p.z / TILE + (T - 1) / 2)
    trapTiles.add(`${c},${rr}`)
  })

  // 地板視覺：依生態區換色（海灘＝沙地、叢林＝泥土、瀑布區＝潮濕岩石）
  const floorColor = (c: number, rr: number) => {
    const [x, z] = tileToWorld(c, rr)
    const k = (c + rr) % 2
    const bio = biomeAt(x, z)
    if (bio === 'beach') return k ? N.sand : N.sandDark
    if (bio === 'jungle') return k ? N.dirt : '#8A6A43'
    return k ? C.gray : N.wet
  }
  for (let rr = 0; rr < T; rr++) {
    for (let c = 0; c < T; c++) {
      if (maze.walls[rr][c]) continue
      const [x, z] = tileToWorld(c, rr)
      if (trapTiles.has(`${c},${rr}`)) {
        decor.push({ pos: [x, -1.6, z], size: [TILE, 0.4, TILE], color: C.black, collide: false, studs: false })
      } else {
        decor.push({ pos: [x, -0.6, z], size: [TILE, 0.4, TILE], color: floorColor(c, rr), collide: false })
      }
    }
  }
  // 牆：碰撞以「橫向連續牆段」合併；視覺以三層交錯磚疊起
  const wallColor = (bio: ReturnType<typeof biomeAt>, layer: number, k: number) => {
    if (bio === 'beach') return layer === 0 ? N.sandDark : layer === 1 ? (k % 2 ? C.white : N.sandLight) : N.sandLight
    if (bio === 'jungle') return layer === 0 ? N.trunk : layer === 1 ? N.leafDark : (k % 2 ? N.leaf : N.leafLight)
    return layer === 0 ? C.darkGray : layer === 1 ? C.gray : (k % 2 ? C.gray : C.darkGray)
  }
  for (let rr = 0; rr < T; rr++) {
    let c = 0
    while (c < T) {
      if (!maze.walls[rr][c]) { c++; continue }
      let e = c
      while (e + 1 < T && maze.walls[rr][e + 1]) e++
      const len = e - c + 1
      const [x0, z] = tileToWorld(c, rr)
      const [x1] = tileToWorld(e, rr)
      const cx = (x0 + x1) / 2
      const w = len * TILE
      statics.push({ pos: [cx, 0, z], size: [w, WALL_H, TILE], color: C.red, visible: false })
      const bio = biomeAt(x0, z)
      for (let layer = 0; layer < WALL_LAYERS; layer++) {
        // 每層以不同切點分段，製造磚牆交錯縫
        let t0 = 0
        const cuts: number[] = []
        let step = layer % 2 ? 2 : 3
        while (t0 < len) { const n = Math.min(len - t0, step); cuts.push(n); t0 += n; step = layer % 2 ? 3 : 2 }
        let o = 0
        cuts.forEach((n, k) => {
          const bw = n * TILE
          const bx = x0 - TILE / 2 + o * TILE + bw / 2
          statics.push({
            pos: [bx, layer * BRICK_H, z], size: [bw - 0.04, BRICK_H, TILE - 0.04],
            color: wallColor(bio, layer, k + c), collide: false, studs: layer === WALL_LAYERS - 1,
          })
          o += n
        })
      }
      c = e + 1
    }
  }

  // 旋轉橫桿（低矮：跳過去！）
  spinnerAt.forEach((idx, k) => {
    const [x, z] = cellOf(idx)
    movers.push({
      id: `spin-${k}`, hazard: true,
      brick: { pos: [x, 0, z], size: [TILE - 0.3, BRICK_H, 0.9], color: k % 2 ? C.yellow : C.red },
      motion: { type: 'spin', speed: (k % 2 ? -1 : 1) * (1.7 + k * 0.25), phase: k },
    })
    // 中心軸
    decor.push({ pos: [x, 0, z], size: [1, BRICK_H + 0.4, 1], color: C.black, collide: false })
  })

  // 陷阱塊
  trapSpecs.forEach((t, k) => {
    movers.push({
      id: `trap-${k}`, hazard: true,
      brick: { pos: [t.x, 0, t.z], size: [TILE - 0.3, BRICK_H, TILE - 0.3], color: C.red },
      motion: { type: 'pulse', rise: BRICK_H, period: t.period, up: 0.4, phase: t.phase },
    })
  })

  // 限時閘門
  const gp = passOf(gateAt)
  const gate: GateSpec = {
    brick: { pos: [gp.x, 0, gp.z], size: gp.horizontal ? [1.2, WALL_H, TILE] : [TILE, WALL_H, 1.2], color: C.blue },
    sink: WALL_H + 0.4, mode: 'switch', openSeconds: 12,
  }
  const [sx, sz] = cellOf(switchAt)

  // 筆記磚：挑離主路最近的死路（避開起點、按鈕到閘門之間的路段，以免耽誤限時機關）
  const noteBranches = pickNoteDeadEnds(maze, switchAt - 1, gateAt + 1)
  const notes: NoteSpec[] = noteBranches.map((b, k) => {
    const [x, z] = cellToWorld(b.cell[0], b.cell[1])
    return { id: String(17 + k), pos: [x, 1.9, z] as Vec3 }
  })
  const noteKeys = new Set(noteBranches.map(b => `${b.cell[0]},${b.cell[1]}`))
  // 金幣：其餘死路優先，再補在路上
  maze.deadEnds.filter(([cx, cy]) => !noteKeys.has(`${cx},${cy}`)).slice(0, 6).forEach(([cx, cy]) => { const [x, z] = cellToWorld(cx, cy); coins.push([x, 1.4, z]) })
  ;[Math.round(L * 0.3), Math.round(L * 0.7)].forEach(i => { const [x, z] = cellOf(i); coins.push([x, 1.4, z]) })

  // ───────────── 外圍自然場景 ─────────────
  // 南側：沙灘 + 大海；北側：潟湖 + 岩壁瀑布；東西側：叢林
  const ring = 14
  const outer = half + ring
  const span = T * TILE + ring * 2
  const fl = -BRICK_H
  decor.push({ pos: [0, -8.4, 0], size: [150, BRICK_H, 150], color: C.darkGreen, collide: false, studs: false }) // 遠景底板
  decor.push({ pos: [-(half + ring / 2), fl, 0], size: [ring, BRICK_H, T * TILE], color: C.green, collide: false })
  decor.push({ pos: [half + ring / 2, fl, 0], size: [ring, BRICK_H, T * TILE], color: C.green, collide: false })
  decor.push({ pos: [-outer / 2, fl, -(half + ring / 2)], size: [outer, BRICK_H, ring], color: C.green, collide: false })
  decor.push({ pos: [0, fl, half + ring / 2], size: [span, BRICK_H, ring], color: N.sand, collide: false }) // 沙灘
  decor.push({ pos: [0, 0, outer - 1], size: [span, 0.2, 2], color: N.sandDark, collide: false, studs: false }) // 濕沙
  // 大海（淺水 → 深水）
  decor.push({ pos: [0, -1.7, outer + 40], size: [240, 1, 80], color: N.water, collide: false, studs: false })
  decor.push({ pos: [0, -0.75, outer + 4], size: [240, 0.1, 8], color: N.waterShallow, collide: false, studs: false })
  decor.push({ pos: [0, -0.72, outer + 58], size: [240, 0.04, 44], color: N.waterDeep, collide: false, studs: false })
  // 北側潟湖（水面比地面低一點）與岩壁
  decor.push({ pos: [outer / 2, -1.4, -(half + 8)], size: [outer, 1, 16], color: N.water, collide: false, studs: false })
  decor.push({ pos: [outer / 2, -0.55, -(half + 1.5)], size: [outer, 0.2, 3], color: N.waterShallow, collide: false, studs: false })
  const FX = 14
  decor.push(...cliff([
    { x: 18, w: 64, z: -53, d: 14, h: 8.4, color: C.darkGray },
    { x: 16, w: 48, z: -56, d: 12, h: 7.2, color: C.gray },
    { x: 14, w: 32, z: -58, d: 10, h: 6, color: C.darkGray },
  ], -1.2))
  decor.push({ pos: [FX, 14.4, -51.5], size: [7, 0.25, 3.2], color: N.waterShallow, collide: false, studs: false })
  decor.push({ pos: [FX, 7.2, -48], size: [7, 0.25, 4], color: N.waterShallow, collide: false, studs: false })
  decor.push({ pos: [FX, 20.4, -58], size: [10, 0.25, 8], color: N.water, collide: false, studs: false })
  decor.push({ pos: [44, 7.2, -48], size: [3, 0.25, 4], color: N.waterShallow, collide: false, studs: false })
  decor.push(...jungleTree(5, -57, 20.4, 0.55), ...jungleTree(26, -57, 20.4, 0.6), ...rocks(20, -61, 20.4, 0.8), ...fern(8, -52.6, 20.4))
  decor.push(...jungleTree(-3, -54, 14.4, 0.5), ...jungleTree(34, -55, 14.4, 0.55), ...bush(38, -49, 14.4))
  decor.push(...jungleTree(-8, -50, 7.2, 0.6), ...jungleTree(46, -52, 7.2, 0.6), ...rocks(30, -47, 7.2, 0.8))
  decor.push(...rainbow(FX, -0.4, -41, 14))
  // 潟湖裡的睡蓮與踏石
  for (let k = 0; k < 8; k++) decor.push(...lilypad(2 + r() * 40, -(33 + r() * 10), -0.45))
  decor.push(...rocks(30, -38, -0.45, 1), ...rocks(6, -41, -0.45, 0.8), ...rocks(40, -34, -0.45, 0.9))
  // 南側沙灘：棕櫚、陽傘、沙堡、救生台、衝浪板……
  const beachY = 0
  ;[-40, -29, -17, -3, 13, 27, 39].forEach((x, k) => decor.push(...palm(x, 34 + (k % 3) * 3.4, beachY, 3.6 + (k % 3) * 0.6, k % 2 ? 1 : -1)))
  decor.push(...umbrella(-24, 38, beachY, C.red), ...umbrella(-9, 40, beachY, C.blue), ...umbrella(21, 38, beachY, C.yellow), ...umbrella(33, 41, beachY, C.green))
  decor.push(...sandcastle(-34, 40, beachY, 1.1), ...sandcastle(29, 33, beachY, 0.9), ...lifeguard(6, 37, beachY))
  decor.push(...surfboard(-20, 34.6, beachY, C.red), ...surfboard(-18.8, 34.6, beachY, C.yellow), ...surfboard(-17.6, 34.6, beachY, C.blue))
  decor.push(...beachBall(0, 41, beachY), ...beachBall(-30, 33, beachY), ...driftwood(16, 42, beachY), ...driftwood(-36, 43, beachY))
  for (let k = 0; k < 14; k++) {
    const x = -40 + r() * 80, z = 31 + r() * 12
    decor.push(...(k % 2 ? starfish(x, z, beachY + 0.2, k % 4 === 1 ? N.coral : C.orange) : shell(x, z, beachY + 0.2)))
  }
  decor.push(...pier(-12, outer, -0.1, 20))
  // 東西側叢林：大樹、灌木、蕨類、蘑菇、倒木、水塘
  const jungleSpots: [number, number, number][] = [
    [-38, -24, 1.1], [-36, -10, 1.2], [-39, 4, 1.0], [-35, 18, 1.15],
    [38, -22, 1.1], [37, -8, 1.0], [39, 8, 1.2], [36, 21, 1.1],
    [-30, -40, 1.1], [-15, -39, 1.0],
  ]
  jungleSpots.forEach(([x, z, sc]) => decor.push(...jungleTree(x, z, 0, sc)))
  for (let k = 0; k < 26; k++) {
    const side = k % 2 ? 1 : -1
    const x = side * (31.5 + r() * 11)
    const z = -34 + r() * 66
    const pick = k % 5
    if (pick === 0) decor.push(...bush(x, z, 0, 2 + r()))
    else if (pick === 1) decor.push(...fern(x, z, 0))
    else if (pick === 2) decor.push(...mushroom(x, z, 0, 0.9 + r() * 0.5))
    else if (pick === 3) decor.push(...flower(x, z, 0, [C.red, C.yellow, C.white, C.orange][k % 4]))
    else decor.push(...log(x, z, 0, k % 3 === 0))
  }
  decor.push(...pond(39, 0, 0, 5, 7), ...lilypad(38, -1, 0.4), ...lilypad(40, 1.4, 0.4), ...pond(-38, 12, 0, 4, 5), ...lilypad(-38, 12, 0.4))
  // 遠景：叢林巨樹與雲
  for (let k = 0; k < 18; k++) {
    const side = k % 2 ? 1 : -1
    decor.push(...jungleTree(side * (56 + r() * 14), -50 + r() * 100, -7.2, 1.8 + r() * 0.8))
  }
  for (let k = 0; k < 8; k++) decor.push(...cloud((r() - 0.5) * 120, 16 + r() * 10, (r() - 0.5) * 120, r))
  // ───────────── 迷宮內部：牆頂植被與走道點綴（僅視覺，不影響碰撞） ─────────────
  const r2 = rng(909)
  const keep: [number, number][] = [cellOf(0), cellOf(L - 1), cellOf(checkpointAt), cellOf(switchAt), ...notes.map(n => [n.pos[0], n.pos[2]] as [number, number])]
  for (let rr = 0; rr < T; rr++) {
    for (let c = 0; c < T; c++) {
      const [x, z] = tileToWorld(c, rr)
      const bio = biomeAt(x, z)
      const roll = r2()
      if (maze.walls[rr][c]) {
        const top = WALL_H
        if (bio === 'beach') {
          if (roll < 0.13) decor.push(...palm(x, z, top, 2.4, roll < 0.065 ? 1 : -1))
          else if (roll < 0.22) decor.push(...umbrella(x, z, top, [C.red, C.blue, C.yellow][(c + rr) % 3]))
          else if (roll < 0.3) decor.push(...sandcastle(x, z, top, 0.8))
          else if (roll < 0.42) decor.push(...(roll < 0.36 ? starfish(x, z, top, N.coral) : shell(x, z, top)))
        } else if (bio === 'jungle') {
          if (roll < 0.34) decor.push(...bush(x, z, top, 2.6))
          else if (roll < 0.46) decor.push(...fern(x, z, top))
          else if (roll < 0.54) decor.push(...mushroom(x, z, top, 0.9))
          else if (roll < 0.62) decor.push(...palm(x, z, top, 2.4, 1))
          // 垂掛的藤蔓：貼在面向走道的牆面
          for (const [dc, dr, dir] of [[1, 0, '+x'], [-1, 0, '-x'], [0, 1, '+z'], [0, -1, '-z']] as const) {
            const nc = c + dc, nr = rr + dr
            if (nc < 0 || nr < 0 || nc >= T || nr >= T || maze.walls[nr][nc]) continue
            if (r2() < 0.45) decor.push(...vine(x, z, 0, WALL_H - 0.3, dir))
          }
        } else {
          if (roll < 0.3) decor.push(...rocks(x, z, top, 0.9))
          else if (roll < 0.42) decor.push(...bush(x, z, top, 2.2))
          else if (roll < 0.5) decor.push(...mushroom(x, z, top, 0.8))
        }
      } else if (roll < 0.28 && !trapTiles.has(`${c},${rr}`) && !keep.some(([kx, kz]) => Math.hypot(kx - x, kz - z) < TILE * 0.9)) {
        const ox = (r2() - 0.5) * 2.4, oz = (r2() - 0.5) * 2.4
        if (bio === 'beach') decor.push(...(roll < 0.14 ? starfish(x + ox, z + oz, -0.2, N.coral) : shell(x + ox, z + oz, -0.2)))
        else if (bio === 'jungle') decor.push({ pos: [x + ox, -0.2, z + oz], size: [0.9, 0.1, 0.6], color: roll < 0.14 ? N.lime : N.leaf, collide: false, studs: false })
        else decor.push({ pos: [x + ox, -0.2, z + oz], size: [1.8, 0.08, 1.3], color: N.waterShallow, collide: false, studs: false })
      }
    }
  }
  const [spx, spz] = cellOf(0)
  const [gx, gz] = cellOf(L - 1)
  const [cpx, cpz] = cellOf(checkpointAt)

  return {
    id: 5,
    name: '合一迷宮',
    subtitle: '合一與環境能量',
    hint: '到死路撿齊 4 張筆記磚，跳過旋轉橫桿、躲開紅色陷阱，踩下藍色按鈕後 12 秒內衝過閘門！',
    lives: 5,
    timeLimit: 120,
    parTime: 60,
    requiredCoins: 0,
    sky: '#8FD8F2',
    fog: ['#CDEFF2', 70, 200],
    spawn: [spx, 0.1, spz],
    killY: -6,
    camera: { distance: 5, height: 20, mode: 'follow', yaw: 0 },
    statics, decor, movers, coins,
    checkpoints: [{ pos: [cpx, 0, cpz] }],
    gate,
    switches: [{ pos: [sx, 0, sz] }],
    goal: [gx, 0, gz],
    notes,
    goalNeedsNotes: true,
    nature: {
      falls: [
        { x: FX, z: -45.5, y0: -0.4, y1: 7.2, w: 7 }, { x: FX, z: -49.5, y0: 7.2, y1: 14.4, w: 7 },
        { x: FX, z: -52.5, y0: 14.4, y1: 20.4, w: 7 }, { x: 44, z: -45.5, y0: -0.4, y1: 7.2, w: 3 },
      ],
      waves: [{ x0: -110, x1: 110, z0: outer + 1.5, z1: outer + 34, y: -0.62 }],
      crabs: [
        { x: -6, z: 40, y: 0.2, range: 5 }, { x: 24, z: 35, y: 0.2, range: 4 }, { x: -33, z: 36, y: 0.2, range: 3 },
        { x: 12, z: 43, y: 0.2, range: 4 },
      ],
      boats: [{ pos: [24, -0.7, 64] }, { pos: [-32, -0.7, 76] }, { pos: [52, -0.7, 88] }],
      flyers: [
        { center: [-37, 6, -10], radius: 5, kind: 'butterfly', color: C.yellow }, { center: [-37, 6, 14], radius: 5, kind: 'butterfly', color: C.orange },
        { center: [38, 6, -6], radius: 5, kind: 'butterfly', color: C.white }, { center: [-8, 5.4, -6], radius: 7, kind: 'butterfly', color: C.orange },
        { center: [10, 5.4, 4], radius: 6, kind: 'butterfly', color: C.yellow },
        { center: [-10, 13, 52], radius: 12, kind: 'bird', color: C.white }, { center: [22, 15, 62], radius: 10, kind: 'bird', color: C.white },
        { center: [-32, 12, -14], radius: 8, kind: 'bird', color: C.red }, { center: [32, 12, 12], radius: 8, kind: 'bird', color: C.blue },
      ],
      zones: [
        { kind: 'sea', pos: [-35, 58], radius: 58 }, { kind: 'sea', pos: [0, 58], radius: 58 }, { kind: 'sea', pos: [35, 58], radius: 58 },
        { kind: 'falls', pos: [FX, -46], radius: 62 },
        { kind: 'river', pos: [FX, -46], radius: 44 },
        { kind: 'birds', pos: [FX, -47], radius: 55 },
        { kind: 'insects', pos: [-37, 0], radius: 34 },
        { kind: 'forest', pos: [37, 0], radius: 46 },
        { kind: 'jungle', pos: [-37, 0], radius: 48 }, { kind: 'jungle', pos: [37, 0], radius: 48 }, { kind: 'jungle', pos: [0, 0], radius: 42 },
      ],
    },
    meta: { pathLength: L, noteCells: noteBranches.map(b => b.cell), noteOrigins: noteBranches.map(b => b.origin) },
  }
}
