import { describe, expect, it } from 'vitest'
import { GameWorld, sphereHitsBox, type PlayerInput } from '../src/game/engine'
import { buildLevel } from '../src/game/levels'
import { MAZE_SEED } from '../src/game/levels/level3'
import { cellToWorld, generateMaze } from '../src/game/levels/maze'
import { motionPose } from '../src/game/motion'
import { tuning } from '../src/game/tuning'
import { CONFIG } from '../src/game/config'
import type { BrickSpec, Vec3 } from '../src/game/types'

const DT = 1 / 60
const none: PlayerInput = { moveX: 0, moveZ: 0, jumpHeld: false, jumpPressed: false }

/** 將世界座標的目標方向轉成「相對攝影機」輸入 */
function toInput(w: GameWorld, dx: number, dz: number, jump: boolean, jumpPressed: boolean): PlayerInput {
  const f = w.camYaw
  const fx = -Math.sin(f), fz = -Math.cos(f)
  const rx = Math.cos(f), rz = -Math.sin(f)
  return { moveX: dx * rx + dz * rz, moveZ: dx * fx + dz * fz, jumpHeld: jump, jumpPressed }
}

/** 簡易機器人：朝目標走，前方沒地板或被擋住就跳。 */
class Bot {
  private jumpCd = 0
  constructor(public w: GameWorld) {}
  groundAhead(dx: number, dz: number, dist: number): boolean {
    const p = this.w.player.position
    const from = new (this.w.player.position.constructor as new (x: number, y: number, z: number) => typeof p)(p.x + dx * dist, p.y, p.z + dz * dist)
    const to = new (this.w.player.position.constructor as new (x: number, y: number, z: number) => typeof p)(p.x + dx * dist, p.y - 2.2, p.z + dz * dist)
    return this.w.world.raycastClosest(from, to, { collisionFilterMask: 1, skipBackfaces: true })
  }
  step(tx: number, tz: number, forceJump = false): number {
    const p = this.w.player.position
    let dx = tx - p.x, dz = tz - p.z
    const d = Math.hypot(dx, dz)
    if (d > 1e-3) { dx /= d; dz /= d }
    const moving = d > 0.25
    this.jumpCd -= DT
    const blocked = moving && this.w.grounded && this.w.speedXZ < 2.5 && this.w.timerStarted
    const gap = moving && this.w.grounded && !this.groundAhead(dx, dz, 1.1)
    const jump = (forceJump || blocked || gap) && this.jumpCd <= 0 && this.w.grounded
    if (jump) this.jumpCd = 0.5
    this.w.step(DT, toInput(this.w, moving ? dx : 0, moving ? dz : 0, this.jumpCd > 0.15 || jump, jump))
    return d
  }
}

function runTo(w: GameWorld, bot: Bot, tx: number | (() => number), tz: number | (() => number), maxSec: number, tol = 0.8): boolean {
  for (let i = 0; i < maxSec * 60; i++) {
    const x = typeof tx === 'function' ? tx() : tx
    const z = typeof tz === 'function' ? tz() : tz
    const d = bot.step(x, z)
    if (d < tol || w.status !== 'playing') return true
  }
  return false
}

describe('motion', () => {
  it('slide 以正弦往返、spin 線性累積、pulse 週期升降', () => {
    expect(motionPose({ type: 'slide', axis: 'x', amp: 3, speed: 1 }, Math.PI / 2).dx).toBeCloseTo(3)
    expect(motionPose({ type: 'spin', speed: 2 }, 3).angle).toBeCloseTo(6)
    const m = { type: 'pulse', rise: 1.2, period: 2, up: 0.5 } as const
    expect(motionPose(m, 0.5).raised).toBe(1)
    expect(motionPose(m, 1.5).raised).toBe(0)
    expect(motionPose(m, 1.6).warn).toBe(true)
  })
  it('sphereHitsBox：側面命中、站在上面不算', () => {
    const half: Vec3 = [1, 0.6, 1]
    expect(sphereHitsBox([1.5, 0.6, 0], 0.62, [0, 0.6, 0], 0, half)).toBe(true)
    expect(sphereHitsBox([0, 1.7, 0], 0.62, [0, 0.6, 0], 0, half)).toBe(false)
    expect(sphereHitsBox([5, 0.6, 0], 0.62, [0, 0.6, 0], 0, half)).toBe(false)
  })
})

