import type { PlayerInput } from './engine'

const down = new Set<string>()
let jumpEdge = false

const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'])

function onKeyDown(e: KeyboardEvent) {
  if (MOVE_KEYS.has(e.code)) e.preventDefault()
  if (e.repeat) return
  if (e.code === 'Space') jumpEdge = true
  down.add(e.code)
}
function onKeyUp(e: KeyboardEvent) { down.delete(e.code) }
function clear() { down.clear(); jumpEdge = false }

let installed = false
export function installInput() {
  if (installed) return
  installed = true
  window.addEventListener('keydown', onKeyDown, { passive: false })
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', clear)
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear() })
}

/** 供自動化測試注入按鍵 */
export function pressKey(code: string, pressed: boolean) {
  if (pressed) { if (code === 'Space') jumpEdge = true; down.add(code) } else down.delete(code)
}

const any = (...codes: string[]) => codes.some(c => down.has(c))

/** 讀取一個模擬 tick 的輸入；jumpPressed 為邊緣觸發，每次按下只消費一次。 */
export function readInput(): PlayerInput {
  const moveX = (any('KeyD', 'ArrowRight') ? 1 : 0) - (any('KeyA', 'ArrowLeft') ? 1 : 0)
  const moveZ = (any('KeyW', 'ArrowUp') ? 1 : 0) - (any('KeyS', 'ArrowDown') ? 1 : 0)
  const jumpPressed = jumpEdge
  jumpEdge = false
  return { moveX, moveZ, jumpHeld: down.has('Space'), jumpPressed }
}

export function resetInput() { clear() }
