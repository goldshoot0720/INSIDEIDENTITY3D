# INSIDE IDENTITY 3D · 動作模仿

以 [INSIDE IDENTITY cover MV](https://www.youtube.com/watch?v=hNQdpqp_VdY) 為靈感的 3D 動作模仿網頁。
四位 Hyper3D + Mixamo 角色（Dpskmusume、Gugugaga、Yamei、Yumei）在紅黑魔法陣舞台上跳舞，也能即時模仿你的動作。

## 模式

- **MV 編舞**：內建 16 段、每段 8 拍的程序化編舞（律動、揮拳、拍手、指向、交叉封印、邪王真眼、揮舞、側步、跳躍、轉圈、比心），含鏡像隊形與輪唱錯拍。可貼上 YouTube 網址（預設即原 MV）或載入本地歌曲檔當音樂，用 BPM / Tap / 偏移對拍。YouTube 音訊無法跨網域分析，只作為節拍時鐘；本地音檔則會驅動燈光能量。
- **攝像頭**：MediaPipe Pose 即時追蹤，四位角色同步模仿（可鏡像、輪唱延遲、平滑度）。
- **影片**：拖入本地舞蹈影片，最多辨識 4 人並按左→右分配給角色；只有 1 人時全員跟跳。

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
