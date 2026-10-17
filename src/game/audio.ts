/**
 * 音效系統：全部由 Web Audio 即時合成，無外部檔案。
 * - sfx：短音效（跳躍、金幣、筆記磚……）
 * - music：每一階各有一首會循環的小曲（由程式依種子生成旋律）
 * - ambience：五階的海浪、瀑布、叢林鳥鳴（依玩家位置調整音量）
 * 瀏覽器要求「使用者互動後」才能出聲，所以會在第一次點擊 / 按鍵時自動解鎖。
 */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let sfxBus: GainNode | null = null
let musicBus: GainNode | null = null
let ambBus: GainNode | null = null
let muted = false
const MASTER_VOL = 0.9
const SFX_VOL = 1
const MUSIC_VOL = 0.34
const AMB_VOL = 0.9

type Listener = () => void
const onRunning: Listener[] = []

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : MASTER_VOL
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 4
    master.connect(comp).connect(ctx.destination)
    sfxBus = ctx.createGain(); sfxBus.gain.value = SFX_VOL; sfxBus.connect(master)
    musicBus = ctx.createGain(); musicBus.gain.value = MUSIC_VOL; musicBus.connect(master)
    ambBus = ctx.createGain(); ambBus.gain.value = AMB_VOL; ambBus.connect(master)
    ctx.addEventListener('statechange', flushRunning)
  }
  if (ctx.state === 'suspended') void ctx.resume().then(flushRunning, () => { /* 仍被瀏覽器擋住，等下一次互動 */ })
  return ctx
}
function flushRunning() {
  if (ctx?.state !== 'running') return
  while (onRunning.length) onRunning.shift()!()
}

export function setMuted(m: boolean) {
  muted = m
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : MASTER_VOL, ctx.currentTime, 0.03)
}
export function isMuted() { return muted }
/** 需在使用者手勢後呼叫以解鎖音訊 */
export function unlockAudio() { ensure() }
/** 目前是否真的能出聲（供除錯 / 測試） */
export function audioState(): string { return ctx ? ctx.state : 'none' }

if (typeof window !== 'undefined') {
  const unlock = () => { ensure() }
  for (const ev of ['pointerdown', 'keydown', 'touchstart', 'mousedown']) window.addEventListener(ev, unlock, { capture: true, passive: true })
}

/* ------------------------------------------------------------------ 短音效 */

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.18, slideTo?: number, delay = 0, bus: GainNode | null = sfxBus) {
  const c = ensure()
  const out = bus ?? sfxBus
  if (!c || !out || muted || c.state !== 'running') return
  const t0 = c.currentTime + delay
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(out)
  o.start(t0)
  o.stop(t0 + dur + 0.03)
}
function noise(dur: number, vol = 0.2, delay = 0, cutoff = 900, bus: GainNode | null = sfxBus) {
  const c = ensure()
  const out = bus ?? sfxBus
  if (!c || !out || muted || c.state !== 'running') return
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const s = c.createBufferSource()
  const g = c.createGain()
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = cutoff
  g.gain.value = vol
  s.buffer = buf
  s.connect(f).connect(g).connect(out)
  s.start(c.currentTime + delay)
}
export const sfx = {
  click: () => { tone(660, 0.06, 'square', 0.16); tone(880, 0.07, 'square', 0.12, undefined, 0.04) },
  coin: () => { tone(988, 0.08, 'square', 0.22); tone(1318, 0.2, 'square', 0.22, undefined, 0.07) },
  note: () => { [659, 784, 988, 1319, 1568].forEach((f, i) => tone(f, 0.28, 'triangle', 0.3, undefined, i * 0.07)); tone(330, 0.5, 'sine', 0.2) },
  jump: () => { tone(300, 0.18, 'sine', 0.32, 700); noise(0.05, 0.1, 0, 2500) },
  land: () => { noise(0.12, 0.4, 0, 700); tone(110, 0.1, 'sine', 0.25, 60) },
  hurt: () => { tone(220, 0.34, 'sawtooth', 0.3, 70); noise(0.22, 0.4, 0, 1800) },
  fall: () => tone(620, 0.6, 'triangle', 0.32, 70),
  checkpoint: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.3, undefined, i * 0.08)) },
  switch: () => { tone(180, 0.1, 'square', 0.28); tone(360, 0.16, 'square', 0.24, undefined, 0.06); noise(0.08, 0.2, 0, 3000) },
  gateOpen: () => { tone(110, 0.6, 'sawtooth', 0.22, 330); noise(0.5, 0.18, 0, 1200) },
  gateClose: () => { tone(330, 0.5, 'sawtooth', 0.22, 90); noise(0.3, 0.3, 0.35, 600) },
  locked: () => { tone(160, 0.14, 'square', 0.26); tone(130, 0.2, 'square', 0.26, undefined, 0.1) },
  win: () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.24, 'square', 0.26, undefined, i * 0.11)); [262, 330, 392].forEach(f => tone(f, 0.9, 'triangle', 0.2, undefined, 0.6)) },
  lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.32, 'triangle', 0.34, undefined, i * 0.2)) },
}

