import { useGame } from '../game/store'
import { sfx } from '../game/audio'
import { LEVEL_COUNT, LEVEL_INFO } from '../game/levels'
import { NOTES } from '../game/notes'
import { Brick, COLORS, Key, NoteIcon } from './parts'

const TITLE: Array<[string, string, string]> = [
  ['揚', COLORS.red, '#fff'], ['升', COLORS.yellow, COLORS.black], ['人', COLORS.blue, '#fff'], ['生', COLORS.green, '#fff'],
]

/** 五階小階梯：已通關的階段會亮起，呼應「揚升」。 */
function Staircase({ cleared }: { cleared: Set<string> }) {
  return (
    <div className="flex items-end gap-2" aria-label="五階進度">
      {LEVEL_INFO.map((l, i) => (
        <Brick key={l.id} color={cleared.has(String(l.id)) ? l.color : '#4a5a6b'} className="flex w-14 items-center justify-center pb-1 pt-2 text-sm md:w-16" style={{ height: 34 + i * 14, color: cleared.has(String(l.id)) ? l.ink : 'rgba(255,255,255,.55)' }}>
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
      <div className="panel-backdrop flex min-h-full w-full max-w-[740px] flex-col justify-between px-8 py-7 md:px-12 md:py-8" style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 56px) 100%, 0 100%)' }}>
        <div>
          <div className="mb-5 flex gap-3 pt-1" data-testid="title">
            {TITLE.map(([ch, bg, fg], i) => (
              <Brick key={ch} color={bg} className="animate-pop flex h-[84px] w-[80px] items-center justify-center text-6xl font-black md:h-[100px] md:w-[94px] md:text-6xl" style={{ color: fg, animationDelay: `${i * 90}ms` }}>
                {ch}
              </Brick>
            ))}
          </div>
          <Brick color={COLORS.white} className="inline-block px-5 py-2">
            <span className="ink-text text-xl md:text-2xl">五階學習闖關 · 樂高積木世界</span>
          </Brick>
          <p className="mt-5 max-w-md text-base font-bold leading-relaxed text-white/90">
            操控樂高小人，一階一階向上走：認識自己、經營關係、平衡人生、看見宇宙、回到合一。每一關集齊 4 張筆記磚，整理成屬於你的學習筆記。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1">
            <button className="btn btn-lg btn-yellow" onClick={() => start(1)} data-testid="start">{hasProgress ? '重新出發' : '開始旅程'}</button>
            <button className="btn btn-lg btn-blue" onClick={() => { sfx.click(); goSelect() }} data-testid="select">選擇階段</button>
            <button className="btn btn-lg btn-white" onClick={() => { sfx.click(); openNotes('menu') }} data-testid="open-notes">
              <NoteIcon size={26} />學習筆記 {save.notes.length}/{NOTES.length}
            </button>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 text-white">
          <Staircase cleared={cleared} />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-white/90">
            <span className="flex items-center gap-1.5"><Key>W</Key><Key>A</Key><Key>S</Key><Key>D</Key> / <Key>↑</Key><Key>←</Key><Key>↓</Key><Key>→</Key> 移動</span>
            <span className="flex items-center gap-1.5"><Key wide>Space</Key> 跳躍</span>
            <span className="flex items-center gap-1.5"><Key>Esc</Key> 暫停</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-white/60">
            <span>已通關 {cleared.size} / {LEVEL_COUNT}</span>
            <button className="underline underline-offset-4 hover:text-white" onClick={() => { sfx.click(); openMusic('menu') }} data-testid="open-music">音樂設定</button>
            <button className="underline underline-offset-4 hover:text-white" onClick={toggleMute}>{save.muted ? '音效：關' : '音效：開'}（M）</button>
          </div>
        </div>
      </div>
    </div>
  )
}
