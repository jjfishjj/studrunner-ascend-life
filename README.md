# 揚升人生：樂高積木六關闖關（Stud Runner）

五階學習筆記 × 六關 3D 樂高闖關：一階「原點大道」、二階「心橋」、三階「五運群島」、四階「揚升之塔」、五階「合一迷宮」。前五關每關有 4 張筆記磚，共 20 張，對應 20 個筆記分類；收齊本關筆記才能通過終點。第五關另需踩藍色按鈕開啟限時閘門。第六關「星空之門」是完成五階學習後的最終結局關卡：在浮空積木島間前進、搭上可移動軌道橋，收集六枚星之碎片（沿用金幣引擎）開啟終點星門；設有兩個檢查點、全關無倒數，也不新增筆記分類。`STAGES`／學習筆記仍維持五階、20 張，每個原有關卡各 4 張。筆記內容在 `src/game/notes.ts`（四階為公開資訊概略整理，標示「待補充」，可改成自己的內容）。

用 React Three Fiber 打造的 3D 樂高風格第三人稱平台闖關遊戲。**所有可見物體（角色、地形、障礙、金幣、樹木、雲朵）都是程式碼動態生成的帶凸點（Studs）積木**，沒有任何外部模型或貼圖。

## 技術棧

| 用途 | 套件 |
| --- | --- |
| 前端 | React 19 + Vite + TypeScript |
| 3D | three.js + `@react-three/fiber` + `@react-three/drei` |
| 物理 | `cannon-es`（重力、盒/球碰撞、射線接地偵測、運動學平台） |
| UI | Tailwind CSS v4 + zustand |
| 音效 | Web Audio 即時合成（無音檔；SFX、0~6 BGM 與環境音） |

## 指令

```bash
pnpm install
pnpm dev:local  # 本機開發伺服器
pnpm build:local # 型別檢查 + Vite production 建置
pnpm test       # 單元測試（規則、物理、關卡機器人通關、繪製預算）
pnpm smoke      # 建置後的瀏覽器端到端測試（需 Chromium；截圖輸出到 shots/）
```

## GitHub Pages 部署

`.github/workflows/deploy-pages.yml` 會在推送至 `main` 或手動執行 workflow 時，以 `pnpm build:local` 建置 `dist/`，再發布到 GitHub Pages。Vite 使用相對資產路徑，支援 repository Pages 子路徑。

