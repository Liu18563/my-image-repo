// 画风工具：纸纹、水彩晕染、手绘描边。所有随机都走带种子的 PRNG，保证逐帧确定性。
export const C = {
  paper: '#F4EBDD',
  paperDark: '#E8DCC6',
  ink: '#5B4636',
  inkSoft: 'rgba(91,70,54,0.55)',
  lake: '#7FA7B5',
  lakeDeep: '#5E8C9E',
  moss: '#9CAF88',
  mossDeep: '#7D9470',
  ginkgo: '#E6B655',
  amber: '#D9963F',
  brick: '#C8664B',
  snow: '#FAF7F0',
  sky: '#D7E6E6',
  skyWarm: '#F2DCC0',
  stone: '#B9B2A6',
  night: '#3E4A6B',
  mint: '#A8CBB7',
  gold: '#D8A93A',
  turquoise: '#5FA8A0',
  white: '#FFFDF8',
};

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = (t) => 1 - (1 - clamp(t)) ** 3;
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; };
export const easeOutBack = (t) => { t = clamp(t); const c = 1.4; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };

export const FONT = "'LXGW WenKai', 'Caveat', serif";

// 纸纹：一次生成，之后每帧直接贴
export function makePaper(w, h) {
  const cv = new OffscreenCanvas(w, h);
  const g = cv.getContext('2d');
  const r = mulberry32(7);
  g.fillStyle = C.paper;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26000; i++) {
    const x = r() * w, y = r() * h, s = r() * 1.6 + 0.3;
    g.fillStyle = r() < 0.5 ? 'rgba(120,95,70,0.05)' : 'rgba(255,255,255,0.10)';
    g.fillRect(x, y, s, s);
  }
  g.strokeStyle = 'rgba(140,110,80,0.06)';
  g.lineWidth = 0.8;
  for (let i = 0; i < 900; i++) {
    const x = r() * w, y = r() * h, a = r() * Math.PI, l = 6 + r() * 22;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + r() * 4, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // 大块的晕斑
  for (let i = 0; i < 40; i++) {
    const x = r() * w, y = r() * h, rad = 60 + r() * 220;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, 'rgba(200,170,130,0.05)');
    gr.addColorStop(1, 'rgba(200,170,130,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  return cv;
}

// Painter：包住 ctx + rough，按 (形状 id, 帧) 决定种子
export class Painter {
  constructor(ctx, rough, frame) {
    this.ctx = ctx;
    this.rc = rough.canvas(ctx.canvas);
    this.frame = frame;
    this.boil = Math.floor(frame / 6); // 线条轻微"手绘抖动"，约 5 次/秒
  }
  seed(id) { return (hash(id) % 100000) + this.boil * 7 + 1; }
  staticSeed(id) { return (hash(id) % 100000) + 1; }

  // 手绘描边（rough 只画线，不填充）
  stroke(kind, id, args, o = {}) {
    const opt = {
      seed: o.still ? this.staticSeed(id) : this.seed(id),
      roughness: o.roughness ?? 1.1,
      bowing: o.bowing ?? 1.4,
      stroke: o.color ?? C.ink,
      strokeWidth: o.width ?? 2.6,
      disableMultiStroke: o.single ?? false,
    };
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 0.9;
    this.rc[kind](...args, opt);
    ctx.restore();
  }
  line(id, x1, y1, x2, y2, o) { this.stroke('line', id, [x1, y1, x2, y2], o); }
  poly(id, pts, o) { this.stroke('polygon', id, [pts], o); }
  curve(id, pts, o) { this.stroke('curve', id, [pts], o); }
  ellipse(id, x, y, w, h, o) { this.stroke('ellipse', id, [x, y, w, h], o); }
  circle(id, x, y, d, o) { this.stroke('circle', id, [x, y, d], o); }
  rect(id, x, y, w, h, o) { this.stroke('rectangle', id, [x, y, w, h], o); }

  // 水彩填充：多层轻微错位的半透明多边形叠加，边缘略深
  wash(id, pts, color, o = {}) {
    const ctx = this.ctx;
    const r = mulberry32(this.staticSeed(id));
    const layers = o.layers ?? 4;
    const spread = o.spread ?? 5;
    ctx.save();
    ctx.fillStyle = color;
    for (let l = 0; l < layers; l++) {
      ctx.globalAlpha = (o.alpha ?? 0.85) / layers * (l === 0 ? 1.3 : 1);
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        const jx = (r() - 0.5) * spread * 2, jy = (r() - 0.5) * spread * 2;
        i ? ctx.lineTo(x + jx, y + jy) : ctx.moveTo(x + jx, y + jy);
      });
      ctx.closePath();
      ctx.fill();
    }
    if (o.edge !== false) {
      ctx.globalAlpha = o.edgeAlpha ?? 0.18;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.filter = 'brightness(0.8)';
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }
  washEllipse(id, cx, cy, rx, ry, color, o = {}) {
    const n = o.segments ?? 36;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    this.wash(id, pts, color, { spread: Math.min(rx, ry) * 0.06 + 1.5, ...o });
  }
  washRect(id, x, y, w, h, color, o) {
    this.wash(id, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], color, o);
  }
  // 竖向渐变的天空/水面
  gradient(x, y, w, h, top, bottom, alpha = 1) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.restore();
  }
  text(str, x, y, size, o = {}) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `${o.weight ?? 400} ${size}px ${FONT}`;
    ctx.fillStyle = o.color ?? C.ink;
    ctx.textAlign = o.align ?? 'left';
    ctx.textBaseline = o.baseline ?? 'alphabetic';
    ctx.globalAlpha *= o.alpha ?? 1;
    if (o.rotate) { ctx.translate(x, y); ctx.rotate(o.rotate); ctx.fillText(str, 0, 0); }
    else ctx.fillText(str, x, y);
    ctx.restore();
  }
}