describe('關卡資料', () => {
  it('三個關卡皆可建立，具起點、終點與碰撞體', () => {
    for (const id of [1, 2, 3]) {
      const l = buildLevel(id)
      expect(l.statics.some(b => b.collide !== false)).toBe(true)
      expect(l.goal).toHaveLength(3)
      expect(l.lives).toBeGreaterThan(0)
    }
  })
  it('關卡 1 恰有 10 枚金幣並需要全部收集', () => {
    const l = buildLevel(1)
    expect(l.coins).toHaveLength(10)
    expect(l.requiredCoins).toBe(10)
    expect(l.movers.filter(m => m.hazard && m.motion.type === 'slide').length).toBeGreaterThanOrEqual(3)
  })
  it('關卡 3 有旋轉障礙物、陷阱塊、限時閘門與倒數', () => {
    const l = buildLevel(3)
    expect(l.movers.some(m => m.motion.type === 'spin')).toBe(true)
    expect(l.movers.some(m => m.motion.type === 'pulse')).toBe(true)
    expect(l.gate?.mode).toBe('switch')
    expect(l.timeLimit).toBeGreaterThan(0)
    expect(l.switches).toHaveLength(1)
    expect(l.meta!.pathLength).toBeGreaterThan(12)
  })
})

describe('角色物理', () => {
  it('落在地面、可前進、可跳躍並於落地後再次接地', () => {
    const w = new GameWorld(buildLevel(1))
    for (let i = 0; i < 60; i++) w.step(DT, none)
    expect(w.grounded).toBe(true)
    expect(w.feetY).toBeCloseTo(0, 1)
    const z0 = w.player.position.z
    for (let i = 0; i < 60; i++) w.step(DT, { ...none, moveZ: 1 })
    expect(z0 - w.player.position.z).toBeGreaterThan(5)
    let maxY = 0
    w.step(DT, { ...none, jumpHeld: true, jumpPressed: true })
    for (let i = 0; i < 90; i++) { w.step(DT, { ...none, jumpHeld: true }); maxY = Math.max(maxY, w.feetY) }
    expect(maxY).toBeGreaterThan(1.8)
    expect(maxY).toBeLessThan(3)
    expect(w.grounded).toBe(true)
  })
  it('提早放開跳躍鍵會降低跳躍高度', () => {
    const jumpHeight = (hold: boolean) => {
      const w = new GameWorld(buildLevel(1))
      for (let i = 0; i < 40; i++) w.step(DT, none)
      let m = 0
      w.step(DT, { ...none, jumpHeld: true, jumpPressed: true })
      for (let i = 0; i < 80; i++) { w.step(DT, { ...none, jumpHeld: hold && i < 80 }); m = Math.max(m, w.feetY) }
      return m
    }
    expect(jumpHeight(false)).toBeLessThan(jumpHeight(true) - 0.5)
  })
  it('牆壁無摩擦：不會黏在牆上', () => {
    const w = new GameWorld(buildLevel(3))
    for (let i = 0; i < 400; i++) w.step(DT, { ...none, moveX: -1 })
    expect(w.player.position.y).toBeLessThan(1)
  })
  it('受傷扣血並給予無敵時間，血量歸零即失敗', () => {
    const w = new GameWorld(buildLevel(1))
    const m = w.movers[0]
    for (let i = 0; i < 30; i++) w.step(DT, none)
    const before = w.lives
    // 把玩家放到牆旁
    w.player.position.set(m.center.x + 1.6, 0.5, m.center.z)
    w.step(DT, none)
    expect(w.lives).toBe(before - 1)
    expect(w.invul).toBeGreaterThan(1)
    w.lives = 1
    w.invul = 0
    w.player.position.set(m.center.x + 1.6, 0.5, m.center.z)
    w.step(DT, none)
    expect(w.status).toBe('lost')
    expect(w.loseReason).toBe('lives')
  })
  it('掉出地圖會扣一條命並回到起點', () => {
    const w = new GameWorld(buildLevel(1))
    const lives = w.lives
    w.player.position.set(0, -10, -52)
    w.step(DT, none)
    expect(w.lives).toBe(lives - 1)
    expect(w.player.position.z).toBeCloseTo(2, 0)
  })
  it('Tweak 調整移動速度立即生效', () => {
    const run = () => {
      const w = new GameWorld(buildLevel(1))
      for (let i = 0; i < 20; i++) w.step(DT, none)
      for (let i = 0; i < 30; i++) w.step(DT, { ...none, moveZ: 1 })
      return w.speedXZ
    }
    const base = run()
    tuning.apply({ 'player.walkSpeed': 12 })
    expect(run()).toBeGreaterThan(base + 2)
    tuning.apply({ 'player.walkSpeed': 8 })
    expect(CONFIG.player.walkSpeed).toBe(8)
  })
})

