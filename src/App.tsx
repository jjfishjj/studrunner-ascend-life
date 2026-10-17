import { useEffect } from 'react'
import { GameView } from './components/GameView'
import { installInput } from './game/input'
import { useGame } from './game/store'
import { Hud } from './ui/Hud'
import { LevelSelect } from './ui/LevelSelect'
import { MainMenu } from './ui/MainMenu'
import { GameOver, PauseMenu, Victory } from './ui/Overlays'

export default function App() {
  const screen = useGame(s => s.screen)
  const paused = useGame(s => s.paused)

  useEffect(() => {
    installInput()
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
      }
    }
    const onHide = () => { if (document.hidden) useGame.getState().pause() }
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onHide)
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onHide) }
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-plate">
      <GameView />
      {screen === 'menu' && <MainMenu />}
      {screen === 'select' && <LevelSelect />}
      {(screen === 'playing' || screen === 'gameover' || screen === 'victory') && <Hud />}
      {screen === 'playing' && paused && <PauseMenu />}
      {screen === 'gameover' && <GameOver />}
      {screen === 'victory' && <Victory />}
    </div>
  )
}
