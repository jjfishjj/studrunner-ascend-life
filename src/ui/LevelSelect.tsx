import { LEVEL_INFO } from '../game/levels'
import { formatTime } from '../game/rules'
import { sfx } from '../game/audio'
import { useGame } from '../game/store'
import { NOTES, notesOfStage } from '../game/notes'
import { Brick, COLORS, NoteIcon, NotePips, Stars } from './parts'

export function LevelSelect() {
  const { start, goMenu, openNotes, openMusic, save, setAttract, attract } = useGame()
  const got = new Set(save.notes)
  return (
    <div className="panel-backdrop absolute inset-0 flex flex-col overflow-y-auto px-5 py-7 md:px-10 md:py-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="lego-text text-xs tracking-[.4em] text-white/70">ASCEND · 揚升之路</div>
          <h2 className="lego-text mt-1 text-4xl md:text-5xl">選擇階段</h2>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-yellow" onClick={() => { sfx.click(); openNotes('select') }} data-testid="open-notes"><NoteIcon size={24} />學習筆記 {save.notes.length}/{NOTES.length}</button>
          <button className="btn btn-blue" onClick={() => { sfx.click(); openMusic('select') }} data-testid="open-music">音樂設定</button>
          <button className="btn btn-white" onClick={() => { sfx.click(); goMenu() }} data-testid="back">返回</button>
        </div>
      </div>
      <div className="mt-auto grid grid-cols-1 items-end gap-x-4 gap-y-8 pb-4 pt-10 sm:grid-cols-2 lg:grid-cols-5">
        {LEVEL_INFO.map((l, i) => {
          const best = save.best[String(l.id)]
          const mine = notesOfStage(l.stage)
          const n = mine.filter(x => got.has(x.id)).length
          return (
            <div key={l.id} className="lg:transition-transform" style={{ transform: `translateY(${-i * 16}px)` }}>
              <Brick color={l.color} className={`flex h-full flex-col p-4 transition-transform ${attract === l.id ? '-translate-y-2' : ''}`}>
                <div onMouseEnter={() => setAttract(l.id)} onFocus={() => setAttract(l.id)} className="flex flex-1 flex-col" style={{ color: l.ink }}>
                  <div className="flex items-start justify-between">
                    <Brick color={l.ink === '#FFFFFF' ? COLORS.white : COLORS.black} className="flex h-12 w-14 items-center justify-center">
                      <span className="text-xl font-black" style={{ color: l.ink === '#FFFFFF' ? COLORS.black : '#fff' }}>{l.label}</span>
                    </Brick>
                    <div className="text-right">
                      <Stars n={best?.stars ?? 0} size={22} />
                      <div className="mt-0.5 text-[11px] font-black opacity-80">{best ? `最佳 ${formatTime(best.time)}` : '尚未通關'}</div>
                    </div>
                  </div>
                  <h3 className="mt-4 text-2xl font-black leading-tight">{l.name}</h3>
                  <div className="mt-0.5 text-sm font-black opacity-90">{l.subtitle}</div>
                  <div className="mt-2 text-[11px] font-bold leading-snug opacity-75">{l.theme}</div>
                  <div className="mt-2 rounded-lg bg-black/15 px-2 py-1 text-[11px] font-black">地景｜{l.environment}</div>
                  <p className="mt-3 min-h-[3.8rem] text-xs font-bold leading-relaxed opacity-95">{l.blurb}</p>
                  <p className="mt-2 min-h-[3.7rem] rounded-lg bg-white/25 px-2 py-1.5 text-[11px] font-bold leading-relaxed">{l.arc}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <NotePips got={n} color={l.ink === '#FFFFFF' ? '#F2CD37' : '#C91A09'} />
                    <span className="rounded-md bg-black/25 px-2 py-0.5 text-[11px] font-black" style={{ color: '#fff' }}>{l.tag}</span>
                  </div>
                  <button className="btn btn-yellow mt-4 w-full" style={l.id === 2 ? { ['--c' as string]: COLORS.white } : undefined} onClick={() => start(l.id)} data-testid={`level-${l.id}`}>出發</button>
                </div>
              </Brick>
            </div>
          )
        })}
      </div>
    </div>
  )
}
