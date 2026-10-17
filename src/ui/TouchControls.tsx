import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { resetTouchInput, setVirtualJump, setVirtualMove } from '../game/input'
import { useGame } from '../game/store'

type Stick = { x: number; y: number }

export function TouchControls() {
  const padRef = useRef<HTMLButtonElement>(null)
  const padPointer = useRef<number | null>(null)
  const jumpPointer = useRef<number | null>(null)
  const [stick, setStick] = useState<Stick>({ x: 0, y: 0 })
  const [jumpHeld, setJumpHeld] = useState(false)
  const pause = useGame(s => s.pause)

  useEffect(() => {
    const releaseAll = () => {
      padPointer.current = null
      jumpPointer.current = null
      setStick({ x: 0, y: 0 })
      setJumpHeld(false)
      resetTouchInput()
    }
    const onVisibilityChange = () => { if (document.hidden) releaseAll() }
    window.addEventListener('blur', releaseAll)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('blur', releaseAll)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      resetTouchInput()
    }
  }, [])

  const updateStick = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (padPointer.current !== event.pointerId || !padRef.current) return
    const rect = padRef.current.getBoundingClientRect()
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    const radius = rect.width * 0.34
    const distance = Math.hypot(dx, dy)
    const ratio = distance > 0 ? Math.min(1, distance / radius) : 0
    const visualRatio = ratio
    const deadZone = 0.12
    const moveRatio = ratio <= deadZone ? 0 : (ratio - deadZone) / (1 - deadZone)
    const nx = distance > 0 ? (dx / distance) * moveRatio : 0
    const ny = distance > 0 ? (dy / distance) * moveRatio : 0
    setStick({ x: distance > 0 ? (dx / distance) * radius * visualRatio : 0, y: distance > 0 ? (dy / distance) * radius * visualRatio : 0 })
    setVirtualMove(nx, -ny)
  }

  const beginStick = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (padPointer.current !== null || (event.pointerType === 'mouse' && event.button !== 0)) return
    event.preventDefault()
    padPointer.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    updateStick(event)
  }

  const endStick = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (padPointer.current !== event.pointerId) return
    padPointer.current = null
    setStick({ x: 0, y: 0 })
    setVirtualMove(0, 0)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const beginJump = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (jumpPointer.current !== null || (event.pointerType === 'mouse' && event.button !== 0)) return
    event.preventDefault()
    jumpPointer.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    setJumpHeld(true)
    setVirtualJump(true)
  }

  const endJump = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (jumpPointer.current !== event.pointerId) return
    jumpPointer.current = null
    setJumpHeld(false)
    setVirtualJump(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const pauseGame = () => {
    resetTouchInput()
    setStick({ x: 0, y: 0 })
    setJumpHeld(false)
    pause()
  }

  return (
    <div className="touch-controls absolute inset-0 z-30" role="group" aria-label="行動裝置遊戲操作">
      <button
        ref={padRef}
        type="button"
        className="touch-control touch-pad touch-pad-anchor pointer-events-auto absolute rounded-full border-2 border-white/60 bg-slate-950/35 shadow-lg"
        aria-label="虛擬方向搖桿，拖曳移動"
        onPointerDown={beginStick}
        onPointerMove={updateStick}
        onPointerUp={endStick}
        onPointerCancel={endStick}
        onLostPointerCapture={endStick}
      >
        <span className="pointer-events-none absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-white/70" />
        <span
          className="touch-pad-knob pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/70 bg-white/35 shadow"
          style={{ transform: `translate(calc(-50% + ${stick.x}px), calc(-50% + ${stick.y}px))` }}
          aria-hidden="true"
        >
          <span className="h-2 w-2 rounded-full bg-white/90" />
        </span>
      </button>

      <button
        type="button"
        className="touch-control touch-jump touch-jump-anchor pointer-events-auto absolute flex items-center justify-center rounded-full border-2 border-white/80 bg-[#C91A09]/85 font-black text-white shadow-lg active:scale-95 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="跳躍，按住可跳得更高"
        aria-keyshortcuts="Space"
        aria-pressed={jumpHeld}
        onPointerDown={beginJump}
        onPointerUp={endJump}
        onPointerCancel={endJump}
        onLostPointerCapture={endJump}
      >
        <span className="text-lg leading-tight">跳躍</span>
      </button>

      <button
        type="button"
        className="touch-control touch-pause touch-pause-anchor pointer-events-auto absolute flex items-center justify-center rounded-xl border border-white/60 bg-slate-950/55 px-3 font-black text-white shadow-lg focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="暫停遊戲"
        onClick={pauseGame}
      >
        暫停
      </button>
    </div>
  )
}
