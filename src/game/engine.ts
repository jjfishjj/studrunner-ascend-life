import * as CANNON from 'cannon-es'
import { CONFIG, DEFAULT_CONFIG, GRAVITY } from './config'
import { tuning } from './tuning'
import { motionPose, poseDangerous, type Pose } from './motion'
import type { LevelDef, MoverSpec, Vec3 } from './types'

const GROUP_WORLD = 1
const GROUP_PLAYER = 2
export const PLAYER_R = 0.5
const UPPER_Y = 0.85
const UPPER_R = 0.4

export interface PlayerInput {
  /** 右 +1 / 左 -1（相對攝影機） */
  moveX: number
  /** 前 +1 / 後 -1（相對攝影機） */
  moveZ: number
  jumpHeld: boolean
  jumpPressed: boolean
}

export type GameStatus = 'playing' | 'won' | 'lost'
export type LoseReason = 'lives' | 'time'

export type GameEvent =
  | { type: 'coin'; index: number; pos: Vec3 }
  | { type: 'hurt'; pos: Vec3 }
  | { type: 'fall'; pos: Vec3 }
  | { type: 'jump'; pos: Vec3 }
  | { type: 'land'; pos: Vec3; hard: boolean }
  | { type: 'checkpoint'; index: number; pos: Vec3 }
  | { type: 'switch'; pos: Vec3 }
  | { type: 'gate'; open: boolean }
  | { type: 'goalLocked' }
  | { type: 'respawn'; pos: Vec3 }
  | { type: 'win'; pos: Vec3 }
  | { type: 'lose'; reason: LoseReason }

export interface MoverRT {
  spec: MoverSpec
  body: CANNON.Body
  half: Vec3
  /** 本 tick 設定的中心位置（不受 cannon 積分影響） */
  center: CANNON.Vec3
  delta: CANNON.Vec3
  pose: Pose
}

const Y_AXIS = new CANNON.Vec3(0, 1, 0)
const shortestAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/** 球 vs 繞 Y 旋轉的盒：側面/下方碰觸才算「命中」，站在上面不算。 */
export function sphereHitsBox(
  p: Vec3, r: number, center: Vec3, angle: number, half: Vec3, topCounts = false,
): boolean {
  const dx = p[0] - center[0], dy = p[1] - center[1], dz = p[2] - center[2]
  const c = Math.cos(angle), s = Math.sin(angle)
  const lx = dx * c - dz * s
  const lz = dx * s + dz * c
  const cx = Math.max(-half[0], Math.min(half[0], lx))
  const cy = Math.max(-half[1], Math.min(half[1], dy))
  const cz = Math.max(-half[2], Math.min(half[2], lz))
  const nx = lx - cx, ny = dy - cy, nz = lz - cz
  const d = Math.hypot(nx, ny, nz)
  if (d >= r) return false
  if (d === 0 || topCounts) return true
  return ny < 0.55 * d
}

export class GameWorld {
  readonly level: LevelDef
  readonly world: CANNON.World
  readonly player: CANNON.Body
  readonly movers: MoverRT[] = []
  readonly events: GameEvent[] = []

  gate?: { body: CANNON.Body; half: Vec3; amount: number; permanent: boolean; timer: number; baseY: number }
  collected: boolean[]
  checkpointActive: boolean[]
  switchPressed: boolean[]

  status: GameStatus = 'playing'
  loseReason: LoseReason | null = null
  lives = 3
  livesMax = 3
  coins = 0
  /** 計時器（秒）；第一次操作後才開始 */
  time = 0
  timerStarted = false
  /** 機關動畫時間（一直走） */
  animTime = 0
  invul = 0
  knock = 0
  grounded = false
  facing = 0
  camYaw = 0
  respawn: Vec3
  /** 供渲染插值 */
  prevPos = new CANNON.Vec3()
  speedXZ = 0

  private groundBody: CANNON.Body | null = null
  private coyote = 0
  private jumpBuf = 0
  private jumping = false
  private lastVy = 0
  private goalWarn = 0
  private rayFrom = new CANNON.Vec3()
  private rayTo = new CANNON.Vec3()
  private rayRes = new CANNON.RaycastResult()
  private moverByBody = new Map<number, MoverRT>()

