import { beforeEach, describe, expect, it } from 'vitest'
import { pressKey, readInput, resetInput, resetTouchInput, setVirtualJump, setVirtualMove } from '../src/game/input'

beforeEach(() => resetInput())

describe('行動裝置觸控輸入', () => {
  it('虛擬搖桿會限制軸值並將上方映射為前進', () => {
    setVirtualMove(0.6, 1.4)
    expect(readInput()).toEqual({ moveX: 0.6, moveZ: 1, jumpHeld: false, jumpPressed: false })
  })

  it('觸控移動與鍵盤來源合併，且能抵銷相反方向', () => {
    pressKey('KeyD', true)
    setVirtualMove(-0.5, 0.4)
    expect(readInput()).toEqual({ moveX: 0.5, moveZ: 0.4, jumpHeld: false, jumpPressed: false })
  })

  it('跳躍按下只產生一次 edge，按住期間維持 jumpHeld，放開後清除', () => {
    setVirtualJump(true)
    expect(readInput()).toMatchObject({ jumpHeld: true, jumpPressed: true })
    expect(readInput()).toMatchObject({ jumpHeld: true, jumpPressed: false })
    setVirtualJump(false)
    expect(readInput()).toMatchObject({ jumpHeld: false, jumpPressed: false })
  })

  it('觸控元件卸載只清除觸控來源，不會取消鍵盤按鍵', () => {
    pressKey('KeyD', true)
    setVirtualMove(0.7, -0.8)
    setVirtualJump(true)
    resetTouchInput()
    expect(readInput()).toEqual({ moveX: 1, moveZ: 0, jumpHeld: false, jumpPressed: false })
  })

  it('重設輸入會清除搖桿與跳躍按住狀態', () => {
    setVirtualMove(1, -1)
    setVirtualJump(true)
    resetInput()
    expect(readInput()).toEqual({ moveX: 0, moveZ: 0, jumpHeld: false, jumpPressed: false })
  })
})
