/**
 * 遊戲數值集中在這裡。DEFAULT_CONFIG 是不可變的原始預設；
 * CONFIG 是遊戲實際讀取的「作用中」數值（Tweak 面板的 Apply 只會改 CONFIG）。
 */
export const DEFAULT_CONFIG = {
  run: {
    /** 基礎生命數（各關可再加成）。 */
    lives: 3,
    /** 受傷後的無敵秒數。 */
    invulnerable: 1.6,
  },
  player: {
    walkSpeed: 8,
    acceleration: 80,
    airControl: 0.65,
    jumpSpeed: 11.5,
    /** 提早放開跳躍鍵時，上升速度的保留比例（可變跳躍高度）。 */
    jumpCut: 0.5,
    coyoteTime: 0.1,
    jumpBuffer: 0.12,
  },
  camera: {
    distance: 9,
    follow: 7,
  },
} as const

type MutableConfig<T> = { -readonly [K in keyof T]: T[K] extends number ? number : T[K] extends object ? MutableConfig<T[K]> : T[K] }
export const CONFIG: MutableConfig<typeof DEFAULT_CONFIG> = structuredClone(DEFAULT_CONFIG)

/** 世界重力（Y 軸，單位 m/s²）。 */
export const GRAVITY = -30
