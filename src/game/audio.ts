/**
 * 音效系統：全部由 Web Audio 即時合成，無外部檔案。
 * - sfx：短音效（跳躍、金幣、筆記磚……）
 * - music：每一階各有一首會循環的小曲（由程式依種子生成旋律）
 * - ambience：海浪、瀑布、溪流、森林／草地、叢林昆蟲、山風與宇宙音景（依玩家位置調整音量）
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
  else flushRunning()
  return ctx
}
function flushRunning() {
  if (ctx?.state !== 'running') return
  while (onRunning.length) onRunning.shift()!()
  if (AMBIENCE_KINDS.some(k => ambTarget[k] > 0.01)) startAmbience()
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

/* ------------------------------------------------------------------ 程序環境音景（全由 Web Audio 合成，依位置平滑混音） */
export const AMBIENCE_KINDS = ['sea', 'falls', 'jungle', 'forest', 'river', 'wind', 'cosmos', 'night', 'meadow', 'birds', 'insects'] as const
export type AmbienceKind = typeof AMBIENCE_KINDS[number]
export type AmbienceLevels = Record<AmbienceKind, number>
const ZERO_AMBIENCE = Object.fromEntries(AMBIENCE_KINDS.map(k => [k, 0])) as AmbienceLevels
interface AmbNodes { out: Record<AmbienceKind, GainNode>; timer: number; sources: AudioNode[] }
let amb: AmbNodes | null = null
let ambTarget: AmbienceLevels = { ...ZERO_AMBIENCE }

