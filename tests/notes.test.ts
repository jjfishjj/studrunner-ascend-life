import { describe, expect, it } from 'vitest'
import { NOTES, STAGES, notesOfStage, notesToMarkdown, noteFolder } from '../src/game/notes'

describe('五階學習筆記資料', () => {
  it('共 5 階、20 項，每階 4 項，編號連續', () => {
    expect(STAGES).toHaveLength(5)
    expect(NOTES).toHaveLength(20)
    NOTES.forEach((n, i) => expect(n.id).toBe(String(i + 1).padStart(2, '0')))
    for (const st of STAGES) expect(notesOfStage(st.stage)).toHaveLength(4)
  })
  it('資料夾名稱沿用「編號_名稱」格式', () => {
    expect(noteFolder(NOTES[0])).toBe('01_自我覺察')
    expect(noteFolder(NOTES[19])).toBe('20_三型人格溝通')
  })
  it('每項都有重點與練習；四階標示為待補充', () => {
    for (const n of NOTES) { expect(n.summary.length).toBeGreaterThan(8); expect(n.practice.length).toBeGreaterThan(8) }
    expect(NOTES.filter(n => n.draft).map(n => n.stage)).toEqual([4, 4, 4, 4])
  })
  it('Markdown 匯出：已收集者打勾並附上內容，未收集者不洩漏內容', () => {
    const md = notesToMarkdown(new Set(['01']))
    expect(md).toContain('- [x] 01_自我覺察')
    expect(md).toContain('- [ ] 02_感恩練習')
    expect(md).toContain('練習：')
    expect(md.match(/練習：/g)).toHaveLength(1)
  })
})
