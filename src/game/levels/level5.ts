import { BRICK_H, type BrickSpec, type LevelDef, type MoverSpec, type NoteSpec, type Vec3, type GateSpec } from '../types'
import { C, rng } from '../colors'
import { cloud, flower, tree } from './scenery'
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

  // 地板視覺
  for (let rr = 0; rr < T; rr++) {
    for (let c = 0; c < T; c++) {
      if (maze.walls[rr][c]) continue
      const [x, z] = tileToWorld(c, rr)
      if (trapTiles.has(`${c},${rr}`)) {
        decor.push({ pos: [x, -1.6, z], size: [TILE, 0.4, TILE], color: C.black, collide: false, studs: false })
      } else {
        decor.push({ pos: [x, -0.6, z], size: [TILE, 0.4, TILE], color: (c + rr) % 2 ? C.gray : C.white, collide: false })
      }
    }
  }

  // 牆：碰撞以「橫向連續牆段」合併；視覺以三層交錯磚疊起
  const wallColors = [C.red, C.blue, C.yellow, C.green]
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
      const base = wallColors[(rr * 3 + c) % wallColors.length]
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
            color: layer === 1 ? (k % 2 ? C.white : base) : base, collide: false, studs: layer === WALL_LAYERS - 1,
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

  // 外圍裝飾
  // 遠景底板（無凸點，節省繪製量）+ 迷宮外圍一圈有凸點的綠色底板
  decor.push({ pos: [0, -8.4, 0], size: [150, BRICK_H, 150], color: C.darkGreen, collide: false, studs: false })
  const ring = 14
  const span = T * TILE + ring * 2
  decor.push({ pos: [0, -BRICK_H, -(half + ring / 2)], size: [span, BRICK_H, ring], color: C.green, collide: false })
  decor.push({ pos: [0, -BRICK_H, half + ring / 2], size: [span, BRICK_H, ring], color: C.green, collide: false })
  decor.push({ pos: [-(half + ring / 2), -BRICK_H, 0], size: [ring, BRICK_H, T * TILE], color: C.green, collide: false })
  decor.push({ pos: [half + ring / 2, -BRICK_H, 0], size: [ring, BRICK_H, T * TILE], color: C.green, collide: false })
  for (let k = 0; k < 26; k++) {
    const a = (k / 26) * Math.PI * 2 + r() * 0.2
    const d = half + ring + 18 + r() * 14
    decor.push(...tree(Math.cos(a) * d, Math.sin(a) * d, -7.2, 2.6 + r() * 1.4))
  }
  // 迷宮外圈的小樹與花
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 + r() * 0.3
    const d = half + 3 + r() * (ring - 5)
    const x = Math.max(-half - ring + 2, Math.min(half + ring - 2, Math.cos(a) * d * 1.05))
    const z = Math.max(-half - ring + 2, Math.min(half + ring - 2, Math.sin(a) * d * 1.05))
    if (Math.abs(x) < half + 1.5 && Math.abs(z) < half + 1.5) continue
    decor.push(...(k % 3 ? flower(x, z, 0, [C.red, C.yellow, C.white][k % 3]) : tree(x, z, 0, 1.1)))
  }
  for (let k = 0; k < 8; k++) decor.push(...cloud((r() - 0.5) * 120, 16 + r() * 10, (r() - 0.5) * 120, r))

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
    sky: '#9DE0C4',
    fog: ['#C9F0DC', 60, 170],
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
    meta: { pathLength: L, noteCells: noteBranches.map(b => b.cell), noteOrigins: noteBranches.map(b => b.origin) },
  }
}
