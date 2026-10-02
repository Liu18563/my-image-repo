// 手绘风地图：d3-geo 投影 + rough 描边 + 水彩填充，路线按进度生长
import { C, clamp, easeInOut, lerp } from './style.js';
import { W, H } from './scenes.js';
import { gull } from './characters.js';

const d3 = window.d3;
const topojson = window.topojson;

let cache = null;

export function initMap(world, places) {
  const countries = topojson.feature(world, world.objects.countries).features;
  const pts = Object.values(places).map((p) => [p.lon, p.lat]);
  const projection = d3.geoConicEqualArea().parallels([42, 60]).rotate([-76, 0]);
  projection.fitExtent([[90, 170], [W - 90, H - 120]], { type: 'MultiPoint', coordinates: pts });
  const path = d3.geoPath(projection);
  const pick = { 643: 'russia', 156: 'china', 496: 'mongolia' };
  const shapes = countries
    .map((f) => ({ id: String(f.id), name: f.properties.name, d: path(f), kind: pick[+f.id] ?? 'other' }))
    .filter((s) => s.d);
  cache = { projection, shapes, places };
}

const FILL = { russia: '#EAD7B4', china: '#E9C3B0', mongolia: '#D4DDB8', other: '#E6E1D3' };

export function drawMap(p, t, u, routeIds, o = {}) {
  const ctx = p.ctx;
  const { projection, shapes, places } = cache;
  // 海
  p.gradient(0, 0, W, H, '#CFE1E4', '#BCD5DA', 1);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  for (const s of shapes) {
    const path = new Path2D(s.d);
    ctx.fillStyle = FILL[s.kind];
    for (let l = 0; l < 3; l++) {
      ctx.save(); ctx.globalAlpha = 0.45; ctx.translate((l - 1) * 2.5, (l % 2) * 2); ctx.fill(path); ctx.restore();
    }
  }
  for (const s of shapes) {
    if (s.kind === 'other') { ctx.save(); ctx.strokeStyle = 'rgba(91,70,54,0.35)'; ctx.lineWidth = 1.4; ctx.stroke(new Path2D(s.d)); ctx.restore(); }
    else p.stroke('path', 'cty' + s.id, [s.d], { width: 2, roughness: 0.8, alpha: 0.7 });
  }
  ctx.restore();
  // 国名
  const lbl = (zh, lon, lat, size = 40, alpha = 0.55) => {
    const [x, y] = projection([lon, lat]);
    p.text(zh, x, y, size, { align: 'center', alpha, color: C.ink });
  };
  lbl('俄罗斯', 92, 63, 56);
  lbl('中国', 103, 35, 48);
  lbl('蒙古国', 103, 46.5, 34, 0.45);
  if (!o.overview) lbl('贝加尔湖', 108.5, 54.8, 24, 0.6);
  // 贝加尔湖本体（110m 数据里没有湖，手画一条）
  const lake = [[103.8, 51.6], [105.5, 51.6], [108, 52.6], [109.6, 54.4], [109.5, 55.7], [108.6, 55.5], [107.2, 53.4], [105, 52.2]].map((c) => projection(c));
  p.wash('baikal', lake, C.lakeDeep, { alpha: 0.9, spread: 1.5 });

  // 路线
  const pts = routeIds.map((id) => projection([places[id].lon, places[id].lat]));
  const segs = pts.length - 1;
  const prog = clamp(o.progress ?? u) * segs;
  ctx.save();
  ctx.lineCap = 'round';
  let head = pts[0];
  let headAngle = 0;
  for (let i = 0; i < segs; i++) {
    const k = clamp(prog - i);
    if (k <= 0) break;
    const [a, b] = [pts[i], pts[i + 1]];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const cx = mx + (dy / len) * len * 0.18, cy = my - (dx / len) * len * 0.18;
    const steps = 40;
    ctx.strokeStyle = C.brick; ctx.lineWidth = 5; ctx.setLineDash(o.trainSegs?.includes(i) ? [] : [14, 12]);
    ctx.beginPath();
    for (let s = 0; s <= steps * k; s++) {
      const q = s / steps;
      const x = (1 - q) ** 2 * a[0] + 2 * (1 - q) * q * cx + q * q * b[0];
      const y = (1 - q) ** 2 * a[1] + 2 * (1 - q) * q * cy + q * q * b[1];
      s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      if (s === Math.floor(steps * k)) {
        head = [x, y];
        const q2 = Math.min(1, q + 0.02);
        const x2 = (1 - q2) ** 2 * a[0] + 2 * (1 - q2) * q2 * cx + q2 * q2 * b[0];
        const y2 = (1 - q2) ** 2 * a[1] + 2 * (1 - q2) * q2 * cy + q2 * q2 * b[1];
        headAngle = Math.atan2(y2 - y, x2 - x) || headAngle;
      }
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
  // 返程虚线（只在总览里出现）
  if (o.returnRoute) {
    const rp = o.returnRoute.map((id) => projection([places[id].lon, places[id].lat]));
    ctx.save(); ctx.globalAlpha = clamp((u - 0.55) * 4) * 0.7; ctx.strokeStyle = C.lakeDeep; ctx.lineWidth = 3.5; ctx.setLineDash([4, 10]);
    ctx.beginPath(); rp.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + 18) : ctx.moveTo(x, y + 18))); ctx.stroke(); ctx.restore();
  }
  // 城市点
  routeIds.forEach((id, i) => {
    const [x, y] = pts[i];
    const shown = prog >= i - 0.05;
    if (!shown) return;
    const pop = clamp((prog - i + 0.3) * 3);
    p.washEllipse('dot' + id, x, y, 11 * pop, 11 * pop, i === 0 ? C.brick : C.white, { alpha: 1, spread: 1 });
    p.circle('doto' + id, x, y, 22 * pop, { width: 2.2 });
    const name = places[id].zh;
    const below = ['beijing', 'kazan', 'ulanude', 'qingdao', 'novosibirsk'].includes(id);
    const dx = { ulanude: 60, irkutsk: 10, qingdao: 40, novosibirsk: -10 }[id] ?? 0;
    p.text(name, x + dx, y + (below ? 46 : -22), 32, { align: 'center', alpha: pop });
  });
  // 路线头部：小飞机
  if (o.plane && prog < segs) {
    ctx.save(); ctx.translate(head[0], head[1]); ctx.rotate(headAngle);
    ctx.fillStyle = C.white; ctx.strokeStyle = C.ink; ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(26, 0); ctx.lineTo(4, -5); ctx.lineTo(-6, -24); ctx.lineTo(-12, -24); ctx.lineTo(-6, -5); ctx.lineTo(-20, -4);
    ctx.lineTo(-26, -12); ctx.lineTo(-30, -12); ctx.lineTo(-27, 0); ctx.lineTo(-30, 12); ctx.lineTo(-26, 12); ctx.lineTo(-20, 4);
    ctx.lineTo(-6, 5); ctx.lineTo(-12, 24); ctx.lineTo(-6, 24); ctx.lineTo(4, 5); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
  }
  // 罗盘
  p.circle('compass', W - 90, 110, 70, { width: 2 });
  p.line('cn', W - 90, 140, W - 90, 80, { width: 2.4 });
  p.text('N', W - 90, 70, 28, { align: 'center' });

  if (o.couple) {
    const [qx, qy] = pts[0];
    gull(p, { id: 'mhe', x: qx - 40, y: qy + 150, s: 0.55, accessory: 'scarf', pose: 'wave', t });
    gull(p, { id: 'mshe', x: qx + 40, y: qy + 150, s: 0.55, accessory: 'hat', pose: 'wave', t: t + 0.4, facing: -1 });
  }
}