/** 可循環、淡化接縫的粉紅噪音，用來合成水、風與遠方空氣聲。 */
function noiseLoop(c: AudioContext, seconds: number): AudioBufferSourceNode {
  const len = Math.floor(c.sampleRate * seconds)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    last = last * 0.94 + (Math.random() * 2 - 1) * 0.11
    d[i] = last
  }
  // 把循環接縫交叉淡化，避免每隔數秒出現 click。
  const fade = Math.min(Math.floor(c.sampleRate * 0.18), Math.floor(len / 8))
  for (let i = 0; i < fade; i++) {
    const t = i / fade
    const head = d[i], tail = d[len - fade + i]
    d[i] = tail * (1 - t) + head * t
    d[len - fade + i] = tail * t + head * (1 - t)
  }
  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  return src
}
function startAmbience() {
  const c = ctx
  if (amb || !c || !ambBus || c.state !== 'running') return
  const out = Object.fromEntries(AMBIENCE_KINDS.map(k => {
    const g = c.createGain(); g.gain.value = 0; g.connect(ambBus!); return [k, g]
  })) as Record<AmbienceKind, GainNode>
  const sources: AudioNode[] = []
  const keep = <T extends AudioNode>(node: T): T => { sources.push(node); return node }
  const noiseBed = (kind: AmbienceKind, config: { hp: number; lp: number; gain: number; seconds?: number }) => {
    const src = keep(noiseLoop(c, config.seconds ?? 4)) as AudioBufferSourceNode
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = config.hp
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = config.lp
    const bed = c.createGain(); bed.gain.value = config.gain
    src.connect(hp).connect(lp).connect(bed).connect(out[kind]); src.start()
    return { src, hp, lp, bed }
  }
  // 海：深水低鳴 + 潮線寬頻噪音；兩個慢速包絡交疊成浪頭。
  const surf = noiseBed('sea', { hp: 75, lp: 1050, gain: 0.36, seconds: 6 })
  const swell = c.createOscillator(); swell.type = 'sine'; swell.frequency.value = 0.09
  const swellAmt = c.createGain(); swellAmt.gain.value = 0.22; swell.connect(swellAmt).connect(surf.bed.gain); swell.start(); keep(swell); keep(swellAmt)
  const hiss = noiseBed('sea', { hp: 720, lp: 4300, gain: 0.12, seconds: 3.5 })
  const hissLfo = c.createOscillator(); hissLfo.frequency.value = 0.17
  const hissAmt = c.createGain(); hissAmt.gain.value = 0.055; hissLfo.connect(hissAmt).connect(hiss.bed.gain); hissLfo.start(); keep(hissLfo); keep(hissAmt)
  // 瀑布：低頻水量、明亮水霧兩層，不用單一白噪音掩蓋音樂。
  noiseBed('falls', { hp: 95, lp: 820, gain: 0.22, seconds: 4 })
  noiseBed('falls', { hp: 760, lp: 5200, gain: 0.09, seconds: 3 })
  // 溪流：清亮中頻水聲，濾掉尖銳高頻；用輕微濾波漂移增加流動感。
  const stream = noiseBed('river', { hp: 260, lp: 2100, gain: 0.19, seconds: 4 })
  const streamLfo = c.createOscillator(); streamLfo.frequency.value = 0.21
  const streamAmt = c.createGain(); streamAmt.gain.value = 360; streamLfo.connect(streamAmt).connect(stream.lp.frequency); streamLfo.start(); keep(streamLfo); keep(streamAmt)
  // 森林／草地：很輕的風底，鳥鳴由下方的事件調度器間歇出現。
  noiseBed('forest', { hp: 110, lp: 1600, gain: 0.11, seconds: 5 })
  noiseBed('meadow', { hp: 180, lp: 2600, gain: 0.08, seconds: 4 })
  // 山風：寬頻氣流穿過中低通濾波器，慢速音量起伏與音色掃動。
  const breeze = noiseBed('wind', { hp: 130, lp: 3600, gain: 0.22, seconds: 6 })
  const windLfo = c.createOscillator(); windLfo.frequency.value = 0.055
  const windAmt = c.createGain(); windAmt.gain.value = 0.12; windLfo.connect(windAmt).connect(breeze.bed.gain); windLfo.start(); keep(windLfo); keep(windAmt)
  const windTone = c.createOscillator(); windTone.type = 'sine'; windTone.frequency.value = 172
  const windToneGain = c.createGain(); windToneGain.gain.value = 0.018
  windTone.connect(windToneGain).connect(out.wind); windTone.start(); keep(windTone); keep(windToneGain)
  // 夜蟲與叢林蟲鳴：窄帶高頻載波被 LFO 切成自然的脈衝。
  for (const [kind, base, rate, level] of [['insects', 2460, 5.4, 0.025], ['night', 2940, 4.1, 0.018], ['jungle', 2180, 7.2, 0.016]] as const) {
    const osc = c.createOscillator(); osc.type = 'sine'; osc.frequency.value = base
    const gain = c.createGain(); gain.gain.value = level
    const trem = c.createOscillator(); trem.frequency.value = rate
    const depth = c.createGain(); depth.gain.value = level * 0.8
    trem.connect(depth).connect(gain.gain); osc.connect(gain).connect(out[kind]); osc.start(); trem.start()
    keep(osc); keep(gain); keep(trem); keep(depth)
  }
  // 星際底音：柔和五度與八度和聲，讓旋律間有「空間」而非尖銳科幻警報。
  for (const [hz, vol, phase] of [[55, 0.032, 0], [82.41, 0.02, 0.7], [110, 0.014, 1.4]] as const) {
    const osc = c.createOscillator(); osc.type = 'sine'; osc.frequency.value = hz
    const lfo = c.createOscillator(); lfo.frequency.value = 0.03 + phase * 0.01
    const detune = c.createGain(); detune.gain.value = 1.8
    lfo.connect(detune).connect(osc.detune)
    const gain = c.createGain(); gain.gain.value = vol
    osc.connect(gain).connect(out.cosmos); osc.start(); lfo.start()
    keep(osc); keep(lfo); keep(detune); keep(gain)
  }
  // 遠近不只改底噪，也改鳥鳴的密度；聲像在左右耳之間緩慢移動。
  const timer = window.setInterval(() => {
    if (muted || c.state !== 'running') return
    const forest = ambTarget.forest + ambTarget.meadow * 0.45 + ambTarget.birds * 0.4
    const jungle = ambTarget.jungle + ambTarget.birds * 0.55
    const intensity = Math.max(forest, jungle)
    if (intensity < 0.08 || Math.random() > Math.min(0.78, 0.08 + intensity * 0.58)) return
    const t = c.currentTime + 0.02
    const base = jungle > forest ? 1850 + Math.random() * 2500 : 1450 + Math.random() * 2300
    const notes = jungle > forest && Math.random() < 0.3 ? 3 : 2
    const pan = c.createStereoPanner(); pan.pan.value = Math.random() * 1.6 - 0.8
    const voice = c.createGain(); voice.gain.setValueAtTime(0.0001, t)
    pan.connect(out[jungle > forest ? 'jungle' : 'forest'])
    voice.connect(pan)
    for (let k = 0; k < notes; k++) {
      const o = c.createOscillator(); o.type = k === 0 ? 'sine' : 'triangle'
      const st = t + k * (jungle > forest ? 0.095 : 0.16)
      const freq = base * (1 + 0.08 * k)
      o.frequency.setValueAtTime(freq, st)
      o.frequency.exponentialRampToValueAtTime(freq * (Math.random() < 0.5 ? 1.28 : 0.78), st + 0.12)
      const eg = c.createGain(); eg.gain.setValueAtTime(0.0001, st)
      eg.gain.exponentialRampToValueAtTime((jungle > forest ? 0.075 : 0.055) * intensity, st + 0.018)
      eg.gain.exponentialRampToValueAtTime(0.0001, st + 0.17)
      o.connect(eg).connect(voice); o.start(st); o.stop(st + 0.19); o.onended = () => { o.disconnect(); eg.disconnect() }
    }
    voice.gain.setValueAtTime(0.0001, t)
    voice.gain.setTargetAtTime(1, t, 0.025)
    voice.gain.setTargetAtTime(0.0001, t + 0.42, 0.055)
    window.setTimeout(() => { try { voice.disconnect(); pan.disconnect() } catch { /* 已自然結束 */ } }, 1000)
  }, 420)
  amb = { out, timer, sources }
  for (const k of AMBIENCE_KINDS) out[k].gain.setTargetAtTime(ambTarget[k] * 0.46, c.currentTime, 0.45)
}
/** 依各地景距離設定 0~1 強度；漸進式增益避免場景切換時爆音。 */
export function setAmbience(levels: Partial<AmbienceLevels>) {
  ambTarget = { ...ZERO_AMBIENCE, ...levels }
  for (const key of AMBIENCE_KINDS) ambTarget[key] = Math.max(0, Math.min(1, ambTarget[key] ?? 0))
  const c = ctx
  if (!c || c.state !== 'running') return
  startAmbience()
  if (!amb) return
  for (const key of AMBIENCE_KINDS) amb.out[key].gain.setTargetAtTime(ambTarget[key] * 0.46, c.currentTime, 0.5)
}
/** 暫停／離開遊戲時，快速淡出所有地景音。 */
export function stopAmbience() { setAmbience(ZERO_AMBIENCE) }
/** 測試／無障礙狀態列可讀取目前的地景混音，不暴露 AudioNode。 */
export function ambienceSnapshot(): Readonly<AmbienceLevels> { return { ...ambTarget } }
