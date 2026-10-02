# 技术执行工单 · 《小海鸥的秋日长旅》1 分钟旅行动画

| 字段 | 内容 |
|---|---|
| 工单号 | TRIP-VIDEO-2027-01（取代旧版：目的地已从"蒙古国/东欧"改为"贝加尔湖—布里亚特—俄欧"，见 `trip-plan-2027-autumn.md`） |
| 执行方 | Claude（Opus 5.5），在 Claude Code 远程环境中执行 |
| 仓库 / 分支 | `liu18563/my-image-repo` · `claude/mongolia-russia-europe-trip-zk7xmx` |
| 工作目录 | `video/`（新建） |
| 技术栈 | Node.js 20 + 原生 JS（ESM）· HTML Canvas 2D · rough.js · d3-geo · Playwright(Chromium 已预装) · ffmpeg · TTS |
| 交付物 | `video/out/trip-60s.mp4`（1080×1920，30fps，H.264+AAC）、`video/out/trip-60s.srt`、`video/out/cover.png`、`video/CREDITS.md` |
| 时长 | 60s ± 0.5s |

---

## 1. 目标

用**纯 JS 逐帧渲染 + TTS 配音**做一条 60 秒竖屏短视频，讲夫妻俩 17 天的秋季长旅。

- **画风**：参考《旅行青蛙》的气质：手绘描边、低饱和水彩、纸张纹理、慢节奏、"寄回来的明信片"。
- **版权红线**：**不得复制《旅行青蛙》（Hit-Point）的角色造型、UI、字体和素材**。主角用原创的"青岛小海鸥夫妻"（一只戴红围巾、一只戴黄毛线帽），只借鉴画风。
- **真实场景标注**：每个场景都要叠加真实地名（中文 + 俄文原名）、经纬度、日期和一条可核实的事实；明信片里用真实照片（开源授权）经水彩滤镜处理。

---

## 2. 目录结构（执行方创建）

```
video/
├── package.json
├── src/
│   ├── data/
│   │   ├── scenes.json        # 分镜：时长、文案、标注、坐标、照片
│   │   └── route.geojson      # 路线折线（由 scenes 坐标生成）
│   ├── tts/
│   │   └── synth.mjs          # 文案 → 每镜 mp3 + 实测时长 → timeline.json
│   ├── render/
│   │   ├── index.html         # 画布宿主页
│   │   ├── engine.js          # renderFrame(n) 纯函数，确定性渲染
│   │   ├── style.js           # 水彩/纸纹/rough 描边工具
│   │   ├── characters.js      # 原创小海鸥夫妻（矢量绘制，3 种姿态）
│   │   ├── map.js             # d3-geo 手绘风地图 + 路线生长动画
│   │   ├── postcard.js        # 明信片：照片水彩化 + 邮戳 + 手写字
│   │   └── labels.js          # 真实场景标注组件
│   ├── capture.mjs            # Playwright 逐帧截图 → frames/*.png
│   └── mux.mjs                # ffmpeg 合成视频 + 音频 + 字幕
├── assets/
│   ├── photos/                # 下载的开源照片（附授权元数据）
│   ├── fonts/                 # LXGW WenKai（OFL）
│   └── geo/                   # Natural Earth 110m（公有领域）
├── out/
└── CREDITS.md
```

---

## 3. 分镜与 TTS 文案（共 10 镜，约 240 字）

语速按每秒 4.2 字估算；最终时长**以 TTS 实测时长为准**，用 `timeline.json` 驱动画面。

