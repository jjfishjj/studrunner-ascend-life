import { LEVEL_COUNT, LEVEL_INFO } from '../game/levels'
import { formatTime } from '../game/rules'
import { sfx } from '../game/audio'
import { useGame } from '../game/store'
import { NOTES, noteFolder, notesOfStage } from '../game/notes'
import { Brick, COLORS, CoinIcon, Heart, NoteIcon, Stars } from './parts'

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
          <button className="btn btn-white" onClick={() => { sfx.click(); goSelect() }}>階段選擇</button>
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
        <p className="mt-3 text-center text-lg font-black text-white/90">{timeUp ? '時間到了，迷宮還沒走完！已撿到的筆記仍會保留。' : '生命用盡了，再挑戰一次吧！已撿到的筆記仍會保留。'}</p>
        <div className="mt-6 rounded-xl bg-black/20 px-5 py-2">
          <StatRow label="關卡" value={`${LEVEL_INFO[result.levelId - 1].label} · ${LEVEL_INFO[result.levelId - 1].name}`} />
          <StatRow icon={<NoteIcon size={22} />} label="筆記磚" value={`${result.notes} / ${result.notesTotal}`} />
          <StatRow icon={<CoinIcon size={22} />} label="金幣" value={`${result.coins}${result.coinsTotal ? ` / ${result.coinsTotal}` : ''}`} />
          <StatRow label="用時" value={formatTime(result.time)} />
        </div>
        <div className="mt-7 flex flex-col gap-4">
          <button className="btn btn-yellow" onClick={restart} data-testid="retry">再試一次</button>
          <div className="grid grid-cols-2 gap-4">
            <button className="btn btn-white" onClick={goSelect}>階段選擇</button>
            <button className="btn btn-white" onClick={goMenu}>主選單</button>
          </div>
        </div>
      </Brick>
    </Backdrop>
  )
}

export function Victory() {
  const { result, restart, goSelect, goMenu, next, openNotes, save } = useGame()
  if (!result) return null
  const last = result.levelId >= LEVEL_COUNT
  const info = LEVEL_INFO[result.levelId - 1]
  const mine = notesOfStage(result.levelId)
  const got = new Set(save.notes)
  return (
    <Backdrop>
      <Brick color={COLORS.green} className="animate-pop max-h-[94vh] w-full max-w-4xl overflow-y-auto p-7 md:p-8">
        <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <div className="lego-text text-center text-xs tracking-[.5em] text-white/75">{last ? 'ALL CLEAR' : 'STAGE CLEAR'}</div>
            <h2 className="lego-text mt-1 text-center text-5xl md:text-6xl" data-testid="victory-title">{last ? '揚升完成！' : '通關成功！'}</h2>
            <p className="mt-1 text-center text-base font-black text-white/90">{info.label} · {info.name}</p>
            <div className="mt-4 flex justify-center"><Stars n={result.stars} size={52} /></div>
            {result.newBest && <div className="mt-2 text-center"><span className="rounded-md bg-lyellow px-3 py-1 text-sm font-black text-[#1B2A34]">新紀錄！</span></div>}
            <div className="mt-5 rounded-xl bg-black/20 px-5 py-2">
              <StatRow label="通關時間" value={formatTime(result.time)} />
              <StatRow icon={<NoteIcon size={22} />} label="筆記磚" value={`${result.notes} / ${result.notesTotal}`} />
              <StatRow icon={<CoinIcon size={22} />} label="金幣" value={`${result.coins}${result.coinsTotal ? ` / ${result.coinsTotal}` : ''}`} />
              <StatRow icon={<Heart on />} label="剩餘生命" value={`${result.lives} / ${result.livesMax}`} />
              {result.best && <StatRow label="最佳時間" value={formatTime(result.best.time)} />}
            </div>
            {!result.ranked && <p className="mt-2 text-center text-xs font-bold text-white/70">已使用 Tweak 調整數值，本次成績不計入紀錄</p>}
          </div>
          <div>
            <div className="lego-text text-sm tracking-[.3em] text-white/80">本階筆記 · {mine.filter(n => got.has(n.id)).length}/{mine.length}</div>
            <div className="mt-2 flex flex-col gap-2.5" data-testid="victory-notes">
              {mine.map(n => (
                <div key={n.id} className="rounded-xl bg-white px-4 py-2.5 text-[#1B2A34]">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black">{noteFolder(n)}</span>
                    {n.draft && <span className="rounded bg-[#1B2A34]/10 px-1.5 py-0.5 text-[10px] font-black">待補充</span>}
                  </div>
                  <p className="mt-0.5 text-xs font-bold leading-relaxed text-[#1B2A34]/80">練習：{n.practice}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs font-bold text-white/75">{last ? `五階全部走完，共收集 ${save.notes.length} / ${NOTES.length} 張筆記。` : `已收集 ${save.notes.length} / ${NOTES.length} 張筆記。`}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {last
            ? <button className="btn btn-yellow" onClick={goSelect} data-testid="next">回到階段選擇</button>
            : <button className="btn btn-yellow" onClick={next} data-testid="next">下一階</button>}
          <button className="btn btn-white" onClick={() => openNotes('select')} data-testid="open-notes">學習筆記</button>
          <button className="btn btn-white" onClick={restart}>再玩一次</button>
          <button className="btn btn-white" onClick={last ? goMenu : goSelect}>{last ? '主選單' : '階段選擇'}</button>
        </div>
      </Brick>
    </Backdrop>
  )
}
