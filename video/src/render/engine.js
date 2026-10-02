// renderFrame(n)：纯函数式逐帧渲染。同一帧号永远画出同一张图。
import { C, Painter, makePaper, clamp, easeOut, easeOutBack, lerp, FONT, hash } from './style.js';
import * as S from './scenes.js';
import { initMap, drawMap } from './map.js';

const rough = window.rough;
const VW = 1080, VH = 1920;
const FRAME = { x: 60, y: 236, w: S.W, h: S.H };
const POSTCARDS = new Set(['baikal', 'datsan', 'kazan', 'spb']);
const TRANSITION = 0.5;

let data, timeline, paper, main, aux;

window.setup = async function () {
  [data, timeline] = await Promise.all([
    fetch('../data/scenes.json').then((r) => r.json()),
    fetch('../../build/timeline.json').then((r) => r.json()),
  ]);
  const world = await fetch('../../node_modules/world-atlas/countries-110m.json').then((r) => r.json());
  initMap(world, data.places);
  main = document.getElementById('c');
  aux = document.getElementById('aux');
  paper = makePaper(VW, VH);
  // 预加载所有用到的字形（字体按 unicode-range 分片）
  const allText = JSON.stringify(data) + '欧洲亚洲ЕВРОПААЗИЯN0123456789°/·小海鸥的秋日长旅';
  for (const size of [24, 32, 40, 52]) {
    await document.fonts.load(`${size}px 'LXGW WenKai'`, allText);
    await document.fonts.load(`${size}px 'Caveat'`, 'ЕВРОПААЗИЯЦиндаоИркутскЛиствянкаТранссибирскаямагистральИволгинскийдацанГраницаЕвропыиАзииКазанскийкремльКраснаяплощадьЗимнийдворецДовстречи!');
  }
  await document.fonts.ready;
  return { frames: Math.round(timeline.total * data.fps) };
};

function sceneAt(time) {
  const list = timeline.scenes;
  for (let i = 0; i < list.length; i++) if (time < list[i].end || i === list.length - 1) return i;
  return list.length - 1;
}

// 只画画框内的插画
function drawIllustration(ctx, frame, i, time) {
  const sc = data.scenes[i], tl = timeline.scenes[i];
  const t = time - tl.start;
  const u = clamp(t / (tl.end - tl.start));
  const p = new Painter(ctx, rough, frame);
  ctx.save();
  ctx.translate(FRAME.x, FRAME.y);
  ctx.beginPath(); ctx.rect(0, 0, S.W, S.H); ctx.clip();
  ctx.drawImage(paper, 0, 0, S.W, S.H, 0, 0, S.W, S.H);
  // 轻微推镜
  const z = 1 + 0.04 * u;
  ctx.translate(S.W / 2, S.H / 2); ctx.scale(z, z); ctx.translate(-S.W / 2, -S.H / 2);
  if (sc.kind === 'map') {
    drawMap(p, t, u, sc.route, { plane: true, progress: clamp((t - 0.6) / (tl.end - tl.start - 1.6)) });
  } else if (sc.kind === 'finale') {
    drawMap(p, t, u, sc.route, {
      progress: clamp((t - 0.2) / 2.8),
      trainSegs: [0, 2, 6, 7],
      returnRoute: ['spb', 'moscow', 'novosibirsk', 'irkutsk', 'beijing', 'qingdao'],
      couple: true,
      overview: true,
    });
  } else {
    S[sc.kind](p, t, u);
  }
  ctx.restore();
  // 纸纹叠在画面上，让颜色"吃进纸里"
  ctx.save(); ctx.globalAlpha = 0.35; ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(paper, FRAME.x, FRAME.y, S.W, S.H, FRAME.x, FRAME.y, S.W, S.H);
  ctx.restore();
}

// 明信片外框：白边 + 邮票 + 邮戳，从画面下方飞入
function postcardTransform(ctx, i, t) {
  const k = easeOutBack(clamp(t / 0.9));
  const rot = lerp(-0.12, 0.012 * (i % 2 ? 1 : -1), k);
  const dy = lerp(700, 0, k);
  const cx = FRAME.x + S.W / 2, cy = FRAME.y + S.H / 2;
  ctx.translate(cx, cy + dy); ctx.rotate(rot); ctx.translate(-cx, -cy);
}

