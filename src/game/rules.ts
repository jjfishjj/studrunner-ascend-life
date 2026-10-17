/** 純規則：不依賴 React / Three，方便單元測試。 */

export function formatTime(seconds: number): string {
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${String(m).padStart(2, '0')}:${r.toFixed(1).padStart(4, '0')}`
}

export interface StarInput {
  coins: number
  coinsTotal: number
  livesLeft: number
  livesMax: number
  time: number
  parTime: number
}

/** 星等：1 通關、2 蒐集全部金幣或零失誤、3 兩者皆達成且在標準時間內。 */
export function computeStars(i: StarInput): 1 | 2 | 3 {
  const allCoins = i.coins >= i.coinsTotal
  const perfect = i.livesLeft >= i.livesMax
  const fast = i.time <= i.parTime
  const score = 1 + (allCoins ? 1 : 0) + (perfect && fast ? 1 : 0)
  return Math.min(3, score) as 1 | 2 | 3
}

export interface BestRecord { time: number; stars: number; coins: number }
export interface SaveData {
  best: Record<string, BestRecord>
  muted: boolean
}

export const EMPTY_SAVE: SaveData = { best: {}, muted: false }

export function parseSave(raw: string | null): SaveData {
  if (!raw) return { ...EMPTY_SAVE, best: {} }
  try {
    const data = JSON.parse(raw) as Partial<SaveData>
    const best: Record<string, BestRecord> = {}
    for (const [k, v] of Object.entries(data.best ?? {})) {
      if (v && Number.isFinite(v.time) && Number.isFinite(v.stars) && Number.isFinite(v.coins)) best[k] = { time: v.time, stars: v.stars, coins: v.coins }
    }
    return { best, muted: data.muted === true }
  } catch {
    return { ...EMPTY_SAVE, best: {} }
  }
}

/** 合併新成績：星等較高或同星時間較短者勝出。 */
export function mergeBest(prev: BestRecord | undefined, next: BestRecord): BestRecord {
  if (!prev) return next
  if (next.stars > prev.stars) return { ...next, time: Math.min(prev.time, next.time) }
  return { stars: prev.stars, coins: Math.max(prev.coins, next.coins), time: Math.min(prev.time, next.time) }
}