// ——— 常用小元素 ———

export function cloud(p, id, x, y, s, alpha = 1) {
  const ctx = p.ctx;
  ctx.save(); ctx.globalAlpha *= alpha;
  p.washEllipse(id + 'a', x, y, 70 * s, 26 * s, C.white, { alpha: 0.9 });
  p.washEllipse(id + 'b', x - 40 * s, y + 6 * s, 40 * s, 20 * s, C.white, { alpha: 0.9 });
  p.washEllipse(id + 'c', x + 34 * s, y - 12 * s, 44 * s, 26 * s, C.white, { alpha: 0.9 });
  p.curve(id + 'o', [[x - 78 * s, y + 18 * s], [x - 70 * s, y - 6 * s], [x - 30 * s, y - 22 * s], [x + 10 * s, y - 36 * s], [x + 70 * s, y - 20 * s], [x + 80 * s, y + 14 * s]], { width: 1.6, alpha: 0.35 });
  ctx.restore();
}

export function birch(p, id, x, y, h, leafColor = C.ginkgo, sway = 0) {
  p.washRect(id + 't', x - 7, y - h, 14, h, C.white, { alpha: 1, spread: 1 });
  p.line(id + 'l1', x - 7, y, x - 7 + sway * 0.3, y - h, { width: 2 });
  p.line(id + 'l2', x + 7, y, x + 7 + sway * 0.3, y - h, { width: 2 });
  const r = mulberry32(hash(id));
  for (let i = 0; i < 6; i++) {
    const yy = y - h * (0.15 + r() * 0.75);
    p.line(id + 'm' + i, x - 6, yy, x - 6 + 6 + r() * 5, yy + 1, { width: 2.4, single: true });
  }
  const cy = y - h - 10;
  p.washEllipse(id + 'c1', x + sway, cy, 46, 64, leafColor, { alpha: 0.75 });
  p.washEllipse(id + 'c2', x - 26 + sway, cy + 40, 34, 40, leafColor, { alpha: 0.7 });
  p.washEllipse(id + 'c3', x + 28 + sway, cy + 34, 32, 40, C.amber, { alpha: 0.5 });
}

export function pine(p, id, x, y, h, color = C.mossDeep) {
  const pts = [[x, y - h], [x + h * 0.28, y - h * 0.35], [x + h * 0.14, y - h * 0.38], [x + h * 0.34, y], [x - h * 0.34, y], [x - h * 0.14, y - h * 0.38], [x - h * 0.28, y - h * 0.35]];
  p.wash(id, pts, color, { alpha: 0.8 });
  p.poly(id + 'o', pts, { width: 1.8, alpha: 0.6 });
}

// 飘落的银杏叶（位置只由时间和序号决定）
export function leaves(p, id, w, h, t, count = 14, color = C.ginkgo) {
  const r = mulberry32(hash(id));
  const ctx = p.ctx;
  for (let i = 0; i < count; i++) {
    const x0 = r() * w, speed = 60 + r() * 70, phase = r() * 10, size = 9 + r() * 8;
    const y = ((t * speed + phase * 97) % (h + 80)) - 40;
    const x = x0 + Math.sin(t * 1.3 + phase) * 30;
    const rot = t * (r() - 0.5) * 3 + phase;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.globalAlpha *= 0.85;
    ctx.fillStyle = r() < 0.35 ? C.amber : color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, size, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, size * 0.5); ctx.stroke();
    ctx.restore();
  }
}

export function waves(p, id, x, y, w, rows, t, color = C.white, gap = 34) {
  for (let j = 0; j < rows; j++) {
    const yy = y + j * gap;
    const off = ((t * 18 + j * 37) % 120);
    for (let k = -1; k < w / 120 + 1; k++) {
      const xx = x + k * 120 + off - (j % 2) * 60;
      if (xx < x - 40 || xx > x + w) continue;
      p.curve(`${id}${j}_${k}`, [[xx, yy], [xx + 14, yy - 6], [xx + 28, yy], [xx + 42, yy - 5]], { width: 1.8, color, alpha: 0.7, single: true, still: true });
    }
  }
}
