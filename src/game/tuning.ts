import { CONFIG, DEFAULT_CONFIG } from './config'

type Mode = 'LIVE' | 'NEXT_ACTION' | 'NEXT_RUN'
export type Boundary = 'jump' | 'run'
type Control = {
  id: string; type: 'number'; category: string; label: string; description: string; unit: string
  default: number; min: number; max: number; step: number; applyMode: Mode; integrity: 'COSMETIC' | 'GAMEPLAY'
}
type Binding = { control: Control; boundary?: Boundary; read(): number; write(value: number): void }

const bindings: Binding[] = []

function number<S extends keyof typeof CONFIG>(
  section: S, key: keyof typeof CONFIG[S] & string, label: string,
  min: number, max: number, step: number, unit: string, boundary?: Boundary,
): void {
  const values = CONFIG[section] as Record<string, number>
  const defaults = DEFAULT_CONFIG[section] as Record<string, number>
  const category = section === 'player' ? '移動' : section === 'camera' ? '攝影機' : '關卡'
  bindings.push({
    control: Object.freeze({
      id: `${section}.${key}`, type: 'number', category, label,
      description: boundary === 'jump' ? '下一次起跳時生效。' : boundary === 'run' ? '下一次開始關卡時生效。' : '立即更新目前預覽。',
      unit, default: defaults[key], min, max, step,
      applyMode: boundary === 'run' ? 'NEXT_RUN' : boundary ? 'NEXT_ACTION' : 'LIVE',
      integrity: section === 'camera' ? 'COSMETIC' : 'GAMEPLAY',
    }),
    boundary, read: () => values[key], write: value => { values[key] = value },
  })
}

number('player', 'walkSpeed', '移動速度', 3, 14, 0.5, 'm/s')
number('player', 'acceleration', '加速度', 20, 160, 5, '')
number('player', 'airControl', '空中操控', 0, 1, 0.05, '')
number('player', 'jumpSpeed', '跳躍力道', 8, 16, 0.5, 'm/s', 'jump')
number('camera', 'distance', '攝影機距離', 5, 16, 0.5, 'm')
number('camera', 'follow', '攝影機跟隨速度', 2, 20, 1, '')
number('run', 'lives', '基礎生命數', 1, 9, 1, '顆', 'run')
number('run', 'invulnerable', '受傷無敵時間', 0.5, 4, 0.1, '秒')

const byId = new Map(bindings.map(b => [b.control.id, b]))
let requested: Record<string, number> = Object.fromEntries(bindings.map(({ control }) => [control.id, control.default]))
let unranked = false
const gameplayModified = () => bindings.some(b => b.control.integrity === 'GAMEPLAY' && b.read() !== b.control.default)

export const tuning = {
  /** 調校過的遊玩不會寫入最佳紀錄。 */
  get unranked(): boolean { return unranked },
  controls: Object.freeze(bindings.map(b => b.control)),
  read() {
    return { requested: { ...requested }, active: Object.fromEntries(bindings.map(b => [b.control.id, b.read()])) }
  },
  apply(patch: unknown): void {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Invalid patch')
    const entries = Object.entries(patch)
    if (entries.length > bindings.length) throw new Error('Invalid patch')
    for (const [id, value] of entries) {
      const control = byId.get(id)?.control
      if (!control || typeof value !== 'number' || !Number.isFinite(value) || value < control.min || value > control.max) throw new Error('Invalid value')
      const steps = (value - control.min) / control.step
      if (value !== control.default && Math.abs(steps - Math.round(steps)) > 1e-7) throw new Error('Invalid increment')
    }
    requested = { ...requested, ...(patch as Record<string, number>) }
    for (const [id, value] of entries) {
      const binding = byId.get(id)!
      if (binding.control.applyMode === 'LIVE') binding.write(value as number)
    }
    unranked ||= gameplayModified()
  },
  activate(boundary: Boundary): void {
    for (const b of bindings) if (b.boundary === boundary) b.write(requested[b.control.id])
    unranked = boundary === 'run' ? gameplayModified() : unranked || gameplayModified()
  },
}
