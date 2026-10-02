// 原创背景音乐：拨弦琶音 + 柔和铺底，程序合成，无版权素材
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const SR = 44100;
const DURATION = 61;
const BPM = 84;
const beat = 60 / BPM;
const out = new Float32Array(SR * DURATION);

// mulberry32：固定种子，保证每次生成结果一致
let seed = 20270904;
const rand = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const midi = (n) => 440 * 2 ** ((n - 69) / 12);

// Karplus–Strong 拨弦
function pluck(start, note, len, gain) {
  const f = midi(note);
  const period = Math.round(SR / f);
  const buf = Float32Array.from({ length: period }, () => rand() * 2 - 1);
  const n0 = Math.floor(start * SR);
  const n = Math.floor(len * SR);
  let idx = 0;
  for (let i = 0; i < n && n0 + i < out.length; i++) {
    const next = (idx + 1) % period;
    const v = buf[idx];
    buf[idx] = 0.4985 * (buf[idx] + buf[next]);
    idx = next;
    const env = Math.min(1, i / 60) * Math.exp(-i / (SR * 1.6));
    out[n0 + i] += v * gain * env;
  }
}

function pad(start, notes, len, gain) {
  const n0 = Math.floor(start * SR);
  const n = Math.floor(len * SR);
  for (let i = 0; i < n && n0 + i < out.length; i++) {
    const t = i / SR;
    const env = Math.sin(Math.PI * Math.min(1, t / len)) ** 1.5;
    let v = 0;
    for (const note of notes) v += Math.sin(2 * Math.PI * midi(note) * t) + 0.25 * Math.sin(4 * Math.PI * midi(note) * t);
    out[n0 + i] += (v / notes.length) * gain * env;
  }
}

// C – Am – F – G，每和弦 2 小节
const chords = [
  [48, 55, 60, 64, 67, 72],
  [45, 52, 57, 60, 64, 69],
  [41, 48, 53, 57, 60, 65],
  [43, 50, 55, 59, 62, 67],
];
const pattern = [0, 2, 3, 4, 5, 4, 3, 2];
const barLen = beat * 4;
let t = 0;
let bar = 0;
while (t < DURATION - 1) {
  const ch = chords[Math.floor(bar / 2) % chords.length];
  pad(t, [ch[0] + 12, ch[2], ch[3]], barLen * 1.05, 0.05);
  pluck(t, ch[0], barLen, 0.22);
  pattern.forEach((p, i) => pluck(t + (i * beat) / 2, ch[p] + (bar % 4 === 3 && i > 5 ? 12 : 0), beat * 2, 0.12));
  // 偶数小节加一个小旋律音
  if (bar % 2 === 1) pluck(t + beat * 3, ch[5] + 12, beat * 2, 0.08);
  t += barLen;
  bar++;
}

// 淡入淡出 + 归一化
const fade = SR * 2;
let peak = 0;
for (let i = 0; i < out.length; i++) {
  if (i < fade) out[i] *= i / fade;
  if (i > out.length - fade * 1.5) out[i] *= Math.max(0, (out.length - i) / (fade * 1.5));
  peak = Math.max(peak, Math.abs(out[i]));
}
const pcm = Buffer.alloc(out.length * 2);
for (let i = 0; i < out.length; i++) pcm.writeInt16LE(Math.round((out[i] / peak) * 0.8 * 32767), i * 2);

const header = Buffer.alloc(44);
header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8);
header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
fs.mkdirSync(path.join(root, 'build'), { recursive: true });
fs.writeFileSync(path.join(root, 'build/bgm.wav'), Buffer.concat([header, pcm]));
console.log('bgm.wav written');
