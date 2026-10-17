import { create } from 'zustand'
import { LEVEL_COUNT } from './levels'
import { computeStars, mergeBest, parseSave, type BestRecord, type SaveData } from './rules'
import { setMuted, sfx, unlockAudio } from './audio'
import { tuning } from './tuning'
import type { LoseReason } from './engine'

export type Screen = 'menu' | 'select' | 'notes' | 'music' | 'playing' | 'gameover' | 'victory'

export interface Hud {
  lives: number
  livesMax: number
  coins: number
  coinsTotal: number
  notes: number
  notesTotal: number
  /** 顯示用時間：倒數關為剩餘秒數，其他為已用秒數 */
  time: number
  countdown: boolean
  gate: number
  invul: boolean
}

export interface RunResult {
  levelId: number
  won: boolean
  reason: LoseReason | null
  time: number
  coins: number
  coinsTotal: number
  notes: number
  notesTotal: number
  lives: number
  livesMax: number
  stars: 1 | 2 | 3
  best?: BestRecord
  newBest: boolean
  ranked: boolean
}

interface Store {
  screen: Screen
  levelId: number
  /** 每次開始/重來 +1，用來重新建立 GameWorld */
  runId: number
  paused: boolean
  hud: Hud
  toast: { id: number; text: string; tone: 'info' | 'good' | 'bad' } | null
  flash: number
  /** 剛撿到的筆記卡（顯示約 7 秒） */
  noteCard: { id: string; nonce: number } | null
  /** 本次遊玩撿到的筆記編號 */
  runNotes: string[]
  notesFrom: 'menu' | 'select'
  musicFrom: 'menu' | 'select'
  result: RunResult | null
  save: SaveData
  /** 選單背景展示的關卡 */
  attract: number

  setHud(h: Hud): void
  showToast(text: string, tone?: 'info' | 'good' | 'bad'): void
  hurtFlash(): void
  collectNote(id: string): void
  openNotes(from: 'menu' | 'select'): void
  openMusic(from: 'menu' | 'select'): void
  finish(r: Omit<RunResult, 'stars' | 'best' | 'newBest' | 'ranked'> & { parTime: number }): void

  goMenu(): void
  goSelect(): void
  start(levelId: number): void
  restart(): void
  next(): void
  pause(): void
  resume(): void
  toggleMute(): void
  setAttract(id: number): void
}

const SAVE_KEY = 'ascend-life-save-v1'
const loadSave = (): SaveData => {
  try { return parseSave(localStorage.getItem(SAVE_KEY)) } catch { return parseSave(null) }
}
const persist = (s: SaveData) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)) } catch { /* 無痕模式等 */ } }

const initialHud: Hud = { lives: 3, livesMax: 3, coins: 0, coinsTotal: 0, notes: 0, notesTotal: 0, time: 0, countdown: false, gate: 0, invul: false }
let toastId = 0

export const useGame = create<Store>((set, get) => ({
  screen: 'menu',
  levelId: 1,
  runId: 0,
  paused: false,
  hud: initialHud,
  toast: null,
  flash: 0,
  noteCard: null,
  runNotes: [],
  notesFrom: 'menu',
  musicFrom: 'menu',
  result: null,
  save: loadSave(),
  attract: 1,

  setHud: hud => set({ hud }),
  showToast: (text, tone = 'info') => set({ toast: { id: ++toastId, text, tone } }),
  hurtFlash: () => set(s => ({ flash: s.flash + 1 })),
  collectNote: id => {
    const { save, runNotes } = get()
    let nextSave = save
    if (!save.notes.includes(id)) {
      nextSave = { ...save, notes: [...save.notes, id].sort() }
      persist(nextSave)
    }
    set(s => ({ save: nextSave, runNotes: runNotes.includes(id) ? runNotes : [...runNotes, id], noteCard: { id, nonce: (s.noteCard?.nonce ?? 0) + 1 } }))
  },
  openMusic: from => set({ screen: 'music', musicFrom: from, paused: false, result: null, toast: null }),
  openNotes: from => set({ screen: 'notes', notesFrom: from, paused: false, result: null, toast: null }),

  finish: r => {
    const { save } = get()
    const ranked = !tuning.unranked
    const stars = r.won
      ? computeStars({ coins: r.coins, coinsTotal: r.coinsTotal, livesLeft: r.lives, livesMax: r.livesMax, time: r.time, parTime: r.parTime })
      : 1
    let best = save.best[String(r.levelId)]
    let newBest = false
    let nextSave = save
    if (r.won && ranked) {
      const merged = mergeBest(best, { time: r.time, stars, coins: r.coins })
      newBest = !best || merged.time < best.time || merged.stars > best.stars
      best = merged
      nextSave = { ...save, best: { ...save.best, [String(r.levelId)]: merged } }
      persist(nextSave)
    }
    set({
      save: nextSave,
      screen: r.won ? 'victory' : 'gameover',
      paused: false,
      noteCard: null,
      result: { levelId: r.levelId, won: r.won, reason: r.reason, time: r.time, coins: r.coins, coinsTotal: r.coinsTotal, notes: r.notes, notesTotal: r.notesTotal, lives: r.lives, livesMax: r.livesMax, stars, best, newBest, ranked },
    })
  },

  goMenu: () => set({ screen: 'menu', paused: false, result: null, toast: null }),
  goSelect: () => set({ screen: 'select', paused: false, result: null, toast: null }),
  start: levelId => {
    unlockAudio()
    sfx.click()
    set(s => ({ screen: 'playing', levelId, runId: s.runId + 1, paused: false, result: null, toast: null, noteCard: null, runNotes: [], hud: initialHud, attract: levelId }))
  },
  restart: () => get().start(get().levelId),
  next: () => {
    const id = get().levelId
    if (id >= LEVEL_COUNT) get().goSelect()
    else get().start(id + 1)
  },
  pause: () => { if (get().screen === 'playing') set({ paused: true }) },
  resume: () => set({ paused: false }),
  toggleMute: () => {
    const save = { ...get().save, muted: !get().save.muted }
    setMuted(save.muted)
    persist(save)
    set({ save })
  },
  setAttract: attract => set({ attract }),
}))

setMuted(useGame.getState().save.muted)
