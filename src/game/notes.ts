/**
 * 五階學習筆記分類（20 項）。
 * 所有文字集中在這個檔案，之後想改措辭、補充內容，只需要編輯這裡。
 * `draft: true` 表示該項目依公開心得概略整理、尚待補充，介面上會標示「待補充」。
 */
export interface NoteDef {
  /** 兩位數編號，同時是筆記資料夾前綴，例如 01 → 01_自我覺察 */
  id: string
  name: string
  stage: number
  /** 一句話重點 */
  summary: string
  /** 可以立刻做的小練習 */
  practice: string
  /** 筆記磚所在的情境地標，將抽象概念連結到場景 */
  landmark: string
  /** 抵達地標時的觀察提示 */
  encounter: string
  draft?: boolean
}

export interface StageDef {
  stage: number
  /** 一階、二階… */
  label: string
  title: string
  theme: string
  /** 介面主色（積木顏色）與其上的文字色 */
  color: string
  ink: string
  /** 關卡名稱與關卡玩法一句話 */
  levelName: string
  levelBlurb: string
  concept: string
  /** 關卡生態場域 */
  environment: string
  /** 由地景串起的四段學習旅程 */
  arc: string
  /** 開場時呈現的反思問題 */
  reflection: string
}

export const STAGES: StageDef[] = [
  {
    stage: 1, label: '一階', title: '自我與原生家庭', theme: '認識自己、感恩、種子法則、與父母／權威的關係',
    color: '#C91A09', ink: '#FFFFFF', levelName: '原點大道', levelBlurb: '筆直的起點大道：閃開左右滑動的樂高牆，集齊 4 張筆記磚打開終點閘門。',
    concept: '每日五感恩、種子定律、把外在遭遇視為內在行為的反映、透過感恩與和解調整心態。',
    environment: '森林源頭・家園樹徑',
    arc: '沿古樹根脈由觀心台走向感恩泉、種子苗圃與家園樹屋；每個地標各承接一張筆記磚。',
    reflection: '先看見自己，再看見一路承接的恩典；今天想種下什麼？',
  },
  {
    stage: 2, label: '二階', title: '情感與親密關係', theme: '愛情、伴侶關係、吸引力與關係經營',
    color: '#F2CD37', ink: '#1B2A34', levelName: '心橋', levelBlurb: '跨過一座座心形浮橋：搭上滑動平台、閃躲升起的陷阱、跳過旋轉橫桿。',
    concept: '十二條愛情黃金法則；已婚者練習讓彼此更好，單身者思考理想伴侶與自身狀態。',
    environment: '夕照海灣・雙心浮橋',
    arc: '穿越兩座隔水相望的心島：先練習關係法則與溝通，再辨認自己的擇偶狀態，最後照看關係種子。',
    reflection: '在靠近與留白之間，你想如何讓彼此都變得更好？',
  },
  {
    stage: 3, label: '三階', title: '親子與人生平衡', theme: '親子教養、陰陽平衡、提得起與放得下',
    color: '#0055BF', ink: '#FFFFFF', levelName: '五運群島', levelBlurb: '依序走過事業、財富、感情、家庭、身體五座島，在上下起伏的浮橋間保持平衡。',
    concept: '十二條親子關係黃金法則；身教大於言教；以寬恕、懺悔處理執著；平衡事業、財富、感情、家庭、身體。',
    environment: '五運河谷・親子花園',
    arc: '沿河走過事業、財富、感情、家庭、身體五島；橋的升降、滑動與伸縮，映照生活資源需要調度和平衡。',
    reflection: '孩子看見的日常行動，正是我們正在播下的種子。',
  },
  {
    stage: 4, label: '四階', title: '宇宙觀與更高層次能量', theme: '宇宙、命運、能量頻率、生命意義',
    color: '#F2F3F2', ink: '#1B2A34', levelName: '揚升之塔', levelBlurb: '踩著浮空積木螺旋向上，穿過星空，一路揚升到塔頂。',
    concept: '公開心得將四階定位為「講宇宙」，通常延伸探討命運、能量、頻率與更高層次的生命觀。',
    environment: '星瀑觀象台・揚升夜行',
    arc: '沿星瀑螺旋逐層擴大視野：從宇宙座標，走向可選擇的命運、與環境共振的狀態，最後抵達生命羅盤。',
    reflection: '把視野拉遠一些，哪些方向仍然可以由你選擇？',
  },
  {
    stage: 5, label: '五階', title: '合一與環境能量', theme: '與自然、環境、他人合一；身心與環境關係',
    color: '#237841', ink: '#FFFFFF', levelName: '合一迷宮', levelBlurb: '走進綠意迷宮：跳過旋轉橫桿、躲開陷阱，在限時內踩下按鈕衝過閘門。',
    concept: '戶外課程、感受自然訊息、環境整理對應內在清理；討論情緒與疾病的關聯，以及「不帶結果的溝通」。',
    environment: '合一三境・海灘／叢林／瀑布',
    arc: '迷宮由潮間海灘轉入濃密叢林，再抵達瀑布岩壁；收集筆記的支線讓整理環境、感受自然、聆聽身體與不帶結果溝通落在不同生態區。',
    reflection: '慢一點感受周遭：環境、情緒與身體正在告訴你什麼？',
  },
]

