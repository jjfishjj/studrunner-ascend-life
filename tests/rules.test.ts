import { describe, expect, it } from 'vitest'
import { computeStars, formatTime, mergeBest, parseSave } from '../src/game/rules'

describe('rules', () => {
  it('formatTime', () => {
    expect(formatTime(0)).toBe('00:00.0')
    expect(formatTime(75.34)).toBe('01:15.3')
    expect(formatTime(-3)).toBe('00:00.0')
  })
  it('computeStars', () => {
    const base = { coins: 0, coinsTotal: 10, livesLeft: 1, livesMax: 3, time: 99, parTime: 45 }
    expect(computeStars(base)).toBe(1)
    expect(computeStars({ ...base, coins: 10 })).toBe(2)
    expect(computeStars({ ...base, coins: 10, livesLeft: 3, time: 30 })).toBe(3)
    expect(computeStars({ ...base, livesLeft: 3, time: 30 })).toBe(2)
  })
  it('parseSave 容錯', () => {
    expect(parseSave(null)).toEqual({ best: {}, muted: false })
    expect(parseSave('not json')).toEqual({ best: {}, muted: false })
    const s = parseSave(JSON.stringify({ muted: true, best: { 1: { time: 12, stars: 3, coins: 10 }, 2: { bad: 1 } } }))
    expect(s.muted).toBe(true)
    expect(Object.keys(s.best)).toEqual(['1'])
  })
  it('mergeBest 取較佳成績', () => {
    const a = { time: 40, stars: 2, coins: 10 }
    expect(mergeBest(undefined, a)).toEqual(a)
    expect(mergeBest(a, { time: 30, stars: 1, coins: 5 })).toEqual({ time: 30, stars: 2, coins: 10 })
    expect(mergeBest(a, { time: 50, stars: 3, coins: 10 }).stars).toBe(3)
  })
})
