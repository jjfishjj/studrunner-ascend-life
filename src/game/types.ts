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
  mode: 'coins' | 'notes' | 'switch'
  /** switch 模式：踩下按鈕後閘門開啟的秒數 */
  openSeconds?: number
}

export interface CheckpointSpec { pos: Vec3 }
/** 場景中的「筆記磚」：撿到後解鎖對應的學習筆記分類。 */
export interface NoteSpec { id: string; pos: Vec3 }
/** 供自動化測試使用的建議路線：依序站上每個目標（mover 指移動平台 id）。 */
export interface RouteStep { pos: Vec3; mover?: string }
export interface LightSpec {
  sun: string
  sunIntensity: number
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  env: number
}
/** 會動的自然景物與環境音分區（目前五階使用）。座標皆為世界座標。 */
export interface NatureDef {
  /** 瀑布：從 y1 流到 y0，寬 w，面向 +z（水片位於 z） */
  falls: { x: number; z: number; y0: number; y1: number; w: number }[]
  /** 海浪：在 [x0,x1] 範圍內，從 z1 往岸邊 z0 推進 */
  waves: { x0: number; x1: number; z0: number; z1: number; y: number }[]
  crabs: { x: number; z: number; y: number; range: number }[]
  boats: { pos: Vec3 }[]
  /** 蝴蝶／小鳥：繞著中心飛 */
  flyers: { center: Vec3; radius: number; kind: 'butterfly' | 'bird'; color: string }[]
  /** 環境音分區：玩家離中心越近音量越大 */
  zones: { kind: 'sea' | 'falls' | 'jungle'; pos: [number, number]; radius: number }[]
}
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
  /** 第幾階（與關卡編號相同） */
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
  notes: NoteSpec[]
  /** 終點是否需要集滿本關的筆記磚 */
  goalNeedsNotes: boolean
  /** 可選：自訂光照（夜空場景較暗） */
  light?: LightSpec
  route?: RouteStep[]
  nature?: NatureDef
  /** 錨點位置：用於 UI/測試（例如迷宮路徑長度） */
  meta?: { pathLength?: number; goalTop?: number; noteCells?: [number, number][]; noteOrigins?: number[] }
}