/* ------------------------------------------------------------------ 背景音樂 */

interface Theme {
  bpm: number
  /** 主音（MIDI） */
  root: number
  scale: number[]
  /** 每小節的和弦根音（音階級數） */
  prog: number[]
  seed: number
  /** 主旋律音色 */
  lead: OscillatorType
  /** 旋律密度 0~1 */
  density: number
  /** 是否有輕快的節奏音 */
  shaker: boolean
  /** 搖擺感 */
  swing?: number
}
const MAJOR = [0, 2, 4, 5, 7, 9, 11]
const PENTA = [0, 2, 4, 7, 9]
const MINOR_PENTA = [0, 3, 5, 7, 10]
const MIXO = [0, 2, 4, 5, 7, 9, 10]
const LYDIAN = [0, 2, 4, 6, 7, 9, 11]
/** 0 = 選單／筆記本，1~5 = 各階 */
const THEMES: Record<number, Theme> = {
  0: { bpm: 96, root: 60, scale: MAJOR, prog: [0, 4, 5, 3], seed: 11, lead: 'triangle', density: 0.55, shaker: false },
  1: { bpm: 116, root: 62, scale: MAJOR, prog: [0, 3, 4, 0, 5, 3, 4, 4], seed: 21, lead: 'square', density: 0.7, shaker: true },
  2: { bpm: 100, root: 65, scale: LYDIAN, prog: [0, 5, 3, 4], seed: 33, lead: 'triangle', density: 0.6, shaker: false },
  3: { bpm: 120, root: 60, scale: MIXO, prog: [0, 6, 3, 0, 0, 6, 4, 3], seed: 47, lead: 'square', density: 0.75, shaker: true },
  4: { bpm: 84, root: 57, scale: MINOR_PENTA, prog: [0, 2, 3, 1], seed: 59, lead: 'sine', density: 0.45, shaker: false },
  5: { bpm: 108, root: 64, scale: PENTA, prog: [0, 3, 2, 4], seed: 71, lead: 'triangle', density: 0.7, shaker: true, swing: 0.12 },
}
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)
function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
/** 以種子產生固定的旋律：每小節 8 個八分音符，值為音階級數（含八度）或 null（休止）。 */
function makeMelody(th: Theme): (number | null)[][] {
  const r = mulberry(th.seed)
  const bars: (number | null)[][] = []
  let deg = 2
  for (let b = 0; b < th.prog.length; b++) {
    const row: (number | null)[] = []
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 1 && r() > th.density) { row.push(null); continue }
      if (i === 0 && b % 2 === 0) deg = th.prog[b] + 2 * (r() > 0.5 ? 1 : 0)
      else deg += Math.floor(r() * 5) - 2
      deg = Math.max(-2, Math.min(th.scale.length + 4, deg))
      row.push(deg)
    }
    bars.push(row)
  }
  return bars
}
function degToMidi(th: Theme, deg: number): number {
  const n = th.scale.length
  const oct = Math.floor(deg / n)
  const idx = ((deg % n) + n) % n
  return th.root + th.scale[idx] + 12 * oct
}

/** 某個「音樂欄位」（0 = 選單，1~5 = 各階）實際要播什麼 */
export type MusicChoice = { type: 'synth'; theme: number } | { type: 'url'; url: string } | { type: 'off' }
let resolver: (slot: number) => MusicChoice = slot => ({ type: 'synth', theme: slot })
let previewChoice: MusicChoice | null = null
let musicVolume = 1
let curKey: string | null = null
let musicEl: HTMLAudioElement | null = null
let musicSrcNode: MediaElementAudioSourceNode | null = null
const choiceKey = (c: MusicChoice) => (c.type === 'synth' ? `s${c.theme}` : c.type === 'url' ? `u${c.url}` : 'off')
export function setMusicResolver(fn: (slot: number) => MusicChoice) { resolver = fn }

let musicThemeId: number | null = null
let musicWanted: number | null = null
let musicTimer: number | null = null
let musicStep = 0
let musicNext = 0
let melody: (number | null)[][] = []
let ducked = false

