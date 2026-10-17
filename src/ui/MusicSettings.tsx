import { useEffect, useRef, useState } from 'react'
import { musicPreview } from '../game/audio'
import { sfx } from '../game/audio'
import { BUILTIN_TRACKS, MUSIC_SLOTS, OFF_ID, allTracks, choiceOf, effectiveTrackId, useMusic } from '../game/musicLibrary'
import { useGame } from '../game/store'

const fmtSize = (n?: number) => (n == null ? '' : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

function PlayBtn({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-black/25 text-lg font-black shadow ${on ? 'bg-lyellow text-lblack' : 'bg-white text-lblack hover:bg-lyellow'}`}
    >
      {on ? '■' : '▶'}
    </button>
  )
}

export function MusicSettings() {
  const { musicFrom, goMenu, goSelect } = useGame()
  const m = useMusic()
  const [playing, setPlaying] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const tracks = allTracks(m)
  useEffect(() => () => musicPreview(null), [])
  const toggle = (key: string, trackId: string) => {
    sfx.click()
    if (playing === key) { setPlaying(null); musicPreview(null); return }
    setPlaying(key)
    musicPreview(choiceOf(trackId))
  }
  const back = () => { sfx.click(); musicPreview(null); (musicFrom === 'select' ? goSelect : goMenu)() }
  const stopAll = () => { setPlaying(null); musicPreview(null) }
  return (
    <div className="panel-backdrop absolute inset-0 flex flex-col overflow-y-auto px-5 py-7 md:px-10 md:py-9" data-testid="music-settings">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="lego-text text-xs tracking-[.4em] text-white/70">MUSIC · 背景音樂管理</div>
          <h2 className="lego-text mt-1 text-4xl md:text-5xl">音樂設定</h2>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-white" onClick={() => { sfx.click(); stopAll(); m.resetAll() }} data-testid="music-reset">全部還原預設</button>
          <button className="btn btn-yellow" onClick={back} data-testid="back">完成</button>
        </div>
      </div>

      <div className="mt-8 grid flex-1 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* 每一關配哪一首 */}
        <section className="rounded-2xl bg-black/30 p-5 text-white">
          <h3 className="lego-text text-2xl">每一關配哪一首</h3>
          <p className="mt-1 text-sm font-bold text-white/70">選好就會立即套用；按 ▶ 可以試聽。</p>
          <div className="mt-4 flex flex-col gap-3">
            {MUSIC_SLOTS.map(s => {
              const cur = effectiveTrackId(s.slot, m)
              const key = `slot-${s.slot}`
              return (
                <div key={s.slot} className="flex items-center gap-3 rounded-xl bg-white/10 p-3" data-testid={`slot-${s.slot}`}>
                  <div className="w-36 shrink-0">
                    <div className="text-base font-black leading-tight">{s.label}</div>
                    <div className="text-xs font-bold text-white/60">{s.hint}</div>
                  </div>
                  <select
                    value={cur}
                    onChange={e => { stopAll(); m.setAssign(s.slot, e.target.value) }}
                    className="min-w-0 flex-1 rounded-lg border-2 border-black/30 bg-white px-3 py-2 text-sm font-bold text-lblack"
                    data-testid={`select-${s.slot}`}
                  >
                    <option value={OFF_ID}>不播放音樂</option>
                    <optgroup label="內建曲目">
                      {BUILTIN_TRACKS.map(t => <option key={t.id} value={t.id}>{t.name}{t.id === `builtin-${s.slot}` ? '（預設）' : ''}</option>)}
                    </optgroup>
                    {m.files.length > 0 && <optgroup label="曲庫（管理者提供）">{m.files.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>}
                    {m.uploads.length > 0 && <optgroup label="我上傳的">{m.uploads.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>}
                  </select>
                  <PlayBtn on={playing === key} onClick={() => toggle(key, cur)} label={playing === key ? '停止試聽' : '試聽'} />
                </div>
              )
            })}
          </div>
          <div className="mt-5 flex items-center gap-3">
            <label htmlFor="mvol" className="w-24 shrink-0 text-sm font-black">音樂音量</label>
            <input id="mvol" type="range" min={0} max={1.5} step={0.05} value={m.volume} onChange={e => m.setVolume(Number(e.target.value))} className="flex-1 accent-yellow-400" data-testid="music-volume" />
            <span className="w-12 text-right font-mono text-sm font-bold">{Math.round(m.volume * 100)}%</span>
          </div>
        </section>

        {/* 上傳 */}
        <section className="flex flex-col rounded-2xl bg-black/30 p-5 text-white">
          <h3 className="lego-text text-2xl">上傳音樂</h3>
          <p className="mt-1 text-sm font-bold text-white/70">支援 mp3、ogg、wav、m4a，每首最多 25 MB，最多 20 首。</p>
          <label
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); void m.addFiles(e.dataTransfer.files) }}
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-4 border-dashed px-4 py-8 text-center transition-colors ${drag ? 'border-lyellow bg-lyellow/20' : 'border-white/40 bg-white/5 hover:bg-white/10'}`}
          >
            <span className="text-3xl font-black">＋</span>
            <span className="text-base font-black">點這裡選擇檔案，或把音檔拖進來</span>
            <input ref={fileRef} type="file" accept="audio/*,.mp3,.ogg,.wav,.m4a,.aac,.flac,.opus" multiple className="sr-only" data-testid="music-file"
              onChange={e => { if (e.target.files) void m.addFiles(e.target.files); e.target.value = '' }} />
          </label>
          {m.error && <p className="mt-3 rounded-lg bg-lred/80 px-3 py-2 text-sm font-bold" role="alert" data-testid="music-error">{m.error}</p>}
          <div className="mt-4 flex flex-col gap-2" data-testid="upload-list">
            {m.uploads.length === 0 && <p className="text-sm font-bold text-white/60">還沒有上傳任何音樂。</p>}
            {m.uploads.map(t => {
              const key = `up-${t.id}`
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-xl bg-white/10 p-2.5">
                  <PlayBtn on={playing === key} onClick={() => toggle(key, t.id)} label={playing === key ? '停止試聽' : '試聽'} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black">{t.name}</div>
                    <div className="text-xs font-bold text-white/60">{fmtSize(t.size)}</div>
                  </div>
                  <button className="rounded-lg bg-lred px-3 py-2 text-xs font-black text-white hover:brightness-110" onClick={() => { sfx.click(); if (playing === key) stopAll(); void m.removeUpload(t.id) }} aria-label={`刪除 ${t.name}`}>刪除</button>
                </div>
              )
            })}
          </div>
          <div className="mt-auto pt-5 text-xs font-bold leading-relaxed text-white/60">
            上傳的音樂只存在「這個瀏覽器」，換裝置或清除瀏覽資料就會消失，也不會被其他玩家聽到。
            想讓所有玩家都聽到，請把音檔放進專案的 <code className="rounded bg-black/40 px-1">public/music/</code> 並編輯 <code className="rounded bg-black/40 px-1">manifest.json</code>（說明在同一資料夾的 README.md）。
            {tracks.length > BUILTIN_TRACKS.length ? '' : ''}
          </div>
        </section>
      </div>
    </div>
  )
}
