# 內建曲庫（給所有玩家）

1. 把音樂檔（mp3 / ogg / wav / m4a）放進這個資料夾。
2. 編輯 `manifest.json`，例如：

```json
{
  "tracks": [
    { "id": "beach", "name": "夏日海灘", "file": "beach.mp3" },
    { "id": "tower", "name": "星空塔頂", "file": "tower.ogg" },
    { "id": "finale", "name": "星空之門終章", "file": "finale.ogg" }
  ],
  "defaults": { "0": "tower", "5": "beach", "6": "finale" }
}
```

- `defaults` 的 key 是音樂欄位：`0` = 主選單／筆記本，`1`~`5` = 五階學習關卡，`6` = 五階學習後的「星空之門」終章；值是 `tracks` 裡的 `id`。
- 玩家在「音樂／音效設定」自選過的曲目，優先於 `defaults`。
- 上傳到「音樂／音效設定」頁的檔案只存在該瀏覽器，不會被其他玩家聽到。
- 遊戲內音樂音量與 SFX 音量分開持久化；舊版設定若沒有 `sfxVolume`，會採用既有預設值並正常載入。
