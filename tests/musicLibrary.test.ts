import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const values = new Map<string, string>()
const localStorageMock = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, String(value)) },
  removeItem: (key: string) => { values.delete(key) },
  clear: () => values.clear(),
}

beforeEach(() => {
  vi.resetModules()
  values.clear()
  vi.stubGlobal('localStorage', localStorageMock)
})
afterEach(() => vi.unstubAllGlobals())

const stored = () => JSON.parse(values.get('studrunner.music.v1') ?? '{}') as Record<string, unknown>

describe('音樂與音效偏好', () => {
  it('讀取舊版音樂偏好時保留曲目與音樂音量，缺少 SFX 音量則採 100%', async () => {
    values.set('studrunner.music.v1', JSON.stringify({ assign: { '5': 'builtin-5' }, volume: 0.65 }))
    const { useMusic, MUSIC_SLOTS, BUILTIN_TRACKS, effectiveTrackId, choiceOf } = await import('../src/game/musicLibrary')
    const state = useMusic.getState()

    expect(state.assign).toEqual({ '5': 'builtin-5' })
    expect(state.volume).toBe(0.65)
    expect(state.sfxVolume).toBe(1)
    expect(MUSIC_SLOTS.at(-1)?.slot).toBe(6)
    expect(BUILTIN_TRACKS.at(-1)?.id).toBe('builtin-6')
    expect(effectiveTrackId(6)).toBe('builtin-6')
    expect(choiceOf('builtin-6')).toEqual({ type: 'synth', theme: 6 })
  })

  it('分別記住音樂與 SFX 音量，其他偏好寫入時不會遺失任一音量', async () => {
    const { useMusic } = await import('../src/game/musicLibrary')
    let state = useMusic.getState()
    state.setSfxVolume(0.4)
    state.setVolume(0.8)
    state.setAssign(6, 'builtin-6')
    await useMusic.getState().removeUpload('not-present')

    state = useMusic.getState()
    expect(state.volume).toBe(0.8)
    expect(state.sfxVolume).toBe(0.4)
    expect(stored()).toMatchObject({ volume: 0.8, sfxVolume: 0.4, assign: { '6': 'builtin-6' } })

    state.setSfxVolume(3)
    expect(useMusic.getState().sfxVolume).toBe(1.5)
    expect(useMusic.getState().volume).toBe(0.8)
    state.setSfxVolume(-1)
    expect(useMusic.getState().sfxVolume).toBe(0)

    useMusic.getState().resetAll()
    expect(stored()).toEqual({ assign: {}, volume: 1, sfxVolume: 1 })
  })
})
