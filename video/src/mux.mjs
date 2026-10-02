// 旁白按时间轴摆位 + 背景音乐（旁白时自动压低）→ 响度标准化 → 与画面合成
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const timeline = JSON.parse(fs.readFileSync(path.join(root, 'build/timeline.json'), 'utf8'));
const out = path.join(root, 'out');
fs.mkdirSync(out, { recursive: true });

const inputs = timeline.scenes.flatMap((s) => ['-i', path.join(root, s.audio)]);
const n = timeline.scenes.length;
const delays = timeline.scenes
  .map((s, i) => `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${Math.round(s.speechStart * 1000)}:all=1[v${i}]`)
  .join(';');
const filter = [
  delays,
  `${timeline.scenes.map((_, i) => `[v${i}]`).join('')}amix=inputs=${n}:normalize=0,apad=whole_dur=${timeline.total}[voice]`,
  `[voice]asplit=2[vo][sc]`,
  `[${n}:a]aresample=44100,aformat=channel_layouts=mono,volume=0.32,atrim=0:${timeline.total}[bgm]`,
  `[bgm][sc]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=500[duck]`,
  `[vo][duck]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aformat=channel_layouts=stereo[a]`,
].join(';');

const ff = (...args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: 'inherit' });

ff(...inputs, '-i', path.join(root, 'build/bgm.wav'), '-filter_complex', filter, '-map', '[a]', '-t', String(timeline.total), '-ar', '48000', '-c:a', 'pcm_s16le', path.join(root, 'build/mix.wav'));

// 字幕已画进画面，这里直接合成
ff('-i', path.join(root, 'build/video.mp4'), '-i', path.join(root, 'build/mix.wav'),
  '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart',
  path.join(out, 'trip-60s.mp4'));

console.log(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_name,width,height,r_frame_rate', '-of', 'compact', path.join(out, 'trip-60s.mp4')]).toString());
