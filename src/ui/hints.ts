const HINTS: Record<number, string> = {
  1: '收集 10 枚金幣即可打開終點閘門，留意左右滑動的樂高牆，並跳過路上的縫隙！',
  2: '從右前方的紅色積木起跳，沿著螺旋一路向上；插旗子的白色底座是檢查點。',
  3: '跳過旋轉橫桿、閃開紅色陷阱，踩下藍色按鈕後 12 秒內衝過閘門，全程限時 100 秒！',
}

export const buildLevelHint = (id: number) => HINTS[id] ?? ''
