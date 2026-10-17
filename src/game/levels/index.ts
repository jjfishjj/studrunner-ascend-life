import type { LevelDef } from '../types'
import { buildLevel1 } from './level1'
import { buildLevel2 } from './level2'
import { buildLevel3 } from './level3'

export const LEVEL_COUNT = 3
export const LEVEL_BUILDERS: Array<() => LevelDef> = [buildLevel1, buildLevel2, buildLevel3]

export function buildLevel(id: number): LevelDef {
  const b = LEVEL_BUILDERS[id - 1]
  if (!b) throw new Error(`未知的關卡 ${id}`)
  return b()
}

/** 選單用的關卡摘要（不需要建立完整地圖） */
export const LEVEL_INFO = [
  { id: 1, name: '樂高大道', subtitle: '新手教學', blurb: '直線大道，收集 10 枚金幣，閃避左右滑動的樂高牆。', color: '#237841', icon: '10 金幣' },
  { id: 2, name: '積木高塔', subtitle: '垂直跳躍', blurb: '踩著浮空積木螺旋向上，跨過縫隙，登上塔頂。', color: '#0055BF', icon: '垂直攀登' },
  { id: 3, name: '樂高迷宮', subtitle: '終極挑戰', blurb: '旋轉橫桿、陷阱塊、限時閘門與倒數計時。', color: '#C91A09', icon: '限時 100 秒' },
] as const
