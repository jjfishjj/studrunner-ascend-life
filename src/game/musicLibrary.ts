import { create } from 'zustand'
import { musicRefresh, setMusicResolver, setMusicVolume, type MusicChoice } from './audio'

/** 音樂欄位：0 = 主選單／筆記本，1~5 = 各階 */
export const MUSIC_SLOTS = [
  { slot: 0, label: '主選單／筆記本', hint: '開始畫面、階段選擇' },
  { slot: 1, label: '一階 · 原點大道', hint: '自我與原生家庭' },
  { slot: 2, label: '二階 · 心橋', hint: '情感與親密關係' },
  { slot: 3, label: '三階 · 五運群島', hint: '親子與人生平衡' },
  { slot: 4, label: '四階 · 揚升之塔', hint: '宇宙觀與更高層次能量' },
  { slot: 5, label: '五階 · 合一迷宮', hint: '海灘、叢林與瀑布' },
] as const

export interface Track {
  id: string
  name: string
  kind: 'builtin' | 'upload' | 'file'
  /** 內建合成曲的編號 */
  theme?: number
  url?: string
  size?: number
}
export const BUILTIN_TRACKS: Track[] = [
  { id: 'builtin-0', name: '內建 · 開場主題曲', kind: 'builtin', theme: 0 },
  { id: 'builtin-1', name: '內建 · 原點大道（輕快）', kind: 'builtin', theme: 1 },
  { id: 'builtin-2', name: '內建 · 心橋（溫柔）', kind: 'builtin', theme: 2 },
  { id: 'builtin-3', name: '內建 · 五運群島（跳躍）', kind: 'builtin', theme: 3 },
  { id: 'builtin-4', name: '內建 · 揚升之塔（空靈）', kind: 'builtin', theme: 4 },
  { id: 'builtin-5', name: '內建 · 合一迷宮（南國）', kind: 'builtin', theme: 5 },
]
export const OFF_ID = 'off'
const LS_KEY = 'studrunner.music.v1'
const DB_NAME = 'studrunner-music'
const MAX_FILE = 25 * 1024 * 1024
const MAX_FILES = 20

/* ---------- IndexedDB：上傳的音檔 ---------- */
interface StoredTrack { id: string; name: string; type: string; size: number; blob: Blob }
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore('tracks', { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
async function dbAll(): Promise<StoredTrack[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const r = db.transaction('tracks').objectStore('tracks').getAll()
    r.onsuccess = () => resolve(r.result as StoredTrack[])
    r.onerror = () => reject(r.error)
  })
}
async function dbPut(t: StoredTrack) {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('tracks', 'readwrite')
    tx.objectStore('tracks').put(t)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
async function dbDelete(id: string) {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('tracks', 'readwrite')
    tx.objectStore('tracks').delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* ---------- 設定（localStorage） ---------- */
interface Prefs { assign: Record<string, string>; volume: number }
function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')
    return { assign: typeof p.assign === 'object' && p.assign ? p.assign : {}, volume: typeof p.volume === 'number' ? p.volume : 1 }
  } catch { return { assign: {}, volume: 1 } }
}
const savePrefs = (p: Prefs) => { try { localStorage.setItem(LS_KEY, JSON.stringify(p)) } catch { /* 無痕模式 */ } }

interface MusicState {
  ready: boolean
  uploads: Track[]
  files: Track[]
  manifestDefaults: Record<string, string>
  assign: Record<string, string>
  volume: number
  error: string | null
  init(): Promise<void>
  addFiles(list: FileList | File[]): Promise<void>
  removeUpload(id: string): Promise<void>
  setAssign(slot: number, trackId: string | null): void
  setVolume(v: number): void
  resetAll(): void
  clearError(): void
}
const urlOf = new Map<string, string>()

