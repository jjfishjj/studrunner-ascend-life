import { useEffect } from 'react'
import { musicDuck, musicPlay, stopAmbience } from './game/audio'
import { GameView } from './components/GameView'
import { installInput } from './game/input'
import { useGame } from './game/store'
import { Hud } from './ui/Hud'
import { LevelSelect } from './ui/LevelSelect'
import { MainMenu } from './ui/MainMenu'
import { Notebook } from './ui/Notebook'
import { MusicSettings } from './ui/MusicSettings'
import { useMusic } from './game/musicLibrary'
import { SpeakerButton } from './ui/parts'
import { GameOver, PauseMenu, Victory } from './ui/Overlays'
import { TouchControls } from './ui/TouchControls'

export default function App() {
  const screen = useGame(s => s.screen)
  const paused = useGame(s => s.paused)
  const runId = useGame(s => s.runId)

  const levelId = useGame(s => s.levelId)
  // 載入曲庫與上傳過的音樂；網址帶 #admin（或 ?admin）直接進入音樂管理頁
  useEffect(() => {
    void useMusic.getState().init()
    if (location.hash === '#admin' || new URLSearchParams(location.search).has('admin')) useGame.getState().openMusic('menu')
  }, [])
  // 背景音樂：選單 / 筆記本 = 主題曲，遊玩中 = 該階的曲子，結算畫面安靜（讓過關音效聽得到）
  useEffect(() => {
    if (screen === 'playing') musicPlay(levelId)
    else if (screen === 'gameover' || screen === 'victory') { musicPlay(null); stopAmbience() }
    else { musicPlay(0); stopAmbience() }
  }, [screen, levelId])
  useEffect(() => { musicDuck(screen === 'playing' && paused) }, [screen, paused])
  useEffect(() => {
    const uninstallInput = installInput()
    const onKey = (e: KeyboardEvent) => {
      const s = useGame.getState()
      if (e.code === 'KeyM') { s.toggleMute(); return }
      if (s.screen === 'playing') {
        if (e.code === 'Escape' || e.code === 'KeyP') { s.paused ? s.resume() : s.pause(); return }
        if (e.code === 'KeyR' && !e.repeat) { s.restart(); return }
        if (e.code === 'Enter' && s.paused) s.resume()
      } else if (e.code === 'Enter' && !e.repeat) {
        const el = document.activeElement
        if (el instanceof HTMLButtonElement) return
        if (s.screen === 'menu') s.start(1)
        else if (s.screen === 'gameover') s.restart()
        else if (s.screen === 'victory') s.next()
      } else if (e.code === 'Escape') {
        if (s.screen === 'select') s.goMenu()
        else if (s.screen === 'notes') (s.notesFrom === 'select' ? s.goSelect : s.goMenu)()
        else if (s.screen === 'music') (s.musicFrom === 'select' ? s.goSelect : s.goMenu)()
      }
    }
    const onHide = () => { if (document.hidden) useGame.getState().pause() }
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onHide)
    return () => { uninstallInput(); window.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onHide) }
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-plate">
      <GameView />
      {screen === 'menu' && <MainMenu />}
      {screen === 'select' && <LevelSelect />}
      {screen === 'notes' && <Notebook />}
      {screen === 'music' && <MusicSettings />}
      {(screen === 'playing' || screen === 'gameover' || screen === 'victory') && <Hud />}
      {screen === 'playing' && !paused && <TouchControls key={runId} />}
      {screen === 'playing' && paused && <PauseMenu />}
      {screen === 'gameover' && <GameOver />}
      {screen === 'victory' && <Victory />}
      {screen !== 'playing' && <SpeakerButton />}
    </div>
  )
}
