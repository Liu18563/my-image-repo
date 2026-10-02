// 原创角色：青岛小海鸥夫妻。红围巾 = 他，黄毛线帽 = 她。只借画风气质，不借任何现有角色造型。
import { C } from './style.js';

/**
 * @param p Painter
 * @param o { id, x, y, s, accessory:'scarf'|'hat', pose:'stand'|'walk'|'sit'|'wave', t, facing:1|-1, extra:'suitcase'|'felt' }
 * (x, y) 是脚底中心
 */
export function gull(p, o) {
  const { id, x, y, s = 1, accessory = 'scarf', pose = 'stand', t = 0, facing = 1 } = o;
  const ctx = p.ctx;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * facing, s);

  const walk = pose === 'walk' ? Math.sin(t * 9) : 0;
  const bob = pose === 'walk' ? Math.abs(Math.sin(t * 9)) * 4 : Math.sin(t * 2.2) * 1.5;
  const sit = pose === 'sit';

  // 脚
  if (!sit) {
    p.line(id + 'f1', -14, -34, -16 + walk * 8, 0, { color: '#E08A3C', width: 4 });
    p.line(id + 'f2', 12, -34, 14 - walk * 8, 0, { color: '#E08A3C', width: 4 });
    p.line(id + 'f1b', -24 + walk * 8, 0, -8 + walk * 8, 0, { color: '#E08A3C', width: 4 });
    p.line(id + 'f2b', 4 - walk * 8, 0, 22 - walk * 8, 0, { color: '#E08A3C', width: 4 });
  }
  ctx.translate(0, -bob - (sit ? -24 : 0));

  // 身体：圆胖的水滴形
  const by = -92;
  p.washEllipse(id + 'body', 0, by, 66, 62, C.white, { alpha: 1 });
  p.washEllipse(id + 'belly', 8, by + 14, 44, 40, '#FFF8EC', { alpha: 0.9, edge: false });
  p.ellipse(id + 'bodyo', 0, by, 132, 124, { width: 2.8 });
  // 尾巴
  p.poly(id + 'tail', [[-60, by + 6], [-86, by - 4], [-80, by + 20]], { width: 2.4 });
  // 翅膀（挥手时扬起）
  const wave = pose === 'wave' ? Math.sin(t * 7) * 0.5 + 0.9 : 0.15 + (sit ? 0 : Math.sin(t * 2) * 0.05);
  ctx.save();
  ctx.translate(-18, by - 4);
  ctx.rotate(-wave);
  p.washEllipse(id + 'wing', -14, 10, 30, 46, '#B8C2C8', { alpha: 0.95 });
  p.ellipse(id + 'wingo', -14, 10, 60, 92, { width: 2.4 });
  p.line(id + 'wtip', -20, 46, -10, 58, { width: 2.2, color: '#4A4A52' });
  ctx.restore();

  // 头
  const hx = 18, hy = by - 64;
  p.washEllipse(id + 'head', hx, hy, 40, 38, C.white, { alpha: 1 });
  p.ellipse(id + 'heado', hx, hy, 80, 76, { width: 2.8 });
  // 眼睛：每 3.2 秒眨一次
  const blink = (t + (accessory === 'hat' ? 1.1 : 0)) % 3.2 < 0.13;
  if (blink) p.line(id + 'eye', hx + 10, hy - 6, hx + 22, hy - 6, { width: 3 });
  else {
    ctx.save(); ctx.fillStyle = C.ink;
    ctx.beginPath(); ctx.arc(hx + 16, hy - 6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx + 17.5, hy - 8, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // 腮红
  ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#E79A8C';
  ctx.beginPath(); ctx.ellipse(hx + 8, hy + 12, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  // 喙
  const beak = [[hx + 34, hy + 2], [hx + 62, hy + 8], [hx + 34, hy + 16]];
  p.wash(id + 'beak', beak, '#F2B33D', { alpha: 1, spread: 1 });
  p.poly(id + 'beako', beak, { width: 2.2 });
  ctx.save(); ctx.fillStyle = '#D9534F'; ctx.beginPath(); ctx.arc(hx + 52, hy + 11, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();

  if (accessory === 'scarf') {
    const flap = Math.sin(t * 6) * 6;
    const band = [[hx - 30, hy + 26], [hx + 30, hy + 30], [hx + 28, hy + 46], [hx - 32, hy + 42]];
    p.wash(id + 'scarf', band, C.brick, { alpha: 1, spread: 2 });
    p.poly(id + 'scarfo', band, { width: 2.2 });
    const tail = [[hx - 26, hy + 36], [hx - 54, hy + 52 + flap], [hx - 62, hy + 74 + flap], [hx - 40, hy + 66], [hx - 18, hy + 44]];
    p.wash(id + 'scarft', tail, C.brick, { alpha: 1, spread: 2 });
    p.poly(id + 'scarfto', tail, { width: 2 });
  } else if (accessory === 'hat') {
    const felt = o.extra === 'felt';
    const hatColor = felt ? '#B5835A' : C.ginkgo;
    const dome = [];
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI + (i / 14) * Math.PI;
      dome.push([hx + Math.cos(a) * 40, hy - 18 + Math.sin(a) * 34]);
    }
    p.wash(id + 'hat', dome, hatColor, { alpha: 1, spread: 2 });
    p.poly(id + 'hato', dome, { width: 2.2 });
    p.washRect(id + 'hatb', hx - 42, hy - 26, 84, 14, felt ? '#8E5F3C' : C.amber, { alpha: 1, spread: 1 });
    p.rect(id + 'hatbo', hx - 42, hy - 26, 84, 14, { width: 2 });
    if (!felt) {
      p.washEllipse(id + 'pom', hx, hy - 58, 12, 12, C.brick, { alpha: 1 });
      p.circle(id + 'pomo', hx, hy - 58, 24, { width: 2 });
    } else {
      p.line(id + 'brim', hx - 54, hy - 18, hx + 54, hy - 18, { width: 3 });
    }
  }
  ctx.restore();

  if (o.extra === 'suitcase') {
    const sx = x + 70 * s * facing, sy = y;
    const pts = [[sx - 30 * s, sy - 70 * s], [sx + 30 * s, sy - 70 * s], [sx + 30 * s, sy - 4 * s], [sx - 30 * s, sy - 4 * s]];
    p.wash(id + 'case', pts, '#7FA7B5', { alpha: 1, spread: 2 });
    p.poly(id + 'caseo', pts, { width: 2.4 });
    p.line(id + 'handle', sx - 10 * s, sy - 70 * s, sx - 10 * s, sy - 100 * s, { width: 2.4 });
    p.line(id + 'handle2', sx - 10 * s, sy - 100 * s, sx + 10 * s, sy - 100 * s, { width: 2.4 });
    p.line(id + 'handle3', sx + 10 * s, sy - 100 * s, sx + 10 * s, sy - 70 * s, { width: 2.4 });
    // 贴纸
    p.washEllipse(id + 'st', sx + 8 * s, sy - 40 * s, 10 * s, 10 * s, C.ginkgo, { alpha: 1 });
  }
}

// 两只一起：他在左、她在右
export function couple(p, o) {
  const { x, y, s = 1, pose = 'stand', t = 0, gap = 150, poses } = o;
  gull(p, { id: 'he', x: x - gap / 2, y, s, accessory: 'scarf', pose: poses?.[0] ?? pose, t, facing: 1, extra: o.heExtra });
  gull(p, { id: 'she', x: x + gap / 2, y, s, accessory: 'hat', pose: poses?.[1] ?? pose, t: t + 0.37, facing: o.sheFacing ?? -1, extra: o.sheExtra });
}
