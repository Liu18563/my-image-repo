# 小海鸥的秋日长旅 · 1 分钟旅行动画

按 `../docs/opus55-video-work-order.md` 实现：纯 JS 逐帧渲染（Canvas + rough.js + d3-geo），本地 TTS（sherpa-onnx + MeloTTS），ffmpeg 合成。

成品：`out/trip-60s.mp4`（1080×1920，30fps，60s，字幕已烧录）、`out/trip-60s.srt`、`out/cover.png`。

## 重新生成

```bash
npm install
npm run model      # 下载 TTS 模型（约 160MB，不进仓库）
npm run tts        # 旁白 + 时间轴 + 字幕
npm run bgm        # 背景音乐
npm run preview    # 10 张预览帧 → build/preview/
npm run render     # 全量 1800 帧 → build/video.mp4
npm run mux        # 混音合成 → out/trip-60s.mp4
```

改文案、坐标、标注：只改 `src/data/scenes.json`，然后从 `npm run tts` 重跑。
