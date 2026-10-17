# TODO

## 已完成的既有功能

- [x] 樂高積木元件（帶凸點）、小人控制與 cannon-es 物理。
- [x] 五階學習筆記、20 張筆記磚、HUD、選單、遊戲結束與結算。
- [x] Web Audio 合成音效、各關 BGM、粒子效果與瀏覽器 smoke。

## 前一輪已完成

- [x] 第五關特色內容：原有 7×7 種子迷宮的藍色按鈕閘門之後，加入依迷宮路徑定位的潮汐漂流木移動障礙與檢查點；保留 4 張筆記磚、12 秒閘門倒數、120 秒總計時與可通關路線。
- [x] 行動裝置觸控操作：虛擬方向搖桿、可按住的跳躍鍵與暫停鍵；觸控沿用相對攝影機方向；pointer up/cancel、失焦、畫面隱藏、控制卸載與重新開局都會清除輸入，鍵盤操作仍可用。
- [x] README 同步五關玩法、第五關潮汐區與手機操作。

## 本次已完成

- [x] 新增第六關「星空之門」：浮空積木島、可移動軌道橋、六枚星之碎片開啟星門、兩個檢查點、無倒數及專屬結局畫面；五階筆記分類與 20 張筆記維持不變。
- [x] 新增第六關獨立合成 BGM 槽、星之碎片／星門／終章勝利音效；音樂設定新增獨立 SFX 音量滑桿與持久化，舊版缺少 `sfxVolume` 的偏好資料可相容載入。
- [x] 更新 README、AGENTS、曲庫文件、主選單、選關、HUD、音訊設定與結算文案；新增終章資料、通關、曲目相容與 smoke 覆蓋。

## GitHub Pages 部署

- [x] 新增 `.github/workflows/deploy-pages.yml`：在 `main` push 或手動觸發時，安裝鎖定依賴、執行 `pnpm build:local`，上傳 `dist/` 並透過官方 Pages Actions 部署。
- [x] README 記錄首次 Pages 設定及部署成功後的玩家網址；Vite `base: './'` 支援 repository Pages 子路徑。
- [ ] 將部署 workflow 與遊戲 commit 推送到 GitHub `origin/main`。目前可用連線回報 `viewerPermission: READ`，因此推送被權限阻擋。
- [ ] 由 repo 管理者於 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。Pages 尚未啟用；自動啟用需要額外管理授權，這裡沒有新增廣泛權限的 token。
- [ ] 等待 GitHub Actions 建置與部署成功，並在瀏覽器確認 [玩家網址](https://kuojunbin-eng.github.io/studrunner-ascend-life/) 可玩後，才標記上線完成。

## 驗證結果

- [x] `pnpm test`：7 個測試檔、58 項測試全部通過。
- [x] `pnpm build:local`：TypeScript 與 Vite production build 通過；Pages workflow 使用相同建置命令。
- [x] Chromium smoke：音樂設定中指派第六關 BGM、實際操作 SFX 音量滑桿、選取六關、第五關筆記流程，以及第六關收齊碎片／開門／結局均通過，無瀏覽器錯誤。
- [x] `git diff --check`：無 patch 空白錯誤。
- [x] 遊戲功能 commit `422731b` 與 Pages workflow／部署文件 commit `20d5b4b` 均已提交至本機 `main`。
