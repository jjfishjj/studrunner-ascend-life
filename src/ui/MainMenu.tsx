import { useGame } from '../game/store'
import { sfx } from '../game/audio'
import { Brick, COLORS, Key } from './parts'

const LETTERS: Array<[string, string, string]> = [
  ['S', COLORS.red, '#fff'], ['T', COLORS.yellow, COLORS.black], ['U', COLORS.blue, '#fff'], ['D', COLORS.green, '#fff'],
]
const LETTERS2: Array<[string, string, string]> = [
  ['R', COLORS.white, COLORS.black], ['U', COLORS.red, '#fff'], ['N', COLORS.yellow, COLORS.black], ['N', COLORS.blue, '#fff'], ['E', COLORS.green, '#fff'], ['R', COLORS.black, '#fff'],
]

function LetterRow({ letters, delay = 0 }: { letters: Array<[string, string, string]>; delay?: number }) {
  return (
    <div className="flex gap-2.5">
      {letters.map(([ch, bg, fg], i) => (
        <Brick key={i} color={bg} className="animate-pop flex h-[72px] w-[64px] items-center justify-center text-5xl font-black md:h-[88px] md:w-[78px] md:text-6xl" style={{ color: fg, animationDelay: `${delay + i * 70}ms` }}>
          {ch}
        </Brick>
      ))}
    </div>
  )
}

export function MainMenu() {
  const { start, goSelect, save, toggleMute } = useGame()
  const bestCount = Object.keys(save.best).length
  return (
    <div className="absolute inset-0 flex items-stretch">
      <div className="panel-backdrop flex w-full max-w-[640px] flex-col justify-between px-8 py-9 md:px-14 md:py-12" style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 56px) 100%, 0 100%)' }}>
        <div>
          <div className="mb-8 flex flex-col gap-5 pt-3">
            <LetterRow letters={LETTERS} />
            <LetterRow letters={LETTERS2} delay={280} />
          </div>
          <Brick color={COLORS.yellow} className="inline-block px-5 py-2">
            <span className="ink-text text-2xl md:text-3xl">樂高積木闖關</span>
          </Brick>
          <p className="mt-6 max-w-md text-base font-bold leading-relaxed text-white/85">
            操控樂高小人，收集金幣、跳過縫隙、閃避機關，一路闖過三個積木世界。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <button className="btn btn-lg btn-yellow" onClick={() => start(1)} data-testid="start">開始遊戲</button>
            <button className="btn btn-lg btn-blue" onClick={() => { sfx.click(); goSelect() }} data-testid="select">選擇關卡</button>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 text-white">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-bold text-white/90">
            <span className="flex items-center gap-1.5"><Key>W</Key><Key>A</Key><Key>S</Key><Key>D</Key> / <Key>↑</Key><Key>←</Key><Key>↓</Key><Key>→</Key> 移動</span>
            <span className="flex items-center gap-1.5"><Key wide>Space</Key> 跳躍</span>
            <span className="flex items-center gap-1.5"><Key>Esc</Key> 暫停</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-white/60">
            <span>已通關 {bestCount} / 3</span>
            <button className="underline underline-offset-4 hover:text-white" onClick={toggleMute}>{save.muted ? '音效：關' : '音效：開'}（M）</button>
          </div>
        </div>
      </div>
    </div>
  )
}
