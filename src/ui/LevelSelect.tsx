import { LEVEL_INFO } from '../game/levels'
import { formatTime } from '../game/rules'
import { sfx } from '../game/audio'
import { useGame } from '../game/store'
import { Brick, COLORS, Stars } from './parts'

export function LevelSelect() {
  const { start, goMenu, save, setAttract, attract } = useGame()
  return (
    <div className="panel-backdrop absolute inset-0 flex flex-col px-6 py-8 md:px-14 md:py-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="lego-text text-xs tracking-[.4em] text-white/70">LEVEL SELECT</div>
          <h2 className="lego-text mt-1 text-4xl md:text-5xl">選擇關卡</h2>
        </div>
        <button className="btn btn-white" onClick={() => { sfx.click(); goMenu() }} data-testid="back">返回主選單</button>
      </div>

      <div className="mt-auto grid grid-cols-1 gap-8 pb-4 md:grid-cols-3 md:gap-9">
        {LEVEL_INFO.map(l => {
          const best = save.best[String(l.id)]
          return (
            <Brick key={l.id} color={l.color} className={`group flex flex-col p-5 transition-transform md:p-6 ${attract === l.id ? '-translate-y-2' : ''}`}>
              <div onMouseEnter={() => setAttract(l.id)} onFocus={() => setAttract(l.id)} className="flex flex-1 flex-col">
                <div className="flex items-start justify-between">
                  <Brick color={COLORS.white} className="flex h-16 w-16 items-center justify-center">
                    <span className="ink-text text-4xl">{l.id}</span>
                  </Brick>
                  <div className="text-right">
                    <Stars n={best?.stars ?? 0} size={30} />
                    <div className="lego-text mt-1 text-xs text-white/85">{best ? `最佳 ${formatTime(best.time)}` : '尚未通關'}</div>
                  </div>
                </div>
                <h3 className="lego-text mt-5 text-3xl">{l.name}</h3>
                <div className="lego-text mt-0.5 text-sm tracking-widest text-white/80">{l.subtitle}</div>
                <p className="mt-3 min-h-[3.2rem] text-sm font-bold leading-relaxed text-white/90">{l.blurb}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-md bg-black/25 px-2.5 py-1 text-xs font-black text-white">{l.icon}</span>
                  <button className="btn btn-yellow" onClick={() => start(l.id)} data-testid={`level-${l.id}`}>出發</button>
                </div>
              </div>
            </Brick>
          )
        })}
      </div>
    </div>
  )
}
