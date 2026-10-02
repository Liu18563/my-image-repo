// 用 Playwright 打开渲染页，逐帧调用 renderFrame(n)，JPEG 帧流直接喂给 ffmpeg（不录屏、不落盘）
// 用法：node src/capture.mjs            → build/video.mp4
//       node src/capture.mjs --preview 0,450,900  → build/preview/*.png
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror', e));
page.on('console', (m) => m.type() === 'error' && console.error('console', m.text()));
await page.goto(`http://127.0.0.1:${port}/src/render/index.html`);
await page.waitForFunction(() => typeof window.setup === 'function');
const { frames } = await page.evaluate(() => window.setup());

const args = process.argv.slice(2);
const previewIdx = args.indexOf('--preview');
if (previewIdx >= 0) {
  const list = args[previewIdx + 1].split(',').map(Number);
  const dir = path.join(root, 'build/preview');
  fs.mkdirSync(dir, { recursive: true });
  for (const n of list) {
    const url = await page.evaluate((n) => (window.renderFrame(n), window.grab('image/png')), n);
    fs.writeFileSync(path.join(dir, `f${String(n).padStart(4, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
    console.log('preview', n);
  }
} else {
  fs.mkdirSync(path.join(root, 'build'), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', path.join(root, 'build/video.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let n = 0; n < frames; n++) {
    const url = await page.evaluate((n) => (window.renderFrame(n), window.grab('image/jpeg', 0.95)), n);
    const buf = Buffer.from(url.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (n % 150 === 0) console.log(`frame ${n}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r())));
  // 封面：最后一镜的定格
  const cover = await page.evaluate((n) => (window.renderFrame(n), window.grab('image/png')), Math.round(frames * 0.975));
  fs.mkdirSync(path.join(root, 'out'), { recursive: true });
  fs.writeFileSync(path.join(root, 'out/cover.png'), Buffer.from(cover.split(',')[1], 'base64'));
  console.log('done', frames, 'frames');
}
await browser.close();
server.close();
