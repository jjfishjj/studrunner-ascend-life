import { LEVEL_COUNT, LEVEL_INFO } from '../game/levels'
import { formatTime } from '../game/rules'
import { sfx } from '../game/audio'
import { useGame } from '../game/store'
import { Brick, COLORS, CoinIcon, Heart, Stars } from './parts'

function Backdrop({ children }: { children: React.ReactNode }) {
  return <div className="panel-backdrop absolute inset-0 flex items-center justify-center px-4">{children}</div>
}

export function PauseMenu() {
  const { resume, restart, goSelect, goMenu, toggleMute, save } = useGame()
  return (
    <Backdrop>
      <Brick color={COLORS.blue} className="animate-pop w-full max-w-md p-8">
        <h2 className="lego-text text-center text-5xl">暫停</h2>
        <div className="mt-8 flex flex-col items-stretch gap-4">
          <button className="btn btn-yellow" onClick={resume} data-testid="resume">繼續遊戲</button>
          <button className="btn btn-green" onClick={restart} data-testid="restart">重新開始本關</button>
          <button className="btn btn-white" onClick={() => { sfx.click(); goSelect() }}>關卡選擇</button>
          <button className="btn btn-white" onClick={() => { sfx.click(); goMenu() }}>回主選單</button>
          <button className="btn" onClick={toggleMute}>{save.muted ? '音效：關閉' : '音效：開啟'}</button>
        </div>
      </Brick>
    </Backdrop>
  )
}

function StatRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-black/15 py-2.5 last:border-0">
      <span className="flex items-center gap-2 text-base font-black text-white/90">{icon}{label}</span>
      <span className="lego-text font-mono text-2xl tabular-nums">{value}</span>
    </div>
  )
}

export function GameOver() {
  const { result, restart, goSelect, goMenu } = useGame()
  if (!result) return null
  const timeUp = result.reason === 'time'
  return (
    <Backdrop>
      <Brick color={COLORS.red} className="animate-pop w-full max-w-lg p-8" >
        <div className="lego-text text-center text-xs tracking-[.5em] text-white/70">GAME OVER</div>
        <h2 className="lego-text mt-1 text-center text-6xl" data-testid="gameover-title">遊戲結束</h2>
        <p className="mt-3 text-center text-lg font-black text-white/90">{timeUp ? '時間到了，迷宮還沒走完！' : '生命用盡了，再挑戰一次吧！'}</p>
        <div className="mt-6 rounded-xl bg-black/20 px-5 py-2">
          <StatRow label="關卡" value={`第 ${result.levelId} 關`} />
          <StatRow icon={<CoinIcon size={22} />} label="金幣" value={`${result.coins}${result.coinsTotal ? ` / ${result.coinsTotal}` : ''}`} />
          <StatRow label="用時" value={formatTime(result.time)} />
        </div>
        <div className="mt-7 flex flex-col gap-4">
          <button className="btn btn-yellow" onClick={restart} data-testid="retry">再試一次</button>
          <div className="grid grid-cols-2 gap-4">
            <button className="btn btn-white" onClick={goSelect}>關卡選擇</button>
            <button className="btn btn-white" onClick={goMenu}>主選單</button>
          </div>
        </div>
      </Brick>
    </Backdrop>
  )
}

export function Victory() {
  const { result, restart, goSelect, goMenu, next } = useGame()
  if (!result) return null
  const last = result.levelId >= LEVEL_COUNT
  const info = LEVEL_INFO[result.levelId - 1]
  return (
    <Backdrop>
      <Brick color={COLORS.green} className="animate-pop w-full max-w-lg p-8">
        <div className="lego-text text-center text-xs tracking-[.5em] text-white/75">{last ? 'ALL CLEAR' : 'LEVEL CLEAR'}</div>
        <h2 className="lego-text mt-1 text-center text-6xl" data-testid="victory-title">{last ? '全破！' : '通關成功！'}</h2>
        <p className="mt-1 text-center text-base font-black text-white/90">第 {result.levelId} 關 · {info.name}</p>
        <div className="mt-4 flex justify-center"><Stars n={result.stars} size={56} /></div>
        {result.newBest && <div className="mt-2 text-center"><span className="rounded-md bg-lyellow px-3 py-1 text-sm font-black text-[#1B2A34]">新紀錄！</span></div>}
        <div className="mt-5 rounded-xl bg-black/20 px-5 py-2">
          <StatRow label="通關時間" value={formatTime(result.time)} />
          <StatRow icon={<CoinIcon size={22} />} label="金幣" value={`${result.coins}${result.coinsTotal ? ` / ${result.coinsTotal}` : ''}`} />
          <StatRow icon={<Heart on />} label="剩餘生命" value={`${result.lives} / ${result.livesMax}`} />
          {result.best && <StatRow label="最佳時間" value={formatTime(result.best.time)} />}
        </div>
        {!result.ranked && <p className="mt-2 text-center text-xs font-bold text-white/70">已使用 Tweak 調整數值，本次成績不計入紀錄</p>}
        <div className="mt-7 flex flex-col gap-4">
          {last
            ? <button className="btn btn-yellow" onClick={goSelect} data-testid="next">回到關卡選擇</button>
            : <button className="btn btn-yellow" onClick={next} data-testid="next">下一關</button>}
          <div className="grid grid-cols-2 gap-4">
            <button className="btn btn-white" onClick={restart}>再玩一次</button>
            <button className="btn btn-white" onClick={last ? goMenu : goSelect}>{last ? '主選單' : '關卡選擇'}</button>
          </div>
        </div>
      </Brick>
    </Backdrop>
  )
}