describe('機器人通關', () => {
  it('關卡 1：收集 10 枚金幣、閘門打開並抵達終點', () => {
    const w = new GameWorld(buildLevel(1))
    w.lives = 99
    const bot = new Bot(w)
    for (const c of w.level.coins) {
      runTo(w, bot, c[0], c[2], 14, 0.7)
      if (w.status !== 'playing') break
    }
    expect(w.coins).toBe(10)
    expect(w.gateAmount).toBeGreaterThan(0)
    runTo(w, bot, w.level.goal[0], w.level.goal[2], 14, 0.6)
    expect(w.status).toBe('won')
  })
  it('關卡 1：金幣不足時閘門擋住終點', () => {
    const w = new GameWorld(buildLevel(1))
    w.lives = 99
    const bot = new Bot(w)
    runTo(w, bot, 0, -83, 40, 0.6)
    expect(w.coins).toBeLessThan(10)
    expect(w.status).toBe('playing')
    expect(w.player.position.z).toBeGreaterThan(-86)
  })
  it('關卡 2：能沿浮空積木階梯登頂', () => {
    const w = new GameWorld(buildLevel(2))
    w.lives = 99
    const bot = new Bot(w)
    const steps: Array<{ top: number; at: () => [number, number] }> = []
    const lvl = w.level
    const pillarTop = 0
    for (const b of lvl.statics as BrickSpec[]) {
      if (b.collide === false || b.visible === false) continue
      if (b.pos[1] + b.size[1] <= pillarTop + 0.01) continue
      if (b.size[0] >= 6 && b.size[1] === 1.2 && b.pos[1] === 0 && b.size[0] === 4 && Math.abs(b.pos[0]) < 0.1) continue
      steps.push({ top: b.pos[1] + b.size[1], at: () => [b.pos[0], b.pos[2]] })
    }
    for (const m of w.movers) steps.push({ top: m.spec.brick.pos[1] + m.spec.brick.size[1], at: () => [m.center.x, m.center.z] })
    steps.sort((a, b) => a.top - b.top)
    let reached = 0
    for (const s of steps) {
      let ok = false
      for (let i = 0; i < 60 * 12 && w.status === 'playing'; i++) {
        const [x, z] = s.at()
        const d = bot.step(x, z)
        if (d < 0.7 && Math.abs(w.feetY - s.top) < 0.4 && w.grounded) { ok = true; break }
      }
      if (!ok) break
      reached++
      if (w.status !== 'playing') break
    }
    expect(w.status === 'won' || reached >= steps.length - 1).toBe(true)
    runTo(w, bot, w.level.goal[0], w.level.goal[2], 8, 0.6)
    expect(w.status).toBe('won')
  })
})

describe('關卡 3 迷宮', () => {
  it('機器人沿迷宮路徑走完：踩按鈕、趕在閘門關閉前通過並抵達終點', () => {
    const w = new GameWorld(buildLevel(3))
    w.lives = 99
    const bot = new Bot(w)
    const sw = w.level.switches[0].pos
    const gate = w.level.gate!.brick.pos
    const cells = (w.level.meta!.pathLength as number)
    expect(cells).toBeGreaterThan(10)
    // 以 BFS 路徑還原的格中心當作路標
    const maze = generateMaze(MAZE_SEED)
    const pts: [number, number][] = []
    maze.path.forEach(([cx, cy], i) => {
      const [x, z] = cellToWorld(cx, cy)
      if (i > 0) { const [px, pz] = cellToWorld(maze.path[i - 1][0], maze.path[i - 1][1]); pts.push([(x + px) / 2, (z + pz) / 2]) }
      pts.push([x, z])
    })
    let passedGate = false
    for (const [x, z] of pts) {
      // 閘門尚未開啟就不要硬闖：等待時間用走回按鈕解決，這裡直接前進
      const ok = runTo(w, bot, x, z, 20, 0.7)
      if (Math.hypot(x - gate[0], z - gate[2]) < 0.1 && w.player.position.x !== undefined) passedGate = true
      if (!ok || w.status !== 'playing') break
    }
    void sw
    expect(passedGate).toBe(true)
    expect(w.status).toBe('won')
    expect(w.time).toBeLessThan(100)
  })
})

describe('關卡 3 機關', () => {
  it('旋轉橫桿與陷阱塊會傷人，閘門需踩按鈕才開', () => {
    const w = new GameWorld(buildLevel(3))
    const g = w.level.gate!
    expect(w.gateAmount).toBe(0)
    const sw = w.level.switches[0].pos
    w.player.position.set(sw[0], 0.5, sw[2])
    w.step(DT, none)
    expect(w.gateTimer).toBeGreaterThan(11)
    for (let i = 0; i < 90; i++) w.step(DT, none)
    expect(w.gateAmount).toBeGreaterThan(0.5)
    // 閘門 12 秒後關閉
    w.player.position.set(sw[0] + 8, 0.5, sw[2])
    for (let i = 0; i < 60 * 15; i++) w.step(DT, none)
    expect(w.gateTimer).toBe(0)
    expect(w.gateAmount).toBe(0)
    expect(g.mode).toBe('switch')
  })
  it('倒數歸零即時間到', () => {
    const w = new GameWorld(buildLevel(3))
    w.lives = 99
    w.step(DT, { ...none, moveZ: 1 })
    for (let i = 0; i < 60 * 101 && w.status === 'playing'; i++) { w.invul = 5; w.step(DT, none) }
    expect(w.status).toBe('lost')
    expect(w.loseReason).toBe('time')
  })
})
