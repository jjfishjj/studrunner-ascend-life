export type Vec3 = [number, number, number]

/** 1 個 stud = 1 世界單位；標準積木高 1.2、薄片高 0.4。 */
export const BRICK_H = 1.2
export const PLATE_H = 0.4

export interface BrickSpec {
  /** 中心 x、底面 y、中心 z */
  pos: Vec3
  /** 寬(x)、高(y)、深(z) */
  size: Vec3
  color: string
  /** 頂面是否有圓柱凸點，預設 true */
  studs?: boolean
  /** 是否產生物理碰撞，預設 true */
  collide?: boolean
  /** 是否繪製，預設 true（false = 僅碰撞體） */
  visible?: boolean
}

export type Motion =
  | { type: 'slide'; axis: 'x' | 'y' | 'z'; amp: number; speed: number; phase?: number }
  | { type: 'spin'; speed: number; phase?: number }
  /** 週期性升起的陷阱塊：up 為升起時間佔比 */
  | { type: 'pulse'; rise: number; period: number; up: number; phase?: number }

export interface MoverSpec {
  id: string
  brick: BrickSpec
  motion: Motion
  /** 碰到會受傷 */
  hazard?: boolean
}

export interface GateSpec {
  brick: BrickSpec
  /** 開啟時下沉的距離 */
  sink: number
  mode: 'coins' | 'switch'
  /** switch 模式：踩下按鈕後閘門開啟的秒數 */
  openSeconds?: number
}

export interface CheckpointSpec { pos: Vec3 }
export interface SwitchSpec { pos: Vec3 }

export interface CameraSpec {
  distance: number
  height: number
  /** 'orbit'：攝影機自動繞著塔心，始終望向中心 */
  mode: 'follow' | 'orbit'
  center?: Vec3
  yaw?: number
}

export interface LevelDef {
  id: number
  name: string
  subtitle: string
  hint: string
  lives: number
  /** 倒數時間（秒）；未設定表示正數計時 */
  timeLimit?: number
  /** 三星時間門檻（秒） */
  parTime: number
  requiredCoins: number
  sky: string
  fog: [string, number, number]
  spawn: Vec3
  killY: number
  /** 掉到「重生點高度 − fallDepth」以下即視為墜落（可選） */
  fallDepth?: number
  camera: CameraSpec
  statics: BrickSpec[]
  decor: BrickSpec[]
  movers: MoverSpec[]
  coins: Vec3[]
  checkpoints: CheckpointSpec[]
  gate?: GateSpec
  switches: SwitchSpec[]
  goal: Vec3
  /** 通關是否需要集滿金幣 */
  goalNeedsCoins: boolean
  /** 錨點位置：用於 UI/測試（例如迷宮路徑長度） */
  meta?: Record<string, number>
}
