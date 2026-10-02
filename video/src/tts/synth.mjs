// 文案 → 每镜 wav → 实测时长 → build/timeline.json + out/trip-60s.srt
import fs from 'node:fs';
import path from 'node:path';
import sherpa from 'sherpa-onnx-node';

const root = path.resolve(import.meta.dirname, '../..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/scenes.json'), 'utf8'));
const modelDir = path.join(root, 'assets/tts-model');
const buildDir = path.join(root, 'build/tts');
fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(path.join(root, 'out'), { recursive: true });

const SPEED = Number(process.env.TTS_SPEED ?? 0.95);
const LEAD = 0.45; // 每镜开口前的呼吸
const MIN_TAIL = 0.45;

const tts = new sherpa.OfflineTts({
  model: {
    vits: {
      model: `${modelDir}/model.onnx`,
      lexicon: `${modelDir}/lexicon.txt`,
      tokens: `${modelDir}/tokens.txt`,
      dictDir: `${modelDir}/dict`,
    },
    numThreads: 4,
  },
  ruleFsts: ['date', 'number', 'phone', 'new_heteronym'].map((f) => `${modelDir}/${f}.fst`).join(','),
});

const clips = data.scenes.map((s, i) => {
  const audio = tts.generate({ text: s.narration, sid: 0, speed: SPEED });
  const file = path.join(buildDir, `${String(i).padStart(2, '0')}-${s.id}.wav`);
  sherpa.writeWave(file, { samples: audio.samples, sampleRate: audio.sampleRate });
  return { id: s.id, file, duration: audio.samples.length / audio.sampleRate };
});

const speech = clips.reduce((a, c) => a + c.duration, 0);
const minTotal = speech + clips.length * (LEAD + MIN_TAIL);
if (minTotal > data.targetDuration) {
  throw new Error(`旁白太长：${minTotal.toFixed(2)}s > ${data.targetDuration}s，调高 TTS_SPEED 或删字`);
}
// 剩余时间按旁白长度比例分给每镜的尾部（首镜和末镜多分一点给片头片尾）
const spare = data.targetDuration - minTotal;
const weights = clips.map((c, i) => c.duration + (i === 0 || i === clips.length - 1 ? 2.5 : 0));
const wsum = weights.reduce((a, b) => a + b, 0);

let t = 0;
const timeline = clips.map((c, i) => {
  const dur = LEAD + c.duration + MIN_TAIL + (spare * weights[i]) / wsum;
  const item = {
    id: c.id,
    start: +t.toFixed(3),
    end: +(t + dur).toFixed(3),
    speechStart: +(t + LEAD).toFixed(3),
    speechEnd: +(t + LEAD + c.duration).toFixed(3),
    audio: path.relative(root, c.file),
    subtitles: splitSubtitles(data.scenes[i].narration, t + LEAD, c.duration),
  };
  t += dur;
  return item;
});

fs.writeFileSync(path.join(root, 'build/timeline.json'), JSON.stringify({ total: +t.toFixed(3), scenes: timeline }, null, 2));
fs.writeFileSync(path.join(root, 'out/trip-60s.srt'), toSrt(timeline.flatMap((s) => s.subtitles)));
console.log(`speech ${speech.toFixed(2)}s, total ${t.toFixed(2)}s`);
for (const s of timeline) console.log(s.id.padEnd(10), s.start.toFixed(2), '→', s.end.toFixed(2));

// 按标点断句，时长按字数比例分配
function splitSubtitles(text, start, duration) {
  const parts = text.match(/[^，。！？、]+[，。！？、]?/g).map((p) => p.trim()).filter(Boolean);
  const merged = [];
  for (const p of parts) {
    const last = merged[merged.length - 1];
    if (last && (last + p).length <= 16 && last.replace(/[，。]/g, '').length < 7) merged[merged.length - 1] = last + p;
    else merged.push(p);
  }
  const total = merged.reduce((a, p) => a + p.length, 0);
  let s = start;
  return merged.map((p) => {
    const d = (duration * p.length) / total;
    const item = { text: p.replace(/[，。]$/, ''), start: +s.toFixed(3), end: +(s + d).toFixed(3) };
    s += d;
    return item;
  });
}

function toSrt(items) {
  const ts = (x) => {
    const ms = Math.round(x * 1000);
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    return `${h}:${m}:${sec},${String(ms % 1000).padStart(3, '0')}`;
  };
  return items.map((it, i) => `${i + 1}\n${ts(it.start)} --> ${ts(it.end)}\n${it.text}\n`).join('\n');
}