function musicNote(freq: number, t0: number, dur: number, type: OscillatorType, vol: number) {
  const c = ctx
  if (!c || !musicBus) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  if (type === 'square' || type === 'sawtooth') {
    const f = c.createBiquadFilter()
    f.type = 'lowpass'; f.frequency.value = 1800
    o.connect(f).connect(g)
  } else o.connect(g)
  g.connect(musicBus)
  o.start(t0)
  o.stop(t0 + dur + 0.05)
}
function shaker(t0: number, vol: number) {
  const c = ctx
  if (!c || !musicBus) return
  const len = Math.floor(c.sampleRate * 0.05)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const s = c.createBufferSource()
  const f = c.createBiquadFilter()
  const g = c.createGain()
  f.type = 'highpass'; f.frequency.value = 5000
  g.gain.value = vol
  s.buffer = buf
  s.connect(f).connect(g).connect(musicBus)
  s.start(t0)
}
function scheduleMusic() {
  const c = ctx
  const th = musicThemeId != null ? THEMES[musicThemeId] : null
  if (!c || !th || c.state !== 'running') return
  const eighth = 60 / th.bpm / 2
  // 分頁在背景被節流後回來時，直接跳到現在，避免一次補播大量音符
  if (musicNext < c.currentTime - 0.5) musicNext = c.currentTime + 0.05
  while (musicNext < c.currentTime + 0.25) {
    const bar = Math.floor(musicStep / 8) % th.prog.length
    const i = musicStep % 8
    const swing = th.swing && i % 2 === 1 ? eighth * th.swing : 0
    const t0 = musicNext + swing
    const chordDeg = th.prog[bar]
    // 低音：每小節第 1、3 拍
    if (i === 0 || i === 4) musicNote(mtof(degToMidi(th, chordDeg) - 24), t0, eighth * 3.6, 'sine', 0.34)
    // 琶音：和弦的 1、3、5 級
    const arp = [0, 2, 4, 2][Math.floor(i / 2) % 4]
    musicNote(mtof(degToMidi(th, chordDeg + arp) - 12), t0, eighth * 1.7, 'triangle', 0.1)
    // 主旋律
    const m = melody[bar]?.[i]
    if (m != null) musicNote(mtof(degToMidi(th, m) + 12), t0, eighth * (i % 4 === 0 ? 1.9 : 1.2), th.lead, th.lead === 'sine' ? 0.2 : 0.13)
    if (th.shaker && i % 2 === 1) shaker(t0, 0.12)
    musicStep++
    musicNext += eighth
  }
}
function applyDuck() {
  if (ctx && musicBus) musicBus.gain.setTargetAtTime((ducked ? MUSIC_VOL * 0.25 : MUSIC_VOL) * musicVolume, ctx.currentTime, 0.12)
}
/** 切換背景音樂：0 = 選單，1~5 = 各階，null = 停止。 */
export function musicPlay(id: number | null) {
  musicWanted = id
  const c = ensure()
  if (!c || c.state !== 'running') {
    // 尚未解鎖：等第一次互動後再開始
    if (!onRunning.includes(startWanted)) onRunning.push(startWanted)
    return
  }
  startWanted()
}
function stopMusicNow() {
  if (musicTimer != null) { clearInterval(musicTimer); musicTimer = null }
  musicThemeId = null
  if (musicEl) { musicEl.pause(); musicEl.removeAttribute('src'); musicEl.load(); musicEl = null }
  if (musicSrcNode) { try { musicSrcNode.disconnect() } catch { /* 已斷線 */ } musicSrcNode = null }
}
function startWanted() {
  const c = ctx
  if (!c || !musicBus) return
  const choice: MusicChoice = previewChoice ?? (musicWanted == null ? { type: 'off' } : resolver(musicWanted))
  const key = previewChoice || musicWanted != null ? choiceKey(choice) : 'none'
  if (key === curKey) return
  stopMusicNow()
  curKey = key
  applyDuck()
  if (choice.type === 'synth') {
    musicThemeId = choice.theme
    melody = makeMelody(THEMES[choice.theme] ?? THEMES[0])
    if (!THEMES[choice.theme]) musicThemeId = 0
    musicStep = 0
    musicNext = c.currentTime + 0.08
    musicTimer = window.setInterval(scheduleMusic, 40)
  } else if (choice.type === 'url') {
    const el = new Audio()
    el.loop = true
    el.preload = 'auto'
    el.src = choice.url
    musicEl = el
    try {
      musicSrcNode = c.createMediaElementSource(el)
      musicSrcNode.connect(musicBus)
    } catch { /* 無法接到混音器時，直接用元素本身播放 */ el.volume = Math.min(1, MUSIC_VOL * 2 * musicVolume) }
    void el.play().catch(() => { /* 需要使用者互動，下一次互動後會重試 */ curKey = null })
  }
}
/** 設定檔（指定曲目／上傳音檔）改變後，立刻套用到目前的音樂。 */
export function musicRefresh() { curKey = null; if (ctx?.state === 'running') startWanted(); else void ensure() }
/** 試聽：傳入 null 結束試聽，回到該欄位的音樂 */
export function musicPreview(choice: MusicChoice | null) {
  previewChoice = choice
  curKey = null
  const c = ensure()
  if (!c) return
  if (c.state === 'running') startWanted()
  else if (!onRunning.includes(startWanted)) onRunning.push(startWanted)
}
export function setMusicVolume(v: number) { musicVolume = Math.max(0, Math.min(1.5, v)); applyDuck() }
export function musicDuck(on: boolean) { ducked = on; applyDuck() }

