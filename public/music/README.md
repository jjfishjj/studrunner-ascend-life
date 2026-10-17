# 內建曲庫（給所有玩家）

1. 把音樂檔（mp3 / ogg / wav / m4a）放進這個資料夾。
2. 編輯 `manifest.json`，例如：

```json
{
  "tracks": [
    { "id": "beach", "name": "夏日海灘", "file": "beach.mp3" },
    { "id": "tower", "name": "星空塔頂", "file": "tower.ogg" }
  ],
  "defaults": { "0": "tower", "5": "beach" }
}
```

- `defaults` 的 key 是音樂欄位：`0` = 主選單／筆記本，`1`~`5` = 一階～五階；值是 `tracks` 裡的 `id`。
- 玩家在「音樂設定」自選過的曲目，優先於 `defaults`。
- 上傳到「音樂設定」頁的檔案只存在該瀏覽器，不會被其他玩家聽到。