| # | 时长 | 画面 | 旁白（TTS） | 真实场景标注（叠加层） |
|---|---|---|---|---|
| 1 | 5s | 青岛栈桥，小海鸥夫妻背起行囊，纸纹地图从脚下展开 | 秋天到了，我们从青岛出发，去看贝加尔湖和莫斯科的金色秋天。 | 📍青岛·栈桥 36.06°N 120.32°E · 2027-09-04 |
| 2 | 5s | 地图俯视，虚线从青岛 → 北京 → 伊尔库茨克生长，小飞机图标 | 先到北京，再飞三小时，就到了西伯利亚的伊尔库茨克。 | ✈ PEK→IKT 约 2h55 · Иркутск 52.29°N 104.28°E |
| 3 | 7s | 明信片①：贝加尔湖真实照片（水彩化），夫妻坐在湖边石头上 | 贝加尔湖是世界上最深的湖，湖水清得能看见湖底的石头。 | 📍利斯特维扬卡 Листвянка 51.85°N 104.87°E · 最深 1642 m |
| 4 | 6s | 侧视火车沿湖奔跑，窗外湖面掠过 | 坐上西伯利亚铁路，沿着湖岸慢慢晃八个小时。 | 🚆 Иркутск→Улан-Удэ 约 460 km · 约 8h |
| 5 | 6s | 明信片②：伊沃尔金斯克寺金顶 + 草原，夫妻戴上毡帽 | 在乌兰乌德，遇见布里亚特人的寺院和草原，像走进了蒙古的故事。 | 📍伊沃尔金斯克寺 Иволгинский дацан 51.76°N 107.26°E |
| 6 | 6s | 地上一条白线，一只脚在亚洲、一只脚在欧洲 | 在叶卡捷琳堡，我们一只脚踩在亚洲，一只脚踩在欧洲。 | 📍欧亚分界碑 Екатеринбург ≈56.84°N 60.0°E（执行时校准） |
| 7 | 6s | 明信片③：喀山克里姆林宫白墙 + 蓝绿穹顶 | 喀山的白色城墙里，清真寺和教堂并排站着。 | 📍喀山克里姆林 Казанский кремль 55.80°N 49.11°E · UNESCO 2000 |
| 8 | 7s | 红场夜景：圣瓦西里大教堂彩色洋葱顶，雪花般的落叶 | 莫斯科的红场亮起灯，圣瓦西里教堂像一盒彩色糖果。 | 📍红场 Красная площадь 55.754°N 37.620°E |
| 9 | 7s | 明信片④：冬宫广场 + 夏宫喷泉，金色树叶 | 最后一站圣彼得堡，冬宫和喷泉，留住了这个秋天。 | 📍冬宫 Зимний дворец 59.940°N 30.314°E |
| 10 | 5s | 回到青岛的家，桌上铺满明信片，镜头拉远成整条路线图 | 十七天，一万多公里，下一站，我们还一起去。 | 全程路线 + "17 天 · 7 段航班 · 每段 ≤ 4h" |

> 坐标是近似值：**执行时用 Wikidata（P625）逐一校准**，误差超过 0.05° 就以 Wikidata 为准，并在 `scenes.json` 中记录 `wikidataId`。

---

## 4. 任务拆分

### T1 · 初始化（预计 10 分钟）
- [ ] `npm init`，依赖：`roughjs`、`d3-geo`、`topojson-client`、`playwright`（**不要** `playwright install`，用 `/opt/pw-browsers`）、`msedge-tts`（或备选见 T3）。
- [ ] 确认 `ffmpeg -version` 可用；没有的话安装静态版。
- [ ] 下载字体 LXGW WenKai（OFL）、Natural Earth 110m countries（公有领域）。

### T2 · 数据层 `scenes.json`
- [ ] 按第 3 节写 10 个场景对象：`{id, narration, label:{zh, ru, lat, lon, date, fact}, photo:{file, author, license, sourceUrl}, layout}`。
- [ ] 从 Wikidata 拉坐标校准；从 Wikimedia Commons 选**CC0 / CC-BY / CC-BY-SA**照片，每张记录作者、许可证、原链接，写进 `CREDITS.md`。不要用来源不明的网图。

### T3 · TTS `synth.mjs`
- [ ] 首选：`msedge-tts`，音色 `zh-CN-XiaoxiaoNeural`（女声温柔）；可选双人声：第 1、10 镜用 `zh-CN-YunxiNeural` 对白式。
- [ ] 备选（首选不可用时）：Azure Speech（需要用户提供 key，**不要自行申请**），或本地 `piper` 中文模型。
- [ ] 每镜生成 `tts/NN.mp3`，用 `ffprobe` 测时长，写 `timeline.json`：`{sceneId, start, end, audio}`，每镜前后各留 0.3s 呼吸。
- [ ] 总时长不在 59.5–60.5s 时：先调 `rate`（±10% 内），还不行就修改文案字数，**不要**拉伸音频。
- [ ] 同时生成 `trip-60s.srt`（按标点断句，每行 ≤ 14 字）。