首次部署前，repo 管理者需在 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。workflow 成功後，玩家網址為 [https://jjfishjj.github.io/studrunner-ascend-life/](https://jjfishjj.github.io/studrunner-ascend-life/)。

網址加上 `?debug` 會在 `window.__studrunner` 暴露 `world`、`store`、`gl`，供自動化測試使用。

## 使用者入口

從主選單的「開始旅程」或「選擇階段」進入關卡；階段選擇依序呈現五階學習關卡，最後接上第六關「星空之門」終章。主選單與階段選擇都可開啟「學習筆記」和「音樂／音效設定」；學習筆記仍只統計五階的 20 張筆記磚，音訊設定則可分別配置主選單／筆記本與一至六關的曲目及音量。網址加上 `#admin`（或 `?admin`）可直接進入音樂管理頁。

## 操作

桌面使用 `WASD` / 方向鍵移動（相對攝影機）、`Space` 跳躍（按住跳更高）、`Esc` 暫停、`R` 重來、`M` 靜音。手機遊玩時用左下虛擬搖桿移動、右下「跳躍」鍵跳躍（按住跳更高），並可點選畫面上的「暫停」鍵。

## 音效與音樂

- 既有跳躍、受傷、金幣、筆記磚、檢查點、閘門等音效，以及各階循環 BGM，全部由 `src/game/audio.ts` 以 Web Audio 即時合成，不依賴外部音檔；瀏覽器會在第一次使用者互動後解鎖音訊。
- 內建 BGM 槽位為 `0`（主選單／筆記本）、`1`～`5`（五階學習關卡）與 `6`（星空之門終章）；`public/music/manifest.json` 可用曲庫音檔覆寫對應槽位，瀏覽器上傳的曲目仍只存在該使用者裝置。
- 音樂音量與 SFX 音量分開持久化。讀取舊版設定時若缺少 `sfxVolume`，會回退到既有預設 SFX 音量，不會使其他設定失效。
- 第六關新增星之碎片收集、星門開啟／受阻，以及終章抵達終點的專用音效；六枚星之碎片只沿用金幣收集引擎，不會變成新的筆記分類。

## 關卡

1. **原點大道（新手教學）**：直線跑道上有三道左右滑動的樂高牆、缺口與矮牆。收齊 4 張筆記磚會打開終點閘門；10 枚金幣是星等挑戰，不是開門條件。
2. **心橋（情感與親密關係）**：從小浮板走上左右滑動的平台，穿越週期升起的紅色陷阱走廊，再跳過旋轉橫桿抵達愛心終點島；收齊 4 張筆記磚才能通過終點。
3. **五運群島（人生平衡）**：依序走過事業、財富、感情、家庭、身體五座島，跨越上下升降、左右滑動、旋轉橫桿與前後伸縮的浮橋；全程設有三個檢查點，收齊 4 張筆記磚才能通過終點。
4. **揚升之塔（垂直攀登）**：沿夜空中的方形螺旋跳上 30 層浮空積木，搭乘移動平台並利用三個檢查點，收齊 4 張筆記磚後抵達塔頂。
5. **合一迷宮（終極挑戰）**：以固定種子生成的 7×7 迷宮；四張筆記磚藏在主路旁的死路。跳過旋轉橫桿、躲避週期升起的紅色陷阱，踩下藍色按鈕後須在 12 秒內通過閘門；閘門後新增潮汐漂流木節拍區與檢查點。全關倒數 120 秒，終點仍須收齊 4 張筆記磚。
6. **星空之門（五階後的最終結局）**：在浮空積木島間前進，搭上可移動的星際軌道橋，依序收集 6 枚星之碎片（使用金幣引擎）以開啟終點星門。路線有兩個檢查點，全關無倒數；本關沒有筆記磚，完成終點不改變五階、20 張的學習筆記結構。

## 程式結構

| 路徑 | 說明 |
| --- | --- |
| `src/components/LegoBrick.tsx` | 單塊積木：BoxGeometry 主體 + InstancedMesh 圓柱凸點 |
| `src/components/BrickField.tsx` | 大量靜態積木批次繪製（2 個 InstancedMesh） |
| `src/components/Minifigure.tsx` | 樂高小人與跑/跳/受傷/慶祝動畫 |
| `src/components/Particles.tsx` | 磚塊爆裂粒子（Brick Burst Particles） |
| `src/components/LevelScene.tsx` | 機關、閘門、金幣、檢查點、按鈕、終點 |
| `src/components/GameView.tsx` | Canvas、固定 60Hz 模擬、攝影機、事件→特效/音效/UI |
| `src/game/engine.ts` | 與渲染無關的物理與規則核心（可在 Node 測試） |
| `src/game/levels/*.ts` | 六個關卡的資料與生成邏輯（前五階含筆記，終章為星空之門；迷宮為 DFS + BFS） |
| `src/game/tuning.ts` / `config.ts` | Tweak 參數管理器（保留開發期調校橋接） |
| `src/ui/*` | 開始選單、關卡選擇、HUD、暫停、遊戲結束、通關結算 |
| `src/ui/TouchControls.tsx` | 手機虛擬搖桿、按住跳躍、暫停與觸控生命週期管理 |
| `src/game/audio.ts` / `musicLibrary.ts` | Web Audio 合成 SFX、各階 BGM、星碎片／星門／終章音效，以及 0~6 曲目槽管理 |

## Preview Tweak

`src/game/tuning.ts` is this game's parameter manager. The Addon panel reads its
catalog; `config.ts` owns source defaults and the active configuration used by gameplay.
When adapting the game, keep only controls with actual gameplay consumers, and preserve
stable IDs for unchanged parameters. Define ranges, units and the correct activation
boundary. Register through `scripts/manus-tuning/adapter.js` only under `import.meta.env.DEV`.
Keep the Vite plugin and `scripts/__manus__/` helpers intact; production builds exclude
the browser adapter and never inject the bridge.

Apply changes preview state only. `LIVE` parameters are read in the next game update;
`NEXT_ACTION` parameters activate at the relevant jump/dash start; `NEXT_RUN` parameters
activate in `Game.start`. Model/collider size and gravity are not exposed by this version.
Do not mutate the source defaults or persist Apply to localStorage. Save with Manus
checks the snapshot against the current catalog and edits `DEFAULT_CONFIG`, then uses
the normal Three.js Web build/checkpoint workflow. Keep existing gameplay parameter
managers when extending an older project; do not create a competing store.

For server-authoritative multiplayer, expose local cosmetic controls only until gameplay
parameters have explicit server-side development support. The descriptor's GAMEPLAY flag
is a classification, not server authorization or ranked-score enforcement.

The preview plugin reads the ignored `.manus-webdev/preview-identity.json` v1 projection
written by the Runtime when initializing, attaching or restoring this project. It contains
only the resource ID and canonical project directory; private Host bindings and starter
receipts are not template dependencies. Missing identity disables the bridge.
The manager latches `tuning.unranked` when non-default GAMEPLAY values become active and
resets it only at the next run using that run's active values. `Game` snapshots this onto
`RunState.unranked`; local results cannot save such runs. Preserve this guard when changing
scoring. When adding online leaderboards, skip submissions for unranked runs and enforce
eligibility in the authoritative server too; client flags are not proof of a fair score.

## 給接手開發者

請先讀 [AGENTS.md](./AGENTS.md)（架構、指令、注意事項）。在 Manus 以外的環境請用 `pnpm dev:local` 與 `pnpm build:local`。