  constructor(level: LevelDef) {
    this.level = level
    tuning.activate('run')
    this.livesMax = Math.max(1, level.lives + CONFIG.run.lives - DEFAULT_CONFIG.run.lives)
    this.lives = this.livesMax
    this.collected = level.coins.map(() => false)
    this.checkpointActive = level.checkpoints.map(() => false)
    this.switchPressed = level.switches.map(() => false)
    this.respawn = [level.spawn[0], level.spawn[1], level.spawn[2]]

    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, GRAVITY, 0) })
    this.world.allowSleep = false
    this.world.defaultContactMaterial.friction = 0
    this.world.defaultContactMaterial.restitution = 0
    const solver = this.world.solver as CANNON.GSSolver
    solver.iterations = 12

    for (const b of level.statics) {
      if (b.collide === false) continue
      const body = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC, collisionFilterGroup: GROUP_WORLD })
      body.addShape(new CANNON.Box(new CANNON.Vec3(b.size[0] / 2, b.size[1] / 2, b.size[2] / 2)))
      body.position.set(b.pos[0], b.pos[1] + b.size[1] / 2, b.pos[2])
      this.world.addBody(body)
    }

    for (const spec of level.movers) {
      const half: Vec3 = [spec.brick.size[0] / 2, spec.brick.size[1] / 2, spec.brick.size[2] / 2]
      const body = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, collisionFilterGroup: GROUP_WORLD })
      body.addShape(new CANNON.Box(new CANNON.Vec3(...half)))
      this.world.addBody(body)
      const rt: MoverRT = { spec, body, half, center: new CANNON.Vec3(), delta: new CANNON.Vec3(), pose: motionPose(spec.motion, 0) }
      this.moverByBody.set(body.id, rt)
      this.movers.push(rt)
      this.placeMover(rt, 0, true)
    }

    if (level.gate) {
      const g = level.gate
      const half: Vec3 = [g.brick.size[0] / 2, g.brick.size[1] / 2, g.brick.size[2] / 2]
      const body = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, collisionFilterGroup: GROUP_WORLD })
      body.addShape(new CANNON.Box(new CANNON.Vec3(...half)))
      body.position.set(g.brick.pos[0], g.brick.pos[1] + half[1], g.brick.pos[2])
      this.world.addBody(body)
      this.gate = { body, half, amount: 0, permanent: false, timer: 0, baseY: g.brick.pos[1] + half[1] }
    }

    this.player = new CANNON.Body({
      mass: 1, fixedRotation: true, linearDamping: 0, allowSleep: false,
      collisionFilterGroup: GROUP_PLAYER, collisionFilterMask: GROUP_WORLD,
    })
    this.player.addShape(new CANNON.Sphere(PLAYER_R), new CANNON.Vec3(0, 0, 0))
    this.player.addShape(new CANNON.Sphere(UPPER_R), new CANNON.Vec3(0, UPPER_Y, 0))
    this.player.updateMassProperties()
    this.world.addBody(this.player)
    this.placePlayer(this.respawn)
    this.camYaw = this.targetYaw()
    this.prevPos.copy(this.player.position)
  }

  /** 腳底座標（世界） */
  get feetY(): number { return this.player.position.y - PLAYER_R }

  get gateAmount(): number { return this.gate?.amount ?? 0 }
  get gateTimer(): number { return this.gate && !this.gate.permanent ? this.gate.timer : 0 }
  get timeLeft(): number | null { return this.level.timeLimit === undefined ? null : Math.max(0, this.level.timeLimit - this.time) }

  private placePlayer(at: Vec3) {
    this.player.position.set(at[0], at[1] + PLAYER_R, at[2])
    this.player.velocity.set(0, 0, 0)
    this.prevPos.copy(this.player.position)
    this.groundBody = null
    this.grounded = false
    this.jumping = false
    this.knock = 0
  }

  private placeMover(m: MoverRT, dt: number, first = false) {
    const base = m.spec.brick.pos
    const pose = motionPose(m.spec.motion, this.animTime)
    const cx = base[0] + pose.dx
    const cy = base[1] + m.half[1] + pose.dy
    const cz = base[2] + pose.dz
    if (first) m.center.set(cx, cy, cz)
    m.delta.set(cx - m.center.x, cy - m.center.y, cz - m.center.z)
    m.center.set(cx, cy, cz)
    m.body.position.set(cx, cy, cz)
    if (dt > 0) m.body.velocity.set(m.delta.x / dt, m.delta.y / dt, m.delta.z / dt)
    if (m.spec.motion.type === 'spin') m.body.quaternion.setFromAxisAngle(Y_AXIS, pose.angle)
    m.pose = pose
  }

  /** 攝影機目標偏航角：環繞模式始終位於塔外側。 */
  private targetYaw(): number {
    const cam = this.level.camera
    if (cam.mode === 'orbit' && cam.center) {
      const dx = this.player.position.x - cam.center[0]
      const dz = this.player.position.z - cam.center[2]
      if (Math.hypot(dx, dz) > 1) return Math.atan2(dx, dz)
      return this.camYaw
    }
    return cam.yaw ?? 0
  }

  private probeGround(): void {
    const p = this.player.position
    let found: CANNON.Body | null = null
    let bestD = Infinity
    const reach = PLAYER_R + 0.14
    const offs: [number, number][] = [[0, 0], [0.32, 0], [-0.32, 0], [0, 0.32], [0, -0.32]]
    for (const [ox, oz] of offs) {
      this.rayFrom.set(p.x + ox, p.y, p.z + oz)
      this.rayTo.set(p.x + ox, p.y - reach, p.z + oz)
      this.rayRes.reset()
      const hit = this.world.raycastClosest(this.rayFrom, this.rayTo, { collisionFilterMask: GROUP_WORLD, collisionFilterGroup: -1, skipBackfaces: true }, this.rayRes)
      if (hit && this.rayRes.hitNormalWorld.y > 0.5 && this.rayRes.distance < bestD) {
        bestD = this.rayRes.distance
        found = this.rayRes.body
      }
    }
    this.groundBody = found
    this.grounded = !!found && this.player.velocity.y < 0.5
  }

  private pushEvent(e: GameEvent) { this.events.push(e) }
  private pos3(): Vec3 { const p = this.player.position; return [p.x, p.y - PLAYER_R, p.z] }

  step(dt: number, input: PlayerInput): void {
    if (this.status !== 'playing') return
    this.prevPos.copy(this.player.position)
    this.animTime += dt
    const wantsMove = Math.abs(input.moveX) + Math.abs(input.moveZ) > 0.01
    if (!this.timerStarted && (wantsMove || input.jumpPressed)) this.timerStarted = true
    if (this.timerStarted) this.time += dt
    if (this.invul > 0) this.invul = Math.max(0, this.invul - dt)
    if (this.knock > 0) this.knock = Math.max(0, this.knock - dt)

    // 1) 機關移動 + 承載玩家
    for (const m of this.movers) {
      this.placeMover(m, dt)
      if (this.groundBody === m.body) {
        this.player.position.x += m.delta.x
        this.player.position.y += m.delta.y
        this.player.position.z += m.delta.z
      }
    }
    this.updateGate(dt)

    // 2) 地面偵測
    const wasGrounded = this.grounded
    this.probeGround()
    if (this.grounded && !wasGrounded && this.lastVy < -5) this.pushEvent({ type: 'land', pos: this.pos3(), hard: this.lastVy < -16 })

    // 3) 水平控制（相對於攝影機）
    this.camYaw += shortestAngle(this.targetYaw() - this.camYaw) * (1 - Math.exp(-6 * dt))
    const f = this.camYaw
    const fx = -Math.sin(f), fz = -Math.cos(f)
    const rx = Math.cos(f), rz = -Math.sin(f)
    let wx = rx * input.moveX + fx * input.moveZ
    let wz = rz * input.moveX + fz * input.moveZ
    const len = Math.hypot(wx, wz)
    if (len > 1) { wx /= len; wz /= len }
    const v = this.player.velocity
    if (this.knock <= 0) {
      const speed = CONFIG.player.walkSpeed
      const accel = CONFIG.player.acceleration * (this.grounded ? 1 : CONFIG.player.airControl)
      const maxD = accel * dt
      const dvx = wx * speed - v.x, dvz = wz * speed - v.z
      const dl = Math.hypot(dvx, dvz)
      const k = dl > maxD ? maxD / dl : 1
      v.x += dvx * k
      v.z += dvz * k
    }
    if (len > 0.1 && this.knock <= 0) this.facing += shortestAngle(Math.atan2(wx, wz) - this.facing) * Math.min(1, dt * 16)

    // 4) 跳躍（土狼時間 + 輸入緩衝 + 可變高度）
    this.jumpBuf = input.jumpPressed ? CONFIG.player.jumpBuffer : this.jumpBuf - dt
    this.coyote = this.grounded ? CONFIG.player.coyoteTime : this.coyote - dt
    if (this.jumpBuf > 0 && this.coyote > 0) {
      tuning.activate('jump')
      v.y = CONFIG.player.jumpSpeed
      this.jumpBuf = 0
      this.coyote = 0
      this.jumping = true
      this.grounded = false
      this.groundBody = null
      this.pushEvent({ type: 'jump', pos: this.pos3() })
    }
    if (this.jumping && !input.jumpHeld && v.y > 0) { v.y *= CONFIG.player.jumpCut; this.jumping = false }
    if (v.y <= 0) this.jumping = false
    if (v.y < -40) v.y = -40

    // 5) 物理步進
    this.world.step(dt)
    this.lastVy = this.player.velocity.y
    this.speedXZ = Math.hypot(this.player.velocity.x, this.player.velocity.z)

    // 6) 規則判定
    this.checkPickups()
    this.checkHazards()
    this.checkSwitches(dt)
    this.checkFall()
    this.checkGoal(dt)
    if (this.status === 'playing' && this.level.timeLimit !== undefined && this.time >= this.level.timeLimit) {
      this.status = 'lost'
      this.loseReason = 'time'
      this.pushEvent({ type: 'lose', reason: 'time' })
    }
  }

  private updateGate(dt: number) {
    const g = this.gate
    if (!g || !this.level.gate) return
    const spec = this.level.gate
    let open = false
    if (spec.mode === 'coins') {
      if (!g.permanent && this.coins >= this.level.requiredCoins) { g.permanent = true; this.pushEvent({ type: 'gate', open: true }) }
      open = g.permanent
    } else {
      if (g.timer > 0) {
        g.timer = Math.max(0, g.timer - dt)
        if (g.timer === 0) this.pushEvent({ type: 'gate', open: false })
      }
      open = g.timer > 0
    }
    const target = open ? 1 : 0
    g.amount += Math.sign(target - g.amount) * Math.min(Math.abs(target - g.amount), dt * 2.2)
    const y = g.baseY - g.amount * spec.sink
    g.body.velocity.set(0, (y - g.body.position.y) / Math.max(dt, 1e-6), 0)
    g.body.position.y = y
  }

  private checkPickups() {
    const p = this.player.position
    const lvl = this.level
    lvl.coins.forEach((c, i) => {
      if (this.collected[i]) return
      const d1 = Math.hypot(c[0] - p.x, c[1] - p.y, c[2] - p.z)
      const d2 = Math.hypot(c[0] - p.x, c[1] - (p.y + UPPER_Y), c[2] - p.z)
      if (Math.min(d1, d2) < 1.2) {
        this.collected[i] = true
        this.coins++
        this.pushEvent({ type: 'coin', index: i, pos: c })
      }
    })
    lvl.checkpoints.forEach((cp, i) => {
      if (this.checkpointActive[i]) return
      if (Math.hypot(cp.pos[0] - p.x, cp.pos[2] - p.z) < 2.3 && Math.abs(cp.pos[1] + PLAYER_R - p.y) < 2.4) {
        this.checkpointActive[i] = true
        this.respawn = [cp.pos[0], cp.pos[1] + 0.1, cp.pos[2]]
        this.pushEvent({ type: 'checkpoint', index: i, pos: cp.pos })
      }
    })
  }

  private checkSwitches(dt: number) {
    void dt
    const g = this.gate
    this.level.switches.forEach((s, i) => {
      const p = this.player.position
      const near = Math.hypot(s.pos[0] - p.x, s.pos[2] - p.z) < 1.35 && Math.abs(p.y - PLAYER_R - s.pos[1]) < 1
      if (near) {
        if (!this.switchPressed[i]) {
          this.switchPressed[i] = true
          this.pushEvent({ type: 'switch', pos: s.pos })
        }
        if (g && this.level.gate?.mode === 'switch') {
          const wasClosed = g.timer <= 0
          g.timer = this.level.gate.openSeconds ?? 10
          if (wasClosed) this.pushEvent({ type: 'gate', open: true })
        }
      } else {
        this.switchPressed[i] = false
      }
    })
  }

  private checkHazards() {
    if (this.status !== 'playing' || this.invul > 0) return
    const p = this.player.position
    const low: Vec3 = [p.x, p.y, p.z]
    const high: Vec3 = [p.x, p.y + UPPER_Y, p.z]
    for (const m of this.movers) {
      if (!m.spec.hazard || !poseDangerous(m.spec.motion, m.pose)) continue
      const c: Vec3 = [m.center.x, m.center.y, m.center.z]
      const top = m.spec.motion.type === 'pulse'
      if (sphereHitsBox(low, PLAYER_R + 0.12, c, m.pose.angle, m.half, top) || sphereHitsBox(high, UPPER_R + 0.1, c, m.pose.angle, m.half, top)) {
        this.hurt(c)
        return
      }
    }
  }

  private hurt(from: Vec3) {
    const p = this.player.position
    this.lives--
    this.pushEvent({ type: 'hurt', pos: this.pos3() })
    if (this.lives <= 0) {
      this.status = 'lost'
      this.loseReason = 'lives'
      this.pushEvent({ type: 'lose', reason: 'lives' })
      return
    }
    this.invul = CONFIG.run.invulnerable
    this.knock = 0.28
    let dx = p.x - from[0], dz = p.z - from[2]
    const l = Math.hypot(dx, dz) || 1
    dx /= l; dz /= l
    this.player.velocity.set(dx * 9, 7, dz * 9)
    this.grounded = false
    this.groundBody = null
  }

  private checkFall() {
    if (this.status !== 'playing') return
    const y = this.player.position.y - PLAYER_R
    const rel = this.level.fallDepth !== undefined ? this.respawn[1] - this.level.fallDepth : -Infinity
    if (y < Math.max(this.level.killY, rel)) {
      this.lives--
      this.pushEvent({ type: 'fall', pos: this.pos3() })
      if (this.lives <= 0) {
        this.status = 'lost'
        this.loseReason = 'lives'
        this.pushEvent({ type: 'lose', reason: 'lives' })
        return
      }
      this.placePlayer(this.respawn)
      this.invul = 1.4
      this.camYaw = this.targetYaw()
      this.pushEvent({ type: 'respawn', pos: this.pos3() })
    }
  }

  private checkGoal(dt: number) {
    if (this.status !== 'playing') return
    this.goalWarn = Math.max(0, this.goalWarn - dt)
    const g = this.level.goal
    const p = this.player.position
    const fy = p.y - PLAYER_R - g[1]
    if (Math.abs(p.x - g[0]) < 2.3 && Math.abs(p.z - g[2]) < 2.3 && fy > -1 && fy < 4) {
      if (this.level.goalNeedsCoins && this.coins < this.level.requiredCoins) {
        if (this.goalWarn <= 0) { this.pushEvent({ type: 'goalLocked' }); this.goalWarn = 2 }
        return
      }
      this.status = 'won'
      this.pushEvent({ type: 'win', pos: this.pos3() })
    }
  }

  drainEvents(): GameEvent[] {
    if (!this.events.length) return this.events
    return this.events.splice(0, this.events.length)
  }

  dispose() {
    for (const b of [...this.world.bodies]) this.world.removeBody(b)
  }
}
