/** 極簡音效：全部由 Web Audio 即時合成，無外部檔案。 */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function setMuted(m: boolean) {
  muted = m
  if (master) master.gain.value = m ? 0 : 0.5
}

/** 需在使用者手勢後呼叫以解鎖音訊 */
export function unlockAudio() { ensure() }

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.18, slideTo?: number, delay = 0) {
  const c = ensure()
  if (!c || !master || muted) return
  const t0 = c.currentTime + delay
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(master)
  o.start(t0)
  o.stop(t0 + dur + 0.03)
}

function noise(dur: number, vol = 0.2, delay = 0) {
  const c = ensure()
  if (!c || !master || muted) return
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const s = c.createBufferSource()
  const g = c.createGain()
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 900
  g.gain.value = vol
  s.buffer = buf
  s.connect(f).connect(g).connect(master)
  s.start(c.currentTime + delay)
}

export const sfx = {
  click: () => tone(520, 0.07, 'square', 0.1),
  coin: () => { tone(988, 0.08, 'square', 0.14); tone(1318, 0.18, 'square', 0.14, undefined, 0.07) },
  note: () => { [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, undefined, i * 0.07)) },
  jump: () => tone(300, 0.16, 'sine', 0.2, 640),
  land: () => noise(0.1, 0.25),
  hurt: () => { tone(220, 0.3, 'sawtooth', 0.2, 70); noise(0.18, 0.25) },
  fall: () => tone(520, 0.5, 'triangle', 0.2, 80),
  checkpoint: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.14, 'triangle', 0.18, undefined, i * 0.08)) },
  switch: () => { tone(180, 0.08, 'square', 0.18); tone(360, 0.14, 'square', 0.14, undefined, 0.06) },
  gateOpen: () => tone(110, 0.5, 'sawtooth', 0.12, 330),
  gateClose: () => tone(330, 0.5, 'sawtooth', 0.12, 90),
  locked: () => { tone(160, 0.12, 'square', 0.14); tone(130, 0.18, 'square', 0.14, undefined, 0.1) },
  win: () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'square', 0.15, undefined, i * 0.11)) },
  lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.28, 'triangle', 0.2, undefined, i * 0.2)) },
}
