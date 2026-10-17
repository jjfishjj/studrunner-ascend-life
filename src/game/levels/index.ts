import type { LevelDef } from '../types'
import { STAGES } from '../notes'
import { buildLevel1 } from './level1'
import { buildLevel2 } from './level2'
import { buildLevel3 } from './level3'
import { buildLevel4 } from './level4'
import { buildLevel5 } from './level5'
import { buildLevel6 } from './level6'

export const LEVEL_BUILDERS: Array<() => LevelDef> = [buildLevel1, buildLevel2, buildLevel3, buildLevel4, buildLevel5, buildLevel6]
export const LEVEL_COUNT = LEVEL_BUILDERS.length

export function buildLevel(id: number): LevelDef {
  const b = LEVEL_BUILDERS[id - 1]
  if (!b) throw new Error(`未知的關卡 ${id}`)
  return b()
}

/** 選單用的可玩關卡摘要；前五關對應學習階段，第六關是獨立終章。 */
export const LEVEL_INFO = [
  ...STAGES.map(st => ({
    id: st.stage,
    stage: st.stage,
    label: st.label,
    name: st.levelName,
    subtitle: st.title,
    theme: st.theme,
    blurb: st.levelBlurb,
    environment: st.environment,
    arc: st.arc,
    reflection: st.reflection,
    color: st.color,
    ink: st.ink,
    tag: ['新手教學', '搭橋闖關', '升降浮橋', '垂直攀登', '限時挑戰'][st.stage - 1],
    hint: [
      '集齊 4 張筆記磚才能打開終點閘門；金幣越多，星星越多。',
      '搭上滑動平台、等紅色陷阱縮回去再通過、跳過旋轉橫桿，一路收集 4 張筆記磚。',
      '依序走過事業、財富、感情、家庭、身體五座島；浮橋會升降、滑動、旋轉與伸縮，抓準時機再跳。',
      '沿著螺旋跳上浮空積木，穿過星空向上揚升；集齊 4 張筆記磚，塔頂的終點才會亮起。',
      '到死路撿齊 4 張筆記磚，踩下藍色按鈕後 12 秒內衝過閘門；閘門後還有潮汐漂流木與檢查點！',
    ][st.stage - 1],
  })),
  {
    id: 6,
    stage: 6,
    label: '終章',
    name: '星空之門',
    subtitle: '五階之後的最終旅程',
    theme: '星之碎片 · 浮島跳躍 · 穿越星門',
    blurb: '沿著浮空星島前進，搭上緩慢移動的軌道橋，收集六枚星之碎片開啟星門。',
    environment: '星空浮島',
    arc: '穿越浮空島嶼與星門，為五階旅程收束。',
    reflection: '將旅程中的學習帶回日常生活。',
    color: '#28205C',
    ink: '#FFFFFF',
    tag: '最終結局',
    hint: '沿著浮空星島前進，搭上緩慢移動的軌道橋，收集 6 枚星之碎片開啟星門。終章沒有倒數，也不新增筆記分類。',
  },
]
