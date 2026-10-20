# TODO

## 已完成

- [x] 樂高積木角色、cannon-es 物理、鍵盤操作、HUD、筆記本及五階 20 張學習筆記。
- [x] Web Audio 合成音效、五階 BGM 與依場景區域混音的自然音景。
- [x] 第五關限時閘門後的潮汐漂流木障礙與檢查點。
- [x] 行動裝置虛擬搖桿、按住跳躍及暫停控制；清理 pointer、失焦、背景切換、重新開局等輸入狀態。
- [x] 第六關「星空之門」：浮空積木島、移動軌道橋、六枚星之碎片、兩個檢查點、宇宙／夜色音景、專屬結局及 BGM；不新增筆記分類。
- [x] 獨立 SFX 音量偏好、舊版設定相容與選單／關卡／結局整合。
- [x] 基於最新 upstream `29f324d` 整合自然場景及沉浸音景更新，並建立公開 fork `jjfishjj/studrunner-ascend-life`；未修改原始上游 repo。
- [x] GitHub Actions Pages workflow 已提交至 fork 的 `main`，Pages source 已設為 GitHub Actions。
- [x] Actions 第一次執行發生在 Pages source 啟用前而未成功；設定完成後重新執行，build 與 deploy 均成功。
- [x] 已在瀏覽器開啟玩家網址並確認首頁、六關選擇及星空終章內容可正常載入。

## 玩家入口

[https://jjfishjj.github.io/studrunner-ascend-life/](https://jjfishjj.github.io/studrunner-ascend-life/)

## 驗證結果

- [x] 最新 upstream 整合後 `pnpm test`：8 個測試檔、67 項全部通過。
- [x] `pnpm build:local`：TypeScript 與 Vite production build 通過。
- [x] Chromium smoke：六關音景混音、音訊設定、第五關筆記、遊戲結束、一般勝利、星門終章與筆記本流程通過，沒有瀏覽器 console errors。
- [x] `git diff --check` 無 patch 格式錯誤。
