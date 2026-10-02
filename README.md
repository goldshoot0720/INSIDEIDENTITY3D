# INSIDE IDENTITY 3D · 動作模仿

以 [INSIDE IDENTITY cover MV](https://www.youtube.com/watch?v=hNQdpqp_VdY) 為靈感的 3D 動作模仿網頁。
八位 Hyper3D + Mixamo 角色（Dpskmusume、Gugugaga、牙妹 Yamei、魚妹 Yumei、鋒兄 Fengbro、小塗 Tu、Miabubu、Miabyby）可任選最多 4 位同時站上紅黑魔法陣舞台跳舞，也能即時模仿你的動作。

## 模式

- **MV 編舞**：內建 22 段、每段 8 拍的程序化編舞（律動、揮拳、拍手、指向、交叉封印、邪王真眼、揮舞、側步、前踢出拳、繞手指天、空氣吉他、跳躍、轉圈、比心、黑炎召喚），含鏡像隊形與輪唱錯拍（依站位由左到右錯開）。中段 16 拍為 **個人秀**：每位角色做自己的招牌動作，鏡頭每 2 拍特寫一位——Dpskmusume 邪王真眼、Gugugaga 空氣吉他、牙妹 握麥高歌、魚妹 比心、鋒兄 撒鈔票、小塗 扳手鎖螺絲、Miabubu／Miabyby 左右對稱的喵喵貓爪。右側「角色」可隱藏任意角色，特寫只輪流拍在台上的人。可貼上 YouTube 網址（預設即原 MV）或載入本地歌曲檔當音樂，用 BPM / Tap / 偏移對拍。YouTube 音訊無法跨網域分析，只作為節拍時鐘；本地音檔則會驅動燈光能量。
- **攝像頭**：MediaPipe Pose 即時追蹤，台上角色同步模仿（可鏡像、輪唱延遲、平滑度）。
- **影片**：拖入本地舞蹈影片，最多辨識 4 人並按左→右分配給台上角色；只有 1 人時全員跟跳。

## 執行

需用本地伺服器開啟（攝像頭需要 localhost 或 HTTPS）：

```bash
python3 -m http.server 5173
```

然後打開 http://localhost:5173 。

## 結構

- `js/rig.js`：把「姿勢描述」（角色空間中的骨骼方向與軀幹/頭部旋轉）套用到 Mixamo 骨架
- `js/choreo.js`：編舞動作與時間軸
- `js/tracker.js`：MediaPipe 姿勢關鍵點 → 姿勢描述
- `js/youtube.js`：YouTube IFrame API 播放器、網址解析與平滑播放時間
- `js/stage.js`：魔法陣、光柱、聚光燈、粒子
- `js/main.js`：場景、角色載入（含從 FBX 抽取內嵌貼圖）、自動運鏡、後製與 UI

## PV（`pv.html`）

八位班底依 INSIDE IDENTITY MV 的制服風重新繪製成 2D 動畫人物（`js/pv/art.js`：深色西裝外套、格紋百褶裙、賽璐璐上色與描邊，保留各自特徵——鯨魚鰭耳與尾巴、企鵝帽、紅雙馬尾貓耳虎牙、眼鏡鬍渣、三花／白貓耳尾），並為 [Effects](https://github.com/goldshoot0720/Effects) 的 9 首歌各做一支 PV：標題卡、排排站、特寫名牌、四格臉部拼貼、`.pet` 視窗、大字歌詞、個人秀與謝幕，配撕紙黑框與底部字幕。舞步沿用 `js/choreo.js`，依歌曲段落與 BPM 排程（`js/pv/director.js`），每首的班底與配色在 `js/pv/story.js`。

- 即時播放：`node tools/serve.mjs` 後開 http://localhost:5173/pv.html
- 輸出 MP4：`node tools/render-pv.mjs`（全部）或 `node tools/render-pv.mjs s023 --from 20 --to 40`，需要 Google Chrome 與 ffmpeg，輸出到 `pv/`
- 重新匯入歌曲：`node tools/import-songs.mjs ../Effects`
- `sheet.html`：角色設定表；`tools/snap.mjs` 存單張畫面
