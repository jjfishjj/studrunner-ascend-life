import { rng } from '../colors'

export const MAZE_CELLS = 7
export const MAZE_TILES = MAZE_CELLS * 2 + 1
export const TILE = 4

export type Cell = [number, number]

export interface Maze {
  /** tiles[r][c] === true 表示牆 */
  walls: boolean[][]
  path: Cell[]
  deadEnds: Cell[]
  start: Cell
  goal: Cell
}

const DIRS: Cell[] = [[1, 0], [-1, 0], [0, 1], [0, -1]]

/** 以種子產生 7x7 迷宮（回溯法），再以 BFS 求出起點到終點的唯一路徑。 */
export function generateMaze(seed: number): Maze {
  const r = rng(seed)
  const n = MAZE_CELLS
  const open = Array.from({ length: n }, () => Array.from({ length: n }, () => [false, false, false, false]))
  const seen = Array.from({ length: n }, () => Array.from({ length: n }, () => false))
  const start: Cell = [0, n - 1]
  const goal: Cell = [n - 1, 0]
  const stack: Cell[] = [start]
  seen[start[1]][start[0]] = true
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1]
    const options: number[] = []
    DIRS.forEach(([dx, dy], i) => {
      const nx = cx + dx, ny = cy + dy
      if (nx >= 0 && ny >= 0 && nx < n && ny < n && !seen[ny][nx]) options.push(i)
    })
    if (!options.length) { stack.pop(); continue }
    const i = options[Math.floor(r() * options.length)]
    const [dx, dy] = DIRS[i]
    const nx = cx + dx, ny = cy + dy
    open[cy][cx][i] = true
    open[ny][nx][i ^ 1] = true
    seen[ny][nx] = true
    stack.push([nx, ny])
  }

  const t = MAZE_TILES
  const walls = Array.from({ length: t }, () => Array.from({ length: t }, () => true))
  for (let cy = 0; cy < n; cy++) {
    for (let cx = 0; cx < n; cx++) {
      walls[cy * 2 + 1][cx * 2 + 1] = false
      DIRS.forEach(([dx, dy], i) => { if (open[cy][cx][i]) walls[cy * 2 + 1 + dy][cx * 2 + 1 + dx] = false })
    }
  }

  // BFS
  const prev = new Map<string, Cell | null>()
  const key = (c: Cell) => `${c[0]},${c[1]}`
  prev.set(key(start), null)
  const queue: Cell[] = [start]
  while (queue.length) {
    const cur = queue.shift()!
    if (cur[0] === goal[0] && cur[1] === goal[1]) break
    DIRS.forEach(([dx, dy], i) => {
      if (!open[cur[1]][cur[0]][i]) return
      const nx: Cell = [cur[0] + dx, cur[1] + dy]
      if (!prev.has(key(nx))) { prev.set(key(nx), cur); queue.push(nx) }
    })
  }
  const path: Cell[] = []
  for (let c: Cell | null | undefined = goal; c; c = prev.get(key(c))) path.unshift(c)

  const onPath = new Set(path.map(key))
  const deadEnds: Cell[] = []
  for (let cy = 0; cy < n; cy++) {
    for (let cx = 0; cx < n; cx++) {
      const degree = open[cy][cx].filter(Boolean).length
      if (degree === 1 && !onPath.has(key([cx, cy]))) deadEnds.push([cx, cy])
    }
  }
  return { walls, path, deadEnds, start, goal }
}

/** 磚格座標轉世界座標（迷宮置中於原點，row 0 在北側 -Z） */
export const tileToWorld = (c: number, r: number): [number, number] => [(c - (MAZE_TILES - 1) / 2) * TILE, (r - (MAZE_TILES - 1) / 2) * TILE]
export const cellToWorld = (cx: number, cy: number): [number, number] => tileToWorld(cx * 2 + 1, cy * 2 + 1)
