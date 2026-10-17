# AGENTS.md — 給接手開發的 AI／工程師

專案：**Stud Runner：揚升人生**（`studrunner`）——純前端、單機的 3D 樂高積木風格六關闖關遊戲。
前五個階段對應 20 張學習筆記磚（五階學習筆記分類），第六關是五階學習之後的「星空之門」最終結局，語言固定繁體中文。

## 快速開始

```bash
pnpm install
pnpm dev:local        # http://localhost:5173（不需要 Manus 環境）
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest：引擎、關卡、規則、筆記（含機器人自動通關測試）
pnpm build:local      # 型別檢查 + vite build → dist/
```

> `pnpm dev` / `pnpm build` / `pnpm smoke` 與 `scripts/manus-*` 是 Manus 平台的託管流程（資產還原、分享圖、預覽調校橋接），
> 在 Manus 之外請用 `dev:local` / `build:local`。`scripts/smoke.mjs` 需要 Chromium（`CHROME_PATH=/usr/bin/chromium`）與已 build 的 `dist/`。
> `?debug` 網址參數會暴露 `window.__studrunner`（store、world）供測試腳本傳送玩家、直接觸發關卡。`#admin` 直接進入音樂管理頁。

## 技術棧

React 19 + Vite + TypeScript · Three.js + `@react-three/fiber`/`drei`（只負責渲染）· **cannon-es**（直接使用，不經 worker）· Tailwind CSS v4 · zustand。
沒有後端、沒有外部圖片／模型，所有東西都是程式碼生成的積木（BoxGeometry + 圓柱凸點，用 InstancedMesh 批次繪製）。

## 架構（資料流：關卡資料 → 引擎模擬 → React 渲染）

| 路徑 | 職責 |
| --- | --- |
| `src/game/levels/level1..6.ts` | 純資料的關卡建構器 `buildLevel(id): LevelDef`：`statics`（有碰撞）、`decor`（純視覺）、movers、coins、notes、goal、gate、`nature`（動畫自然景物）；第六關為浮空積木島星空終章。 |
| `src/game/levels/maze.ts` | 迷宮生成（DFS）+ BFS 解路徑，五階使用。 |
| `src/game/levels/nature.ts` | 自然景物積木生成器（棕櫚、叢林樹、蕨、藤蔓、瀑布岩壁、彩虹、碼頭、沙堡…）與 `biomeAt(x,z)` 生態區判定（沙灘／叢林／瀑布區）。 |
| `src/game/engine.ts` | `GameWorld`：固定步長（1/60）的 cannon-es 物理 + 規則（生命、跳躍、移動平台、陷阱、檢查點、筆記磚、閘門倒數、終點）。**不依賴 React，可在 vitest 裡直接跑**。 |
| `src/game/store.ts` | zustand 全域狀態：畫面流程（menu/select/notes/music/playing/gameover/victory）、HUD、存檔（localStorage）。 |
| `src/game/audio.ts` | Web Audio 合成音效、內建合成背景曲、環境音（前五階的海浪／瀑布／鳥鳴依距離變化）；包含星碎片、星門與終章音效，也能播放使用者／曲庫的音檔。 |
| `src/game/musicLibrary.ts` | 音樂曲庫：內建曲目 + `public/music/manifest.json` 曲庫 + 瀏覽器上傳（IndexedDB）；每個欄位（0 選單、1~6 各關）可自選。 |
| `src/components/GameView.tsx` | R3F Canvas、模擬迴圈、第三人稱跟隨鏡頭、事件→粒子／音效／HUD；`ATTRACT` 為選單背景鏡頭。 |
| `src/components/LevelScene.tsx` / `Nature.tsx` / `BrickField.tsx` / `Minifigure.tsx` / `Particles.tsx` | 場景渲染、動態自然景物（瀑布、海浪、螃蟹、帆船、蝴蝶、鳥）、積木批次繪製、樂高小人、Brick Burst 粒子。 |
| `src/ui/*` | Tailwind UI：主選單、關卡選擇、HUD、暫停／結束／結算、學習筆記本、音訊設定；`TouchControls.tsx` 提供虛擬搖桿、按住跳躍與暫停，處理多指、取消及失焦清理。選關入口包含前五階學習與第六關終章。 |
| `tests/` | `engine.test.ts` 有「機器人」依關卡路徑自動通關的整合測試；`levels.test.ts` 含凸點數量預算（效能）。 |

### 五階學習與第六關終章

1. 原點大道（直線路線、滑動樂高牆）· 2. 心橋（滑動平台、旋轉橫桿、升降陷阱）· 3. 五運群島（升降浮橋）
4. 揚升之塔（垂直螺旋浮空階梯，宇宙場景）· 5. 合一迷宮（旋轉障礙、陷阱、限時閘門；海灘／叢林／瀑布三種生態區，閘門要踩按鈕）
每個原有階段有 4 張筆記磚（`src/game/notes.ts` 的 `STAGES` 定義五階、20 個分類），收集後可在筆記本檢視並複製成 Markdown；前五關的終點需收齊本關筆記才開啟。
6. 星空之門（五階學習後的最終結局）：穿越浮空積木島與可移動軌道橋，收集 6 枚星之碎片（沿用金幣引擎）開啟終點星門；有兩個檢查點、全關無倒數，不新增筆記分類，`notes` 維持空集合。

## 修改時的注意事項

- **新增／調整關卡**：只改 `levels/*.ts` 的資料；然後在 `tests/engine.test.ts` 補上機器人路徑，確保可通關。
- **效能預算**：地圖裝飾優先用 `studs: false` 與大塊合併；`tests/levels.test.ts` 限制凸點總數，超過會失敗。
- **牆頂/走道的裝飾僅視覺**（`collide: false`），不要放在會擋住玩家與鏡頭視線之間（五階鏡頭距離 5、高度 ~20）。
- 物理與渲染分離：位置以 `world.prevPos → world.player.position` 內插；不要在 React 元件內改物理狀態。
- 音訊需要使用者互動才會 `resume()`；試聽與 `<audio>` 檔案都經過同一個 Web Audio 混音器（`musicBus`）。
- 想讓所有玩家聽到自訂音樂：把檔案放進 `public/music/` 並編輯 `manifest.json`（見該資料夾 README）。瀏覽器上傳只存在該使用者的裝置。
- 設定參數集中在 `src/game/config.ts`（Manus「Tweak」預覽調校會讀寫 `tuning.ts`；在其他環境可忽略）。

## 已知限制／可延伸方向

- 存檔只在 localStorage（星等、最佳時間、已收集筆記、靜音，以及分開的音樂／SFX 音量）；舊版設定若缺少 `sfxVolume`，讀取時回退到既有預設值以保持相容。
- 管理者上傳音樂沒有伺服器端儲存；若要多人共享需加後端（物件儲存 + 簡單驗證）。
- 第五階場景繪製量較大（InstancedMesh 已批次化），低階裝置可考慮降低裝飾密度（`level5.ts` 的 `r2()` 機率）；第六關的星空裝飾也應維持效能預算。
