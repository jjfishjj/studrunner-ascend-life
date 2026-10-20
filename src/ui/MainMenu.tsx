import { useGame } from '../game/store'
import { sfx } from '../game/audio'
import { LEVEL_COUNT, LEVEL_INFO } from '../game/levels'
import { NOTES } from '../game/notes'
import { Brick, COLORS, Key, NoteIcon } from './parts'

const TITLE: Array<[string, string, string]> = [
  ['揚', COLORS.red, '#fff'], ['升', COLORS.yellow, COLORS.black], ['人', COLORS.blue, '#fff'], ['生', COLORS.green, '#fff'],
]

/** 五階小階梯：已通關的階段會亮起，呼應「揚升」。 */
function Staircase({ cleared, compact = false }: { cleared: Set<string>; compact?: boolean }) {
  return (
    <div className="flex items-end gap-2" aria-label="五階進度">
      {LEVEL_INFO.map((l, i) => (
        <Brick key={l.id} color={cleared.has(String(l.id)) ? l.color : '#4a5a6b'} className="flex w-10 items-center justify-center pb-1 pt-2 text-xs sm:w-14 sm:text-sm md:w-16" style={{ height: compact ? 26 + i * 7 : 34 + i * 14, color: cleared.has(String(l.id)) ? l.ink : 'rgba(255,255,255,.55)' }}>
          <span className="font-black">{l.label}</span>
        </Brick>
      ))}
    </div>
  )
}

export function MainMenu() {
  const { start, goSelect, openNotes, openMusic, save, toggleMute } = useGame()
  const cleared = new Set(Object.keys(save.best))
  const hasProgress = save.notes.length > 0 || cleared.size > 0
  return (
    <div className="absolute inset-0 flex items-stretch overflow-y-auto">
      <div className="panel-backdrop flex min-h-full w-full max-w-[740px] flex-col justify-between px-5 py-4 sm:px-8 sm:py-6 md:px-12 md:py-8" style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 56px) 100%, 0 100%)' }}>
        <div>
          <div className="mb-3 flex gap-2 pt-1 sm:mb-5 sm:gap-3" data-testid="title">
            {TITLE.map(([ch, bg, fg], i) => (
              <Brick key={ch} color={bg} className="animate-pop flex h-[68px] w-[70px] items-center justify-center text-5xl font-black sm:h-[84px] sm:w-[80px] sm:text-6xl md:h-[100px] md:w-[94px]" style={{ color: fg, animationDelay: `${i * 90}ms` }}>
                {ch}
              </Brick>
            ))}
          </div>
          <Brick color={COLORS.white} className="inline-block px-3 py-2 sm:px-5">
            <span className="ink-text text-base sm:text-xl md:text-2xl">五階學習闖關 · 樂高積木世界</span>
          </Brick>
          <p className="mt-3 max-w-md text-sm font-bold leading-relaxed text-white/90 sm:mt-5 sm:text-base">
            一段穿越五種自然地景的學習旅程：從森林家園、夕照海灣與五運河谷，登上星瀑觀象台，再走進叢林、瀑布與海灘交會的合一迷宮。每關尋回 4 張地標筆記磚，把探索化成自己的練習。
          </p>
          <div className="mt-3 grid max-w-md grid-cols-3 gap-2 sm:mt-5 xl:hidden" aria-label="自然場景預覽">
            {[
              ['森林源頭', '#2D8A58', '覺察・感恩'],
              ['星瀑夜行', '#5556B9', '宇宙・共振'],
              ['海灘／叢林', '#1C9B9A', '自然・合一'],
            ].map(([name, color, cue]) => <div key={name} className="rounded-lg border border-white/20 px-2 py-2 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${color}cc, rgba(5,20,45,.78))` }}>
              <div className="text-[11px] font-black">{name}</div><div className="mt-0.5 text-[9px] font-bold opacity-85">{cue}</div>
            </div>)}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 sm:mt-6">
            <button className="btn btn-lg btn-yellow" onClick={() => start(1)} data-testid="start">{hasProgress ? '重新出發' : '開始旅程'}</button>
            <button className="btn btn-lg btn-blue" onClick={() => { sfx.click(); goSelect() }} data-testid="select">選擇階段</button>
            <button className="btn btn-lg btn-white" onClick={() => { sfx.click(); openNotes('menu') }} data-testid="open-notes">
              <NoteIcon size={26} />學習筆記 {save.notes.length}/{NOTES.length}
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-white sm:mt-6 sm:gap-3">
          <Staircase cleared={cleared} compact />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold text-white/90 sm:text-xs">
            <span className="sm:hidden">WASD／方向鍵移動 · Space 跳躍 · Esc 暫停</span>
            <span className="hidden items-center gap-1.5 sm:flex"><Key>W</Key><Key>A</Key><Key>S</Key><Key>D</Key> / <Key>↑</Key><Key>←</Key><Key>↓</Key><Key>→</Key> 移動</span>
            <span className="hidden items-center gap-1.5 sm:flex"><Key wide>Space</Key> 跳躍</span>
            <span className="hidden items-center gap-1.5 sm:flex"><Key>Esc</Key> 暫停</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-white/60">
            <span>已通關 {cleared.size} / {LEVEL_COUNT}</span>
            <button className="underline underline-offset-4 hover:text-white" onClick={() => { sfx.click(); openMusic('menu') }} data-testid="open-music">音樂設定</button>
            <button className="underline underline-offset-4 hover:text-white" onClick={toggleMute}>{save.muted ? '音效：關' : '音效：開'}（M）</button>
          </div>
        </div>
      </div>
      <aside className="absolute right-6 top-1/2 hidden w-[min(340px,27vw)] -translate-y-1/2 rounded-2xl border border-white/20 bg-[#061633]/65 p-4 text-white shadow-2xl backdrop-blur-md xl:block" aria-label="五階自然旅程預覽">
        <div className="text-[11px] font-black tracking-[.28em] text-white/65">五階學習 × 五境地景</div>
        <h2 className="mt-1 text-xl font-black">選一段旅程先看</h2>
        <p className="mt-1 text-xs font-bold leading-relaxed text-white/70">每張積木卡都連結一種環境與一個生活練習。</p>
        <div className="mt-3 flex flex-col gap-2">
          {LEVEL_INFO.map((l, i) => <button key={l.id} onClick={() => { sfx.click(); start(l.id) }} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:-translate-x-1 hover:bg-white/15" data-testid={`preview-stage-${l.id}`}>
            <span className="brick brick-studs flex h-9 w-10 shrink-0 items-center justify-center text-sm font-black" style={{ ['--c' as string]: l.color, color: l.ink }}>{l.label}</span>
            <span className="min-w-0"><span className="block truncate text-sm font-black">{l.environment}</span><span className="mt-0.5 block truncate text-[10px] font-bold text-white/65">{l.name} · {['自我與家園', '親密關係', '生活平衡', '宇宙觀', '自然合一'][i]}</span></span>
            <span className="ml-auto text-lg text-lyellow transition group-hover:translate-x-1">›</span>
          </button>)}
        </div>
        <div className="mt-3 rounded-xl bg-black/20 px-3 py-2 text-[10px] font-bold leading-relaxed text-white/70">戴上耳機，沿途聽見鳥鳴、溪流、海浪與瀑布聲；音景會隨所在位置變化。</div>
      </aside>
    </div>
  )
}
