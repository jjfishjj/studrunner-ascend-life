import type { PlayerInput } from './engine'

const down = new Set<string>()
let jumpEdge = false
let touchJumpHeld = false
let touchJumpEdge = false
let touchMoveX = 0
let touchMoveZ = 0

const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'])
const clampUnit = (v: number) => Math.max(-1, Math.min(1, Number.isFinite(v) ? v : 0))

function onKeyDown(e: KeyboardEvent) {
  if (MOVE_KEYS.has(e.code)) e.preventDefault()
  if (e.repeat) return
  if (e.code === 'Space') jumpEdge = true
  down.add(e.code)
}
function onKeyUp(e: KeyboardEvent) { down.delete(e.code) }
function onVisibilityChange() { if (document.hidden) clear() }
function clear() {
  down.clear()
  jumpEdge = false
  touchJumpHeld = false
  touchJumpEdge = false
  touchMoveX = 0
  touchMoveZ = 0
}

let installed = false
export function installInput(): () => void {
  if (installed) return () => undefined
  installed = true
  window.addEventListener('keydown', onKeyDown, { passive: false })
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', clear)
  window.addEventListener('pagehide', clear)
  document.addEventListener('visibilitychange', onVisibilityChange)
  return () => {
    if (!installed) return
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', clear)
    window.removeEventListener('pagehide', clear)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    clear()
    installed = false
  }
}

/** 設定相對攝影機方向的虛擬搖桿輸入。 */
export function setVirtualMove(x: number, z: number) {
  touchMoveX = clampUnit(x)
  touchMoveZ = clampUnit(z)
}

/** 觸控跳躍需保留按住狀態，並只在按下邊緣觸發一次跳躍緩衝。 */
export function setVirtualJump(held: boolean) {
  if (held && !touchJumpHeld) touchJumpEdge = true
  touchJumpHeld = held
}

/** 觸控元件卸載時只清掉觸控來源，不干擾仍按住的鍵盤來源。 */
export function resetTouchInput() {
  touchMoveX = 0
  touchMoveZ = 0
  touchJumpHeld = false
  touchJumpEdge = false
}

/** 供自動化測試注入按鍵 */
export function pressKey(code: string, pressed: boolean) {
  if (pressed) { if (code === 'Space' && !down.has(code)) jumpEdge = true; down.add(code) } else down.delete(code)
}

const any = (...codes: string[]) => codes.some(c => down.has(c))

/** 讀取一個模擬 tick 的輸入；jumpPressed 為邊緣觸發，每次按下只消費一次。 */
export function readInput(): PlayerInput {
  const keyX = (any('KeyD', 'ArrowRight') ? 1 : 0) - (any('KeyA', 'ArrowLeft') ? 1 : 0)
  const keyZ = (any('KeyW', 'ArrowUp') ? 1 : 0) - (any('KeyS', 'ArrowDown') ? 1 : 0)
  const moveX = clampUnit(keyX + touchMoveX)
  const moveZ = clampUnit(keyZ + touchMoveZ)
  const jumpPressed = jumpEdge || touchJumpEdge
  jumpEdge = false
  touchJumpEdge = false
  return { moveX, moveZ, jumpHeld: down.has('Space') || touchJumpHeld, jumpPressed }
}

export function resetInput() { clear() }
