# 揚升人生：樂高積木五階闖關（Stud Runner）

五階學習筆記 × 3D 樂高闖關：一階「原點大道」、二階「心橋」、三階「五運群島」、四階「揚升之塔」、五階「合一迷宮」。每關集齊 4 張筆記磚才能打開終點，共 20 張，對應 20 個筆記分類；筆記內容在 `src/game/notes.ts`（四階為公開資訊概略整理，標示「待補充」，可改成自己的內容）。

用 React Three Fiber 打造的 3D 樂高風格第三人稱平台闖關遊戲。**所有可見物體（角色、地形、障礙、金幣、樹木、雲朵）都是程式碼動態生成的帶凸點（Studs）積木**，沒有任何外部模型或貼圖。

## 技術棧

| 用途 | 套件 |
| --- | --- |
| 前端 | React 19 + Vite + TypeScript |
| 3D | three.js + `@react-three/fiber` + `@react-three/drei` |
| 物理 | `cannon-es`（重力、盒/球碰撞、射線接地偵測、運動學平台） |
| UI | Tailwind CSS v4 + zustand |
| 音效 | Web Audio 即時合成（無音檔） |

## 指令

```bash
pnpm install
pnpm dev        # 開發伺服器
pnpm build      # 型別檢查 + 建置 + 體積預算
pnpm test       # 單元測試（規則、物理、五關機器人通關、繪製預算）
pnpm smoke      # 建置後的瀏覽器端到端測試（截圖輸出到 shots/）
```

網址加上 `?debug` 會在 `window.__studrunner` 暴露 `world`、`store`、`gl`，供自動化測試使用。

## 操作

`WASD` / 方向鍵移動（相對攝影機）、`Space` 跳躍（按住跳更高）、`Esc` 暫停、`R` 重來、`M` 靜音。

## 關卡

1. **樂高大道（新手教學）**：直線大道，收集 10 枚金幣打開終點閘門，閃避三道左右滑動的樂高牆，跳過缺口與矮牆。
2. **積木高塔（垂直跳躍）**：方形螺旋向上的浮空積木階梯，含左右移動的橘色平台與檢查點，登頂拿獎盃。
3. **樂高迷宮（終極挑戰）**：7×7 種子迷宮，包含旋轉橫桿、週期升降的紅色陷阱塊、限時 12 秒的藍色按鈕閘門，以及 100 秒總倒數。

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
| `src/game/levels/*.ts` | 五個關卡的資料與生成邏輯（迷宮為 DFS + BFS） |
| `src/game/tuning.ts` / `config.ts` | Tweak 參數管理器（保留開發期調校橋接） |
| `src/ui/*` | 開始選單、關卡選擇、HUD、暫停、遊戲結束、通關結算 |

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