export const NOTES: NoteDef[] = [
  // ───── 一階：自我與原生家庭 ─────
  { id: '01', name: '自我覺察', stage: 1, summary: '認識自己：先看見自己的起心動念、習慣與情緒，是一切改變的起點。', practice: '每天留幾分鐘，寫下今天的情緒與反應，只觀察、不評判。', landmark: '古樹觀心台', encounter: '停下來觀察此刻的念頭與情緒，不急著替它們下評語。' },
  { id: '02', name: '感恩練習', stage: 1, summary: '每日五感恩：把注意力放在已經擁有的，心態會跟著轉變。', practice: '睡前寫下五件值得感恩的事，小事也算，連續做一週。', landmark: '感恩泉', encounter: '沿泉水回想日常中支持你的五件小事。' },
  { id: '03', name: '種子法則', stage: 1, summary: '種子定律：把外在遭遇視為內在行為的反映，今天的果來自過去的因。', practice: '遇到不順時先問自己：我曾種下什麼因？下一顆種子我想種什麼？', landmark: '種子苗圃', encounter: '選擇下一顆想種下的善意，並想像它會長成什麼。' },
  { id: '04', name: '父母與權威關係', stage: 1, summary: '透過感恩與和解，調整與父母、權威的關係，也就是調整自己的心態。', practice: '寫下父母（或某位權威）給過你的三件好事，再對一個心結說出和解的話。', landmark: '家園樹屋', encounter: '看見從家庭或重要師長承接的資源，也替未解的心結留一個和解入口。' },
  // ───── 二階：情感與親密關係 ─────
  { id: '05', name: '愛情黃金法則', stage: 2, summary: '十二條愛情黃金法則，是經營親密關係的基本功。', practice: '從十二條裡挑一條，今天就用在實際相處上。', landmark: '雙心沙洲', encounter: '辨認一段關係裡，哪些行動正在實踐你認同的相處原則。' },
  { id: '06', name: '伴侶溝通', stage: 2, summary: '已婚者的練習：讓彼此因為對方而變得更好。', practice: '每天對伴侶說一句具體的肯定，說出你看見的事實。', landmark: '候潮聽語台', encounter: '等浪退時先聽完對方，再用具體而溫和的話回應。' },
  { id: '07', name: '單身與擇偶', stage: 2, summary: '單身者的練習：思考理想的伴侶，也看看自己現在的狀態。', practice: '寫下理想伴侶的特質，再逐項問自己：我也具備這些嗎？', landmark: '兩岸擇偶燈塔', encounter: '看見你期待的特質，也誠實檢視自己目前所在的位置。' },
  { id: '08', name: '情感種子', stage: 2, summary: '吸引力與關係經營：你在關係裡種下什麼，關係就長出什麼。', practice: '回想一段關係，列出你曾種下的三顆種子，各是好是壞？', landmark: '潮間種子園', encounter: '回顧你為關係種下的行動，選一顆願意持續照料的種子。' },
  // ───── 三階：親子與人生平衡 ─────
  { id: '09', name: '親子黃金法則', stage: 3, summary: '十二條親子關係黃金法則，陪伴孩子也修正自己。', practice: '挑一條親子法則，這週刻意實踐，並記錄孩子的反應。', landmark: '親子共行林', encounter: '以陪伴取代催促，觀察孩子與自己如何一起學習。' },
  { id: '10', name: '身教與言教', stage: 3, summary: '身教大於言教：孩子看的是你怎麼做，不是你怎麼說。', practice: '選一個希望孩子養成的習慣，先讓自己穩定做到兩週。', landmark: '身教鏡面湖', encounter: '想培養的習慣先由自己做給孩子看。' },
  { id: '11', name: '寬恕與懺悔', stage: 3, summary: '提得起也放得下：以寬恕與懺悔處理心中的執著。', practice: '寫下一件放不下的事，對相關的人（或自己）說一句寬恕的話。', landmark: '寬恕瀑布', encounter: '辨認可以放下的執著；寬恕不等於否認傷害或放棄界線。' },
  { id: '12', name: '五運平衡', stage: 3, summary: '陰陽平衡：事業、財富、感情、家庭、身體，五個面向要一起照顧。', practice: '為五個面向各打 1～10 分，找出最低的一項，本週做一件小調整。', landmark: '五運平衡台', encounter: '檢視五個生活面向，找出一個可以先調整的支點。' },
  // ───── 四階：宇宙觀與更高層次能量（依公開心得概略整理，待補充）─────
  { id: '13', name: '宇宙觀', stage: 4, summary: '把視野拉大，從更大的整體來看待自己與世界。', practice: '找一個晴朗的夜晚抬頭看星空五分鐘，想想自己在整體中的位置。', landmark: '星圖觀象台', encounter: '抬頭觀看整片星圖，練習把個人問題放回更大的脈絡。', draft: true },
  { id: '14', name: '命運與能量', stage: 4, summary: '延伸探討命運與能量：哪些是既定的、哪些是自己能轉變的。', practice: '列出生活中「能改變」與「只能接受」的事，分開處理。', landmark: '命運星門', encounter: '區分自己能選擇的下一步，與需要接納的限制。', draft: true },
  { id: '15', name: '頻率與共振', stage: 4, summary: '延伸探討頻率與共振：我們的狀態會吸引相近狀態的人事物。', practice: '留意今天的情緒狀態，以及身邊出現了什麼樣的人與事。', landmark: '共振音叉台', encounter: '觀察情緒狀態如何影響注意力與互動，不把共振當成必然因果。', draft: true },
  { id: '16', name: '生命意義', stage: 4, summary: '更高層次的生命觀：我為什麼在這裡，又想留下什麼。', practice: '用一句話寫下現階段你最想活出的樣子。', landmark: '生命羅盤', encounter: '用一句話說出此刻想活出的方向，之後可以再修正。', draft: true },
  // ───── 五階：合一與環境能量 ─────
  { id: '17', name: '環境能量', stage: 5, summary: '環境整理對應內在清理：外在整齊，內心也跟著清爽。', practice: '整理一個一直拖著的角落（書桌、抽屜或包包），並留意心情變化。', landmark: '潮線整理灘', encounter: '整理眼前的一小塊空間，留意外在清爽時內在感受如何改變。' },
  { id: '18', name: '自然連結', stage: 5, summary: '走進戶外、感受自然傳來的訊息，與環境合一。', practice: '到戶外安靜走十分鐘，不看手機，只用五感感受周圍。', landmark: '五感林徑', encounter: '暫時放下手機，以視覺、聽覺、嗅覺、觸覺與呼吸感受自然。' },
  { id: '19', name: '情緒與身體', stage: 5, summary: '討論情緒與疾病的關聯，學著聽見身體的訊息（身心觀察，不取代醫療）。', practice: '情緒出現時，留意身體哪個部位有感覺，並寫下來。', landmark: '身心瀑布', encounter: '留意情緒在身體的感受；這是自我觀察，不取代專業醫療。' },
  { id: '20', name: '三型人格溝通', stage: 5, summary: '不帶結果的溝通：說出心意，但不預設對方一定要照做。', practice: '下一次表達前先問自己：我是在說明，還是在要求對方改變？', landmark: '不預設終點的岔路', encounter: '先說明自己的感受與需要，不把溝通變成要求對方照做。' },
]

export const NOTE_BY_ID: Record<string, NoteDef> = Object.fromEntries(NOTES.map(n => [n.id, n]))
export const noteFolder = (n: NoteDef) => `${n.id}_${n.name}`
export const notesOfStage = (stage: number) => NOTES.filter(n => n.stage === stage)
export const stageOf = (stage: number) => STAGES[stage - 1]

/** 把目前收集進度輸出成 Markdown，方便貼進自己的筆記軟體。 */
export function notesToMarkdown(collected: ReadonlySet<string>): string {
  const lines: string[] = ['# 揚升人生・五階學習筆記', '']
  for (const st of STAGES) {
    lines.push(`## ${st.label}：${st.title}`, `> ${st.theme}`, '')
    for (const n of notesOfStage(st.stage)) {
      const done = collected.has(n.id)
      lines.push(`- [${done ? 'x' : ' '}] ${noteFolder(n)}`)
      if (done) lines.push(`  - 地景：${n.landmark}`, `  - 重點：${n.summary}`, `  - 練習：${n.practice}`)
    }
    lines.push('')
  }
  lines.push('> 內容為學習整理，不構成醫療、心理或財務建議。')
  return lines.join('\n')
}