### T4 · 画风引擎 `style.js`（关键）
旅行青蛙气质的实现方式：
- [ ] **纸纹**：米白底 `#F4EBDD` + 预计算的低频噪声纹理（种子固定），叠 6% 透明度。
- [ ] **水彩填充**：每个色块 = 3–5 层轻微位移、`globalAlpha 0.15–0.25` 的 rough 多边形叠加，边缘做 1–2px 抖动，模拟晕染。
- [ ] **描边**：rough.js，`roughness 1.2`、`bowing 1.5`、深棕 `#5B4636`、线宽 2.5px；**每 4 帧换一次种子**（动画"手绘抖动感"，12fps 视觉）。
- [ ] **色板**（低饱和秋色）：湖蓝 `#7FA7B5`、苔绿 `#9CAF88`、银杏黄 `#E6B655`、砖红 `#C8664B`、雪白 `#FAF7F0`。
- [ ] **照片水彩化**：照片绘制到离屏 canvas → 降饱和 30% → 色调分离（6 级）→ 叠纸纹 → 边缘不规则蒙版（明信片撕边）。
- [ ] 全部随机数用带种子的 PRNG（如 mulberry32），保证同一帧多次渲染结果完全一致。

### T5 · 组件
- [ ] `characters.js`：原创海鸥夫妻，矢量路径绘制，姿态 `walk / sit / wave`，2 帧眨眼循环，围巾随风摆动（正弦）。
- [ ] `map.js`：d3-geo 正交/等距投影，中国—俄罗斯范围；国界用 rough 描边；路线按 `timeline` 逐段生长，飞行段为虚线弧线 + 小飞机，火车段为实线 + 小火车。
- [ ] `postcard.js`：白边 + 邮票（原创图案）+ 邮戳（城市俄文名 + 日期）+ 手写体一句话；入场：从画面外飞入，旋转 −4°→2°，ease-out-back。
- [ ] `labels.js`（真实场景标注）：
  - 左下角半透明纸条：`📍中文名 · 俄文名`，第二行 `经纬度 · 日期`，第三行事实（如"最深 1642 m"）。
  - 地图模式下在真实坐标处落图钉，引线指向标签。
  - 字号：标题 44px、副行 30px，保证手机竖屏可读；离安全区边缘 ≥ 64px。

### T6 · 渲染 `engine.js` + `capture.mjs`
- [ ] `window.renderFrame(n)`：根据 `timeline.json` 计算当前镜与局部进度 t∈[0,1]，纯函数绘制；镜间转场 0.4s（纸张翻页或水彩溶解）。
- [ ] Playwright 打开 `index.html`（1080×1920，deviceScaleFactor 1），循环 `n = 0..1799`：`await page.evaluate(n => renderFrame(n), n)` → canvas `toDataURL` → 写 `frames/%05d.png`。**不录屏**，逐帧确定性截取。
- [ ] 渲染第 0、450、900、1350、1799 帧作为预览图，先人工（或用 Read 看图）检查画风再全量渲染。

### T7 · 合成 `mux.mjs`
- [ ] 拼接音频：按 `timeline` 用 ffmpeg `adelay` + `amix`；可选 BGM（必须是 CC0/公有领域，音量 −22 dB，旁白时侧链压低）。
- [ ] 响度标准化到 −16 LUFS（`loudnorm`）。
- [ ] `ffmpeg -framerate 30 -i frames/%05d.png -i audio.m4a -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 160k -shortest out/trip-60s.mp4`
- [ ] 另出一版烧录字幕（`subtitles=` 滤镜，字体 LXGW WenKai），文件名 `trip-60s-sub.mp4`。
- [ ] 第 10 镜最后一帧导出 `cover.png`。

