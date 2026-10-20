import { afterEach, describe, expect, it } from 'vitest'
import { ambienceSnapshot, setAmbience, stopAmbience } from '../src/game/audio'

afterEach(() => stopAmbience())

describe('自然音景混音狀態', () => {
  it('接受各地景混音並限制在 0 到 1 範圍', () => {
    setAmbience({ sea: 1.4, falls: 0.65, river: -0.2, cosmos: 0.25 })
    const mix = ambienceSnapshot()
    expect(mix.sea).toBe(1)
    expect(mix.falls).toBe(0.65)
    expect(mix.river).toBe(0)
    expect(mix.cosmos).toBe(0.25)
    expect(mix.jungle).toBe(0)
  })

  it('切換場景時未提供的類別會歸零，停止時所有類別歸零', () => {
    setAmbience({ jungle: 0.8, insects: 0.5 })
    setAmbience({ wind: 0.4 })
    expect(ambienceSnapshot().jungle).toBe(0)
    expect(ambienceSnapshot().insects).toBe(0)
    expect(ambienceSnapshot().wind).toBe(0.4)
    stopAmbience()
    expect(Object.values(ambienceSnapshot()).every(x => x === 0)).toBe(true)
  })
})
