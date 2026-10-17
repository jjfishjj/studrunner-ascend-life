import { useMemo, useState } from 'react'
import { LEVEL_INFO } from '../game/levels'
import { NOTES, STAGES, notesOfStage, noteFolder, notesToMarkdown, type NoteDef } from '../game/notes'
import { sfx } from '../game/audio'
import { useGame } from '../game/store'
import { Brick, NoteIcon } from './parts'

function Chip({ note, got, active, color, ink, onClick }: { note: NoteDef; got: boolean; active: boolean; color: string; ink: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid={`note-${note.id}`}
      data-got={got}
      className={`brick brick-studs w-full px-3 py-2 text-left transition-transform ${active ? '-translate-y-1.5 ring-4 ring-white/80' : 'hover:-translate-y-0.5'}`}
      style={{ ['--c' as string]: got ? color : '#5b6b7b', color: got ? ink : 'rgba(255,255,255,.65)' }}
    >
      <span className="block font-mono text-[11px] font-black opacity-80">{note.id}</span>
      <span className="block text-sm font-black leading-tight">{got ? note.name : '？？？'}</span>
    </button>
  )
}

export function Notebook() {
  const { save, notesFrom, goMenu, goSelect, start } = useGame()
  const got = useMemo(() => new Set(save.notes), [save.notes])
  const [sel, setSel] = useState<string>(save.notes[0] ?? '01')
  const [copied, setCopied] = useState(false)
  const note = NOTES.find(n => n.id === sel)!
  const stage = STAGES[note.stage - 1]
  const has = got.has(note.id)
  const back = () => { sfx.click(); (notesFrom === 'select' ? goSelect : goMenu)() }

  const copy = async () => {
    sfx.click()
    const text = notesToMarkdown(got)
    try { await navigator.clipboard.writeText(text) } catch {
      const ta = document.createElement('textarea')
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div className="panel-backdrop absolute inset-0 flex flex-col overflow-y-auto px-5 py-7 md:px-10 md:py-9" data-testid="notebook">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="lego-text text-xs tracking-[.4em] text-white/70">NOTEBOOK · 五階學習筆記</div>
          <h2 className="lego-text mt-1 text-4xl md:text-5xl">學習筆記 <span className="font-mono text-3xl text-lyellow" data-testid="notes-count">{save.notes.length}/{NOTES.length}</span></h2>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-yellow" onClick={copy} data-testid="copy-md">{copied ? '已複製！' : '複製成 Markdown'}</button>
          <button className="btn btn-white" onClick={back} data-testid="back">返回</button>
        </div>
      </div>

      <div className="mt-8 grid flex-1 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {STAGES.map(st => {
            const mine = notesOfStage(st.stage)
            const n = mine.filter(x => got.has(x.id)).length
            return (
              <div key={st.stage} className="grid grid-cols-[7.5rem_1fr] items-center gap-4 md:grid-cols-[9.5rem_1fr]">
                <Brick color={st.color} className="px-3 py-2" style={{ color: st.ink }}>
                  <div className="text-xs font-black opacity-80">{st.label} · {n}/4</div>
                  <div className="text-sm font-black leading-tight md:text-base">{st.title}</div>
                </Brick>
                <div className="grid grid-cols-2 gap-x-3 gap-y-5 pt-2 sm:grid-cols-4">
                  {mine.map(x => <Chip key={x.id} note={x} got={got.has(x.id)} active={sel === x.id} color={st.color} ink={st.ink} onClick={() => { sfx.click(); setSel(x.id) }} />)}
                </div>
              </div>
            )
          })}
        </div>

        <div className="lg:sticky lg:top-0 lg:self-start">
          <Brick color={has ? stage.color : '#5b6b7b'} className="p-6" style={{ color: has ? stage.ink : '#fff' }}>
            <div className="flex items-center justify-between text-xs font-black opacity-85">
              <span>{stage.label} · {stage.title}</span>
              {note.draft && has && <span className="rounded bg-black/30 px-2 py-0.5 text-white">待補充</span>}
            </div>
            {has ? (
              <div data-testid="note-detail">
                <h3 className="mt-3 flex items-center gap-2 text-3xl font-black"><NoteIcon size={32} />{noteFolder(note)}</h3>
                <div className="mt-5 rounded-xl bg-black/20 p-4 text-white">
                  <div className="text-xs font-black tracking-widest text-white/70">重點</div>
                  <p className="mt-1 text-base font-bold leading-relaxed">{note.summary}</p>
                </div>
                <div className="mt-4 rounded-xl bg-white p-4 text-[#1B2A34]">
                  <div className="text-xs font-black tracking-widest text-[#1B2A34]/60">小練習</div>
                  <p className="mt-1 text-base font-bold leading-relaxed">{note.practice}</p>
                </div>
                {note.draft && <p className="mt-3 text-xs font-bold opacity-80">這一階依公開心得概略整理，歡迎在 src/game/notes.ts 補上你自己的筆記內容。</p>}
              </div>
            ) : (
              <div data-testid="note-locked">
                <h3 className="mt-3 text-3xl font-black">{note.id}_？？？</h3>
                <p className="mt-4 text-base font-bold leading-relaxed text-white/90">
                  這張筆記磚還沒找到。到「{stage.label}・{LEVEL_INFO[note.stage - 1].name}」裡，找發著光柱的筆記磚吧！
                </p>
                <button className="btn btn-yellow mt-6" onClick={() => start(note.stage)}>前往 {stage.label}</button>
              </div>
            )}
          </Brick>
          <p className="mt-4 text-xs font-bold leading-relaxed text-white/60">
            筆記內容為學習整理，不構成醫療、心理或財務建議。資料存在這個瀏覽器裡，換裝置不會同步，記得用「複製成 Markdown」帶走。
          </p>
        </div>
      </div>
    </div>
  )
}