### T8 · 验收与提交
- [ ] 跑 `ffprobe` 输出时长、分辨率、帧率、音轨，贴进 PR/提交说明。
- [ ] `CREDITS.md`：照片、字体、地图数据、TTS 引擎、BGM 的来源与许可。
- [ ] `frames/` 和 `tts/` 中间产物加入 `.gitignore`，**只提交源码 + out/ 成品**（mp4 > 50MB 时只提交源码，成品走 Release 附件）。
- [ ] 提交并推送到 `claude/mongolia-russia-europe-trip-zk7xmx`，**不自行创建 PR**。

---

## 5. 验收标准

| # | 标准 | 检查方式 |
|---|---|---|
| A1 | 时长 60±0.5s，1080×1920，30fps，H.264 + AAC | ffprobe |
| A2 | 10 个镜头都有真实场景标注（中/俄名 + 坐标 + 事实），坐标与 Wikidata 偏差 < 0.05° | 脚本对比 `scenes.json` |
| A3 | 旁白与画面同步：每镜画面切换点与 TTS 段落误差 < 0.1s | timeline 对比 |
| A4 | 画风：纸纹 + 水彩 + 手绘抖动描边可见；无《旅行青蛙》原角色/素材 | 预览帧人工检查 |
| A5 | 同一帧渲染两次 PNG 字节一致（确定性） | md5 对比 |
| A6 | 所有外部素材在 CREDITS.md 有出处和许可 | 人工检查 |
| A7 | 路线与 `trip-plan-2027-autumn.md` 一致：不含海参崴、乌克兰、蒙古国（主方案）、塞尔维亚（主方案） | 对照检查 |

---

## 6. 风险与执行约束

- **网络**：远程环境有出口代理，部分域名可能被拦（本次检索时 `hleba.cn`、`cs.mfa.gov.cn`、`ivisa.hse.ru` 被拦）。Wikimedia/Wikidata 被拦时，改为让用户上传照片，或这一镜用纯手绘插画替代，在 CREDITS 中注明。
- **TTS 不可用**：`msedge-tts` 依赖微软非公开接口，可能失效 → 依次退到本地 piper → 请用户提供 Azure key。**不得自行注册任何账号**。
- **字体**：只用 OFL/开源字体，不用系统里的商业字体。
- **磁盘**：1800 张 PNG 约 2–4 GB，合成后立即删除 `frames/`。
- **不得**在任何提交内容里写入模型标识。

---

## 7. 给执行方的启动指令（可直接粘贴）

> 读 `docs/trip-plan-2027-autumn.md` 和本工单 `docs/opus55-video-work-order.md`。按 T1→T8 顺序执行；T6 全量渲染前先输出 5 张预览帧给我确认画风；每完成一个 T 在工单里把对应复选框打勾并提交一次。最终把 mp4 用 SendUserFile 发给我。

---

## 8. 执行记录（2026-10-02）

| 任务 | 状态 | 与工单的偏差 |
|---|---|---|
| T1 初始化 | ✅ | Playwright 用预装 Chromium（`/opt/pw-browsers/chromium`）；d3-geo 改用完整 `d3` 包 |
| T2 数据层 | ✅ | Wikidata / Wikimedia 被网络策略拦截 → 坐标为人工核对的近似值，明信片改用手绘插画（按第 6 节降级方案） |
| T3 TTS | ✅ | Edge TTS 返回 403 → 改用本地 **sherpa-onnx + MeloTTS 中文女声**（MIT 许可），仍是纯 JS 调用（`sherpa-onnx-node`） |
| T4 画风引擎 | ✅ | 纸纹 + 水彩多层晕染 + rough.js 描边，线条每 6 帧换一次种子 |
| T5 组件 | ✅ | 原创"青岛小海鸥夫妻"（红围巾 / 黄毛线帽），明信片邮票与邮戳为原创 |
| T6 渲染 | ✅ | 帧以 JPEG 流直接送进 ffmpeg，不落盘；转场为"撕纸揭页" |
| T7 合成 | ✅ | 背景音乐为程序合成的原创拨弦琶音，旁白时侧链压低；响度 −16 LUFS；字幕直接画进画面 |
| T8 验收 | ✅ | 见 `video/README.md`；mp4 体积小于 50MB，直接提交到 `video/out/` |