function drawPostcardChrome(ctx, p, i, t) {
  const sc = data.scenes[i];
  const b = 22;
  ctx.save();
  ctx.shadowColor = 'rgba(80,60,40,0.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  ctx.fillStyle = C.white;
  ctx.fillRect(FRAME.x - b, FRAME.y - b, S.W + b * 2, S.H + b * 2);
  ctx.restore();
  return () => {
    // 邮票（原创图案：小海鸥剪影 + 2027）
    const sx = FRAME.x + S.W - 150, sy = FRAME.y + 26;
    ctx.save();
    ctx.fillStyle = '#FFFDF6'; ctx.fillRect(sx, sy, 120, 146);
    ctx.setLineDash([5, 5]); ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 2; ctx.strokeRect(sx, sy, 120, 146); ctx.setLineDash([]);
    ctx.fillStyle = ['#7FA7B5', '#E6B655', '#C8664B', '#9CAF88'][i % 4]; ctx.globalAlpha = 0.7; ctx.fillRect(sx + 10, sy + 10, 100, 100);
    ctx.globalAlpha = 1;
    p.curve('stampgull' + i, [[sx + 30, sy + 64], [sx + 48, sy + 50], [sx + 60, sy + 60], [sx + 72, sy + 50], [sx + 90, sy + 64]], { width: 3, still: true });
    p.text('2027', sx + 60, sy + 134, 24, { align: 'center' });
    ctx.restore();
    // 邮戳
    const px = sx - 40, py = sy + 120;
    const a = clamp((t - 0.9) * 4);
    ctx.save(); ctx.globalAlpha = 0.75 * a; ctx.strokeStyle = '#6A4A7A'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(px, py, 66, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 52, 0, Math.PI * 2); ctx.stroke();
    for (let w = 0; w < 4; w++) { ctx.beginPath(); ctx.moveTo(px + 70, py - 24 + w * 16); ctx.bezierCurveTo(px + 110, py - 34 + w * 16, px + 130, py - 14 + w * 16, px + 170, py - 24 + w * 16); ctx.stroke(); }
    ctx.fillStyle = '#6A4A7A'; ctx.font = `600 20px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(sc.label.ru.slice(0, 14), px, py - 6);
    ctx.fillText(sc.label.date.replaceAll('-', '.'), px, py + 22);
    ctx.restore();
  };
}

function drawFrameBorder(ctx, p) {
  p.rect('frameborder', FRAME.x - 6, FRAME.y - 6, S.W + 12, S.H + 12, { width: 3, roughness: 1.4 });
}

function drawHeader(ctx, p, i, t) {
  p.text(data.title, 72, 150, 60, { weight: 400 });
  p.text(data.subtitle, 74, 200, 28, { alpha: 0.6 });
  const sc = data.scenes[i];
  const cx = VW - 150, cy = 140;
  p.washEllipse('daychip', cx, cy, 92, 54, C.ginkgo, { alpha: 0.9 });
  p.ellipse('daychipo', cx, cy, 184, 108, { width: 2.4 });
  p.text(sc.day, cx + 10, cy + 14, 42, { align: 'right' });
  p.text('/17', cx + 14, cy + 14, 26, { align: 'left', alpha: 0.7 });
}

function fmtCoord(lab) {
  const d = lab.latPrecision ?? 3;
  const ns = lab.lat >= 0 ? 'N' : 'S', ew = lab.lon >= 0 ? 'E' : 'W';
  const pre = lab.latPrecision ? '≈' : '';
  return `${pre}${Math.abs(lab.lat).toFixed(d)}°${ns}  ${Math.abs(lab.lon).toFixed(d)}°${ew}`;
}

// 真实场景标注
function drawLabel(ctx, p, i, t) {
  const lab = data.scenes[i].label;
  const k = easeOut(clamp((t - 0.5) / 0.6));
  if (k <= 0) return;
  const x = lerp(-700, 60, k), y = 1316;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.008);
  p.washRect('labelbg', 0, 0, 960, 236, '#FFF9EE', { alpha: 1, spread: 2 });
  p.rect('labelo', 0, 0, 960, 236, { width: 2.4 });
  // 胶带
  ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#E6CFA0'; ctx.translate(40, -10); ctx.rotate(-0.2); ctx.fillRect(-30, -12, 110, 30); ctx.restore();
  // 图钉
  p.washEllipse('pin', 64, 70, 22, 22, C.brick, { alpha: 1 });
  p.circle('pino', 64, 70, 44, { width: 2.2 });
  ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(58, 64, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  p.line('pinl', 64, 92, 64, 120, { width: 3 });
  p.text(lab.zh, 110, 86, 50);
  ctx.font = `400 50px ${FONT}`;
  const zw = ctx.measureText(lab.zh).width;
  // 俄文原名：放不下就缩小字号
  const room = 930 - (110 + zw + 24);
  let ruSize = 40;
  ctx.font = `500 ${ruSize}px ${FONT}`;
  while (ruSize > 24 && ctx.measureText(lab.ru).width > room) { ruSize -= 2; ctx.font = `500 ${ruSize}px ${FONT}`; }
  p.text(lab.ru, 110 + zw + 24, 86, ruSize, { alpha: 0.75 });
  p.text(`${fmtCoord(lab)}  ·  ${lab.date}`, 110, 146, 32, { alpha: 0.75 });
  // 事实一行：打字机效果
  const chars = Math.floor(clamp((t - 1.0) / 1.2) * lab.fact.length);
  p.text(lab.fact.slice(0, chars), 110, 204, 34, { color: '#8A4B36' });
  ctx.restore();
}

function drawSubtitle(ctx, p, time) {
  const subs = timeline.scenes.flatMap((s) => s.subtitles);
  const s = subs.find((x) => time >= x.start && time < x.end + 0.15);
  if (!s) return;
  const a = clamp((time - s.start) / 0.12) * clamp((s.end + 0.15 - time) / 0.12);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `400 52px ${FONT}`;
  const w = ctx.measureText(s.text).width;
  const y = 1690;
  p.washRect('subbg' + (hash(s.text) % 97), VW / 2 - w / 2 - 34, y - 56, w + 68, 84, 'rgba(255,250,240,0.92)', { alpha: 0.95, spread: 2, edge: false });
  ctx.fillStyle = C.ink; ctx.textAlign = 'center';
  ctx.fillText(s.text, VW / 2, y);
  ctx.restore();
}

// 底部旅程进度：10 个小圆点
function drawProgress(ctx, p, i, time) {
  const n = timeline.scenes.length;
  const x0 = 200, x1 = VW - 200, y = 1840;
  p.line('progline', x0, y, x1, y, { width: 2, alpha: 0.5, still: true });
  for (let k = 0; k < n; k++) {
    const x = lerp(x0, x1, k / (n - 1));
    const done = k <= i;
    if (done) p.washEllipse('pd' + k, x, y, 12, 12, k === i ? C.brick : C.ginkgo, { alpha: 1, spread: 1 });
    p.circle('pdo' + k, x, y, k === i ? 30 : 22, { width: 2, still: true });
  }
}

function drawScene(ctx, frame, i, time) {
  const tl = timeline.scenes[i];
  const t = time - tl.start;
  const sc = data.scenes[i];
  const p = new Painter(ctx, rough, frame);
  ctx.save();
  ctx.drawImage(paper, 0, 0);
  drawHeader(ctx, p, i, t);
  if (POSTCARDS.has(sc.id)) {
    ctx.save();
    postcardTransform(ctx, i, t);
    const finish = drawPostcardChrome(ctx, p, i, t);
    drawIllustration(ctx, frame, i, time);
    finish();
    ctx.restore();
  } else {
    drawIllustration(ctx, frame, i, time);
    drawFrameBorder(ctx, p);
  }
  drawLabel(ctx, p, i, t);
  drawProgress(ctx, p, i, time);
  ctx.restore();
}

window.renderFrame = function (n) {
  const time = n / data.fps;
  const i = sceneAt(time);
  const tl = timeline.scenes[i];
  const ctx = main.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawScene(ctx, n, i, time);

  // 转场：上一镜像被撕开的纸一样从右往左揭走
  const t = time - tl.start;
  if (i > 0 && t < TRANSITION) {
    const actx = aux.getContext('2d');
    actx.setTransform(1, 0, 0, 1, 0, 0);
    drawScene(actx, n, i - 1, tl.start - 0.001);
    const k = easeOut(t / TRANSITION);
    const edge = lerp(VW + 60, -120, k);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    for (let y = 0; y <= VH; y += 40) ctx.lineTo(edge + Math.sin(y * 0.031 + 1.7) * 26 + Math.sin(y * 0.11) * 9, y);
    ctx.lineTo(-10, VH);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(aux, 0, 0);
    ctx.restore();
  }
  // 片头淡入 / 片尾淡出到纸色
  const fadeIn = clamp(1 - time / 0.5);
  const fadeOut = clamp((time - (timeline.total - 0.9)) / 0.9);
  const f = Math.max(fadeIn, fadeOut);
  if (f > 0) { ctx.save(); ctx.globalAlpha = f; ctx.drawImage(paper, 0, 0); ctx.restore(); }
  if (fadeOut > 0) {
    const p = new Painter(ctx, rough, n);
    p.text('下一站，还一起去。', VW / 2, VH / 2, 72, { align: 'center', alpha: fadeOut });
    p.text('2027 · 小海鸥的秋日长旅', VW / 2, VH / 2 + 80, 34, { align: 'center', alpha: fadeOut * 0.7 });
  }
  drawSubtitle(ctx, new Painter(ctx, rough, n), time);
  return true;
};

window.grab = function (type = 'image/jpeg', q = 0.94) {
  return main.toDataURL(type, q);
};