/* ------------------------------------------------------------------ 環境音（海浪／瀑布／叢林） */

export interface AmbienceLevels { sea: number; falls: number; jungle: number }
interface AmbNodes { sea: GainNode; falls: GainNode; timer: number }
let amb: AmbNodes | null = null
let ambTarget: AmbienceLevels = { sea: 0, falls: 0, jungle: 0 }

function noiseLoop(c: AudioContext, seconds: number): AudioBufferSourceNode {
  const len = Math.floor(c.sampleRate * seconds)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) { last = last * 0.96 + (Math.random() * 2 - 1) * 0.3; d[i] = last }
  const s = c.createBufferSource()
  s.buffer = buf
  s.loop = true
  return s
}
function startAmbience() {
  const c = ctx
  if (amb || !c || !ambBus || c.state !== 'running') return
  // 海浪：低頻噪音 + 緩慢起伏（約 8 秒一個浪）
  const seaSrc = noiseLoop(c, 4)
  const seaLp = c.createBiquadFilter(); seaLp.type = 'lowpass'; seaLp.frequency.value = 900
  const seaSwell = c.createGain(); seaSwell.gain.value = 0.5
  const lfo = c.createOscillator(); lfo.frequency.value = 0.13
  const lfoAmt = c.createGain(); lfoAmt.gain.value = 0.45
  lfo.connect(lfoAmt).connect(seaSwell.gain)
  const sea = c.createGain(); sea.gain.value = 0
  seaSrc.connect(seaLp).connect(seaSwell).connect(sea).connect(ambBus)
  seaSrc.start(); lfo.start()
  // 瀑布：持續的帶通噪音
  const fSrc = noiseLoop(c, 3)
  const fBp = c.createBiquadFilter(); fBp.type = 'bandpass'; fBp.frequency.value = 1500; fBp.Q.value = 0.45
  const falls = c.createGain(); falls.gain.value = 0
  fSrc.connect(fBp).connect(falls).connect(ambBus)
  fSrc.start()
  // 叢林：隨機鳥鳴
  const timer = window.setInterval(() => {
    const v = ambTarget.jungle
    if (v < 0.08 || muted || c.state !== 'running') return
    if (Math.random() > 0.5 * v + 0.1) return
    const base = 1800 + Math.random() * 2200
    const n = 1 + Math.floor(Math.random() * 3)
    for (let k = 0; k < n; k++) {
      const t0 = c.currentTime + k * 0.11
      const o = c.createOscillator(); const g = c.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(base * (1 + 0.15 * k), t0)
      o.frequency.exponentialRampToValueAtTime(base * (1.5 + 0.1 * k), t0 + 0.08)
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(0.16 * v, t0 + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09)
      o.connect(g).connect(ambBus!)
      o.start(t0); o.stop(t0 + 0.12)
    }
  }, 380)
  amb = { sea, falls, timer }
}
/** 依玩家位置設定各環境音的音量（0~1）。 */
export function setAmbience(l: AmbienceLevels) {
  ambTarget = l
  const c = ctx
  if (!c || c.state !== 'running') return
  startAmbience()
  if (!amb) return
  amb.sea.gain.setTargetAtTime(l.sea * 0.55, c.currentTime, 0.4)
  amb.falls.gain.setTargetAtTime(l.falls * 0.5, c.currentTime, 0.4)
}
export function stopAmbience() { setAmbience({ sea: 0, falls: 0, jungle: 0 }) }