export const useMusic = create<MusicState>((set, get) => ({
  ready: false,
  uploads: [],
  files: [],
  manifestDefaults: {},
  ...loadPrefs(),
  error: null,
  init: async () => {
    if (get().ready) return
    set({ ready: true })
    // 1) 管理者放在 public/music 的曲庫
    try {
      const res = await fetch('./music/manifest.json', { cache: 'no-cache' })
      const j = res.ok ? await res.json() : null
      if (j && Array.isArray(j.tracks)) {
        const files: Track[] = j.tracks
          .filter((t: { id?: unknown; file?: unknown }) => typeof t.id === 'string' && typeof t.file === 'string')
          .map((t: { id: string; name?: string; file: string }) => ({ id: `file-${t.id}`, name: `曲庫 · ${t.name ?? t.id}`, kind: 'file' as const, url: `./music/${encodeURIComponent(t.file)}` }))
        const defs: Record<string, string> = {}
        for (const [k, v] of Object.entries(j.defaults ?? {})) if (typeof v === 'string') defs[k] = `file-${v}`
        set({ files, manifestDefaults: defs })
      }
    } catch { /* 沒有 manifest 或格式錯誤：略過 */ }
    // 2) 這個瀏覽器上傳過的音檔
    try {
      const rows = await dbAll()
      const uploads: Track[] = rows.map(r => {
        const url = URL.createObjectURL(r.blob)
        urlOf.set(r.id, url)
        return { id: r.id, name: r.name, kind: 'upload', url, size: r.size }
      })
      set({ uploads })
    } catch { /* IndexedDB 不可用 */ }
    setMusicVolume(get().volume)
    musicRefresh()
  },
  addFiles: async list => {
    const errs: string[] = []
    for (const f of Array.from(list)) {
      if (get().uploads.length >= MAX_FILES) { errs.push(`最多只能上傳 ${MAX_FILES} 首`); break }
      if (!f.type.startsWith('audio/') && !/\.(mp3|ogg|wav|m4a|aac|flac|opus|webm)$/i.test(f.name)) { errs.push(`「${f.name}」不是音訊檔`); continue }
      if (f.size > MAX_FILE) { errs.push(`「${f.name}」超過 25 MB`); continue }
      const id = `upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
      try {
        await dbPut({ id, name: f.name.replace(/\.[^.]+$/, ''), type: f.type, size: f.size, blob: f })
      } catch { errs.push(`「${f.name}」儲存失敗（瀏覽器空間不足或無痕模式）`); continue }
      const url = URL.createObjectURL(f)
      urlOf.set(id, url)
      set(s => ({ uploads: [...s.uploads, { id, name: f.name.replace(/\.[^.]+$/, ''), kind: 'upload', url, size: f.size }] }))
    }
    set({ error: errs.length ? errs.join('；') : null })
  },
  removeUpload: async id => {
    try { await dbDelete(id) } catch { /* ignore */ }
    const url = urlOf.get(id)
    if (url) { URL.revokeObjectURL(url); urlOf.delete(id) }
    const assign = Object.fromEntries(Object.entries(get().assign).filter(([, v]) => v !== id))
    set(s => ({ uploads: s.uploads.filter(t => t.id !== id), assign }))
    savePrefs({ assign, volume: get().volume })
    musicRefresh()
  },
  setAssign: (slot, trackId) => {
    const assign = { ...get().assign }
    if (trackId == null) delete assign[String(slot)]
    else assign[String(slot)] = trackId
    set({ assign })
    savePrefs({ assign, volume: get().volume })
    musicRefresh()
  },
  setVolume: v => {
    set({ volume: v })
    savePrefs({ assign: get().assign, volume: v })
    setMusicVolume(v)
  },
  resetAll: () => {
    set({ assign: {}, volume: 1 })
    savePrefs({ assign: {}, volume: 1 })
    setMusicVolume(1)
    musicRefresh()
  },
  clearError: () => set({ error: null }),
}))

export function allTracks(s = useMusic.getState()): Track[] { return [...BUILTIN_TRACKS, ...s.files, ...s.uploads] }
/** 某欄位目前「生效」的曲目 id：玩家自選 > 曲庫預設 > 內建 */
export function effectiveTrackId(slot: number, s = useMusic.getState()): string {
  const mine = s.assign[String(slot)]
  if (mine === OFF_ID) return OFF_ID
  if (mine && allTracks(s).some(t => t.id === mine)) return mine
  const def = s.manifestDefaults[String(slot)]
  if (def && s.files.some(t => t.id === def)) return def
  return `builtin-${slot}`
}
export function choiceOf(trackId: string, s = useMusic.getState()): MusicChoice {
  if (trackId === OFF_ID) return { type: 'off' }
  const t = allTracks(s).find(x => x.id === trackId)
  if (!t) return { type: 'off' }
  if (t.kind === 'builtin') return { type: 'synth', theme: t.theme ?? 0 }
  return { type: 'url', url: t.url! }
}
setMusicResolver(slot => choiceOf(effectiveTrackId(slot)))
