# 開發與部署計畫

## 功能完成

沿用資料驅動的 React Three Fiber／cannon-es 遊戲，保留行動裝置虛擬搖桿、按住跳躍、暫停操作與第五關潮汐障礙。新增第六關「星空之門」作為最終結局：深靛星空、浮空積木島、程式生成星體、可移動軌道橋及六枚星之碎片；路線設有兩個檢查點，收集碎片後開啟終點星門。終章無倒數、不新增學習筆記分類，既有五階、20 張筆記維持不變。

擴充 Web Audio：新增終章合成 BGM、星之碎片／星門／終章勝利音效及獨立 SFX 音量設定；保留森林、溪流、海浪、瀑布、叢林、山風等上游環境音，並為終章加入宇宙與夜色環境音區。舊版音量偏好可相容讀取。

## 最新上游整合

使用者要求部署在 `jjfishjj` 自己的 GitHub。已從公開上游 `kuojunbin-eng/studrunner-ascend-life` 建立公開 fork `jjfishjj/studrunner-ascend-life`，沒有修改上游。fork 包含較本機 clone 更新的上游 commit `29f324d`；本機遊戲及 Pages 兩個 commit 已重放至此最新版本之上。整合期間保留上游新增的自然場景、音景、首頁預覽及專案維護變更。

## GitHub Pages 部署

專案為 Vite 靜態 SPA；相對資產路徑 `base: './'` 支援 repository Pages 子路徑。`.github/workflows/deploy-pages.yml` 在 `main` push 或手動執行時，使用鎖定依賴與 `pnpm build:local` 建置 `dist/`，再透過 `actions/upload-pages-artifact` 與 `actions/deploy-pages` 發布；部署 job 採最小的 `pages: write`、`id-token: write` 權限及 `github-pages` environment。

部署目標為 `jjfishjj/studrunner-ascend-life`，預期玩家網址為 [https://jjfishjj.github.io/studrunner-ascend-life/](https://jjfishjj.github.io/studrunner-ascend-life/)。首次發布需在 fork 的 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**；完成 push 與 Pages source 設定後，等待 Actions 成功並在瀏覽器確認站點載入，才標記正式上線。

## 驗證與檔案

最新 upstream 整合後，`pnpm test` 8 個測試檔、67 項全部通過；`pnpm build:local` 通過；Chromium smoke 覆蓋選單、六關環境混音、第五星筆記、遊戲結束、兩種勝利流程、終章星門與筆記本，無 console errors；`git diff --check` 通過。

主要新增／更新：

- `.github/workflows/deploy-pages.yml`、`README.md`：Pages workflow 與玩家入口說明。
- `src/game/levels/level6.ts`、`src/game/levels/index.ts`：終章資料、星空音景與六關註冊。
- `src/game/audio.ts`、`src/game/musicLibrary.ts`、`src/ui/MusicSettings.tsx`：合成音訊與音量偏好。
- `src/ui/TouchControls.tsx`、`src/game/input.ts`：手機觸控輸入及生命週期清理。
- `src/components/LevelScene.tsx`、`src/components/GameView.tsx`、`src/ui/*`：終章場景、事件音效、選單、HUD 與結局。
- `tests/*`、`scripts/smoke.mjs`：關卡、輸入、偏好相容與瀏覽器流程測試。

## 官方參考

- [GitHub Pages 自訂 workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [configure-pages action](https://github.com/actions/configure-pages)
- [upload-pages-artifact action](https://github.com/actions/upload-pages-artifact)
- [deploy-pages action](https://github.com/actions/deploy-pages)
