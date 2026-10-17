# 開發計畫

## 已完成的前一輪

第五關已加入閘門後潮汐漂流木與檢查點；全遊戲已加入鍵盤／手機虛擬搖桿、按住跳躍與暫停控制。保留既有 20 張學習筆記與繁體中文、程式生成樂高積木風格。

## 本次目標與成果

延續既有資料驅動的 React Three Fiber／cannon-es 遊戲，不新增外部素材或套件。新增第六關「星空之門」作為最終結局：深靛星空、浮空積木島與程式生成星體；玩家沿固定路線收集六枚星之碎片，搭上安全的移動軌道橋、經過兩個檢查點，開啟星門抵達終點。終章無倒數、不新增學習筆記分類；原有五階、20 張筆記及存檔格式保持不變。結算畫面收束五階學習旅程並呈現星門結局。

擴充既有 Web Audio 架構：第六關有獨立合成 BGM 槽；星之碎片、星門開啟與終章勝利使用專屬音效；音樂設定提供獨立 SFX 音量滑桿，並持久化音樂與音效音量。舊版只存音樂音量的偏好資料，讀取時以預設 SFX 音量相容載入。

## 實作與驗收結果

1. 新增 `src/game/levels/level6.ts`：固定星島平台、六枚星之碎片（使用既有金幣引擎）、數量閘門、兩個安全檢查點、終點及機器人測試路線。
2. 在 `src/game/levels/index.ts` 註冊第六關，但不將它加入五階筆記 `STAGES`；更新主選單、選關卡、HUD、星門場景、勝利／失敗結算。
3. 在 `audio.ts` 加入第六關合成主題、星碎片／星門／終章音效及 SFX bus 音量 API；在 `musicLibrary.ts`、`MusicSettings.tsx` 加入第六槽、相容偏好儲存及獨立音量控制。
4. README、AGENTS 與公用曲庫說明已同步；增加音量偏好測試、六關資料與機器人通關測試、凸點效能預算，以及 Chromium smoke。
5. `pnpm test`（58 項）、`pnpm build:local`、Chromium smoke 與 `git diff --check` 均通過。
6. 已將前一輪與本次變更 commit 到本機 `main`。GitHub repo 預設分支也是 `main`，但目前連線的 `viewerPermission` 為 `READ`；嘗試推送時若被拒，保留 commit 並待授予 Write 權限後再推送。不建立 fork／PR，也不部署遊戲。

## 專案結構

- `src/game/levels/level6.ts`、`src/game/levels/index.ts`：星門地圖與六關註冊。
- `src/components/LevelScene.tsx`、`src/components/GameView.tsx`：星門視覺與關卡專屬音效事件。
- `src/game/audio.ts`、`src/game/musicLibrary.ts`、`src/ui/MusicSettings.tsx`：程式合成音訊、曲目槽、偏好儲存與音量控制。
- `src/ui/Hud.tsx`、`LevelSelect.tsx`、`MainMenu.tsx`、`Overlays.tsx`：第六關總數、終章選單與結局呈現。
- `tests/engine.test.ts`、`levels.test.ts`、`musicLibrary.test.ts`、`scripts/smoke.mjs`：通關、資料完整性、設定相容與瀏覽器流程。
- `README.md`、`AGENTS.md`、`public/music/README.md`：維護者文件。

## 依賴與限制

沿用 React、TypeScript、Vite、Three.js、cannon-es、zustand 和 Web Audio；不新增依賴。維持五階／20 張筆記、既有第 1–5 關資料與第五關迷宮種子。GitHub 只推送本專案已授權的程式碼變更；不發布遊戲部署。
