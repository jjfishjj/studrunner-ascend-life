import type { Motion } from './types'

export interface Pose {
  dx: number
  dy: number
  dz: number
  /** 繞 Y 軸旋轉角（弧度） */
  angle: number
  /** 0~1，脈衝陷阱的升起程度；其他機關恆為 1 */
  raised: number
  /** 陷阱即將升起的預警 */
  warn: boolean
}

const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t) }
const RAMP = 0.16
const WARN = 0.5

export function motionPose(m: Motion, t: number): Pose {
  const p: Pose = { dx: 0, dy: 0, dz: 0, angle: 0, raised: 1, warn: false }
  switch (m.type) {
    case 'slide': {
      const o = Math.sin(t * m.speed + (m.phase ?? 0)) * m.amp
      if (m.axis === 'x') p.dx = o
      else if (m.axis === 'y') p.dy = o
      else p.dz = o
      break
    }
    case 'spin':
      p.angle = t * m.speed + (m.phase ?? 0)
      break
    case 'pulse': {
      const per = m.period
      const u = (((t + (m.phase ?? 0)) % per) + per) % per
      const upT = m.up * per
      p.raised = u < upT ? Math.min(smooth(u / RAMP), smooth((upT - u) / RAMP)) : 0
      p.warn = u >= per - WARN
      p.dy = -(1 - p.raised) * m.rise
      break
    }
  }
  return p
}

/** 是否具傷害性（脈衝陷阱升起超過一半才算） */
export const poseDangerous = (m: Motion, pose: Pose) => (m.type === 'pulse' ? pose.raised > 0.5 : true)
