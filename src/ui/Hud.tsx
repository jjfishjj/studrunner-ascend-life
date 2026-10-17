import { LEVEL_COUNT, LEVEL_INFO } from '../game/levels'
import { buildLevelHint } from './hints'
import { formatTime } from '../game/rules'
import { useGame } from '../game/store'
import { NOTE_BY_ID, stageOf } from '../game/notes'
import { Brick, COLORS, CoinIcon, Heart, Key, NoteIcon } from './parts'

export function Hud() {
  const levelId = useGame(s => s.levelId)
  const runId = useGame(s => s.runId)
  const hud = useGame(s => s.hud)
  const toast = useGame(s => s.toast)
  const noteCard = useGame(s => s.noteCard)
  const flash = useGame(s => s.flash)
  const muted = useGame(s => s.save.muted)
  const info = LEVEL_INFO[levelId - 1]
  const danger = hud.countdown && hud.time <= 15
  const hearts = Array.from({ length: hud.livesMax }, (_, i) => i < hud.lives)
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* 頂部列 */}
      <div className="absolute left-0 right-0 top-0 flex items-start justify-between gap-3 px-4 pt-5 md:px-8">
        <Brick color={info.color} className="px-4 py-2" style={{ minWidth: 150, color: info.ink }}>
          <div className="text-[11px] font-black tracking-[.3em] opacity-80">第 {levelId} / {LEVEL_COUNT} 關</div>
          <div className="text-xl font-black leading-tight" data-testid="hud-level">{info.label} · {info.name}</div>
        </Brick>

        <div className="flex flex-col items-center">
          <Brick color={danger ? COLORS.red : COLORS.white} className={`px-6 py-1.5 text-center ${danger ? 'timer-danger' : ''}`}>
            <div className={`text-[10px] font-black tracking-[.3em] ${danger ? 'text-white/80' : 'text-[#1B2A34]/60'}`}>{hud.countdown ? '剩餘時間' : '通關計時'}</div>
            <div className={`font-mono text-3xl font-black tabular-nums ${danger ? 'text-white' : 'text-[#1B2A34]'}`} data-testid="hud-time">{formatTime(hud.time)}</div>
          </Brick>
          {hud.gate > 0 && (
            <Brick color={COLORS.blue} className="mt-3 px-4 py-1.5">
              <div className="lego-text text-sm">閘門開啟中　{hud.gate.toFixed(1)} 秒</div>
              <div className="mt-1 h-2 w-44 overflow-hidden rounded-full bg-black/30">
                <div className="h-full bg-lyellow" style={{ width: `${Math.min(100, (hud.gate / 12) * 100)}%` }} />
              </div>
            </Brick>
          )}
        </div>

        <div className="flex flex-wrap items-start justify-end gap-3">
          <Brick color={COLORS.white} className="flex items-center gap-1 px-3 py-2">
            <div className="ink-text mr-1 text-xs">生命</div>
            <div className="flex gap-0.5" data-testid="hud-lives" data-lives={hud.lives}>{hearts.map((on, i) => <Heart key={i} on={on} />)}</div>
          </Brick>
          {levelId <= 5 && <Brick color={info.color} className="flex items-center gap-2 px-3 py-2" style={{ color: info.ink }}>
            <NoteIcon size={28} color="#F2F3F2" />
            <div className="font-mono text-2xl font-black tabular-nums" data-testid="hud-notes">
              {hud.notes}<span className="text-lg opacity-70"> / {hud.notesTotal}</span>
            </div>
          </Brick>}
          <Brick color={COLORS.yellow} className="flex items-center gap-2 px-4 py-2">
            <CoinIcon />
            <div className="ink-text flex flex-col font-mono text-2xl tabular-nums" data-testid="hud-coins">
              <span className="font-sans text-[10px] font-black leading-none">{levelId === 6 ? '星之碎片' : '金幣'}</span>
              <span>{hud.coins}{hud.coinsTotal > 0 && <span className="text-lg opacity-60"> / {hud.coinsTotal}</span>}</span>
            </div>
          </Brick>
        </div>
      </div>

      {/* 左下操作提示 */}
      <div className="absolute bottom-4 left-4 hidden items-center gap-4 rounded-xl bg-black/35 px-3 py-2 text-xs font-bold text-white md:flex">
        <span className="flex items-center gap-1"><Key>W</Key><Key>A</Key><Key>S</Key><Key>D</Key> 移動</span>
        <span className="flex items-center gap-1"><Key wide>Space</Key> 跳躍</span>
        <span className="flex items-center gap-1"><Key>Esc</Key> 暫停</span>
        <span className="flex items-center gap-1"><Key>M</Key> {muted ? '音效關' : '音效開'}</span>
      </div>

      {/* 關卡開場提示 */}
      <div key={`intro-${runId}`} className="intro-anim absolute left-1/2 top-[22%] -translate-x-1/2 text-center">
        <Brick color={info.color === COLORS.yellow ? COLORS.white : COLORS.yellow} className="px-8 py-3">
          <div className="ink-text text-sm tracking-[.3em] opacity-70">{info.label} · {info.subtitle}</div>
          <div className="ink-text text-4xl">{info.name}</div>
        </Brick>
        <div className="lego-text mx-auto mt-4 max-w-lg rounded-xl bg-black/45 px-5 py-2 text-sm md:text-base">{buildLevelHint(levelId)}</div>
        <div className="mx-auto mt-2 max-w-lg rounded-xl border border-white/25 bg-[#0B2A5B]/65 px-4 py-2 text-sm font-bold leading-relaxed text-white/95 shadow-lg">
          <span className="text-lyellow">{info.environment}</span><br />{info.reflection}
        </div>
      </div>

      {/* 筆記卡：撿到筆記磚時彈出 */}
      {noteCard && NOTE_BY_ID[noteCard.id] && (() => {
        const def = NOTE_BY_ID[noteCard.id]
        const st = stageOf(def.stage)
        return (
          <div key={`note-${noteCard.nonce}`} className="notecard-anim absolute bottom-[19%] left-1/2 w-[min(30rem,92vw)]" data-testid="note-card">
            <Brick color={st.color} className="px-6 py-4" style={{ color: st.ink }}>
              <div className="text-[11px] font-black tracking-[.3em] opacity-80">獲得筆記磚 · {st.label}</div>
              <div className="mt-0.5 text-2xl font-black">{def.id}_{def.name}</div>
              <div className="mt-2 rounded-lg bg-black/15 px-3 py-2">
                <div className="text-[11px] font-black opacity-80">地景地標｜{def.landmark}</div>
                <p className="mt-1 text-sm font-bold leading-relaxed opacity-95">{def.encounter}</p>
              </div>
              <p className="mt-2 text-xs font-bold leading-relaxed opacity-80">{def.summary}</p>
            </Brick>
          </div>
        )
      })()}
      {/* 提示訊息 */}
      {toast && (
        <div key={toast.id} className="toast-anim absolute bottom-[14%] left-1/2 -translate-x-1/2">
          <Brick color={toast.tone === 'bad' ? COLORS.red : toast.tone === 'good' ? COLORS.green : COLORS.blue} className="px-6 py-2">
            <span className="lego-text text-xl" data-testid="toast">{toast.text}</span>
          </Brick>
        </div>
      )}

      {/* 受傷閃紅 */}
      {flash > 0 && <div key={`flash-${flash}`} className="flash-anim absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(201,26,9,0) 40%, rgba(201,26,9,.75) 100%)' }} />}
    </div>
  )
}
