// 每个场景的插画。坐标系：画框内 W×H（960×1040），t = 本镜已过秒数，u = 本镜进度 0..1
import { C, cloud, birch, pine, leaves, waves, mulberry32, hash, easeOut, easeInOut, lerp, clamp } from './style.js';
import { couple, gull } from './characters.js';

export const W = 960, H = 1040;

function sky(p, top = C.sky, bottom = C.skyWarm, h = H) {
  p.gradient(0, 0, W, h, top, bottom, 0.85);
}

function hills(p, id, baseY, color, amp, alpha = 0.8, seed = 0) {
  const r = mulberry32(hash(id) + seed);
  const pts = [[0, H], [0, baseY]];
  for (let x = 0; x <= W; x += 80) pts.push([x, baseY - amp * (0.4 + r() * 0.6)]);
  pts.push([W, baseY], [W, H]);
  p.wash(id, pts, color, { alpha });
  p.curve(id + 'o', pts.slice(1, -1), { width: 1.8, alpha: 0.5 });
}

function gullsFlying(p, id, t, n = 3, y0 = 160) {
  for (let i = 0; i < n; i++) {
    const x = ((t * (40 + i * 12) + i * 260) % (W + 200)) - 100;
    const y = y0 + i * 46 + Math.sin(t * 2 + i) * 10;
    const f = Math.sin(t * 6 + i) * 8;
    p.curve(`${id}${i}`, [[x - 22, y - f], [x - 10, y - 4], [x, y + 2], [x + 10, y - 4], [x + 22, y - f]], { width: 2.4, single: true });
  }
}

// ① 青岛栈桥 · 回澜阁
export function qingdao(p, t, u) {
  sky(p, '#CFE3E8', '#F6DEC4', 560);
  p.washEllipse('sun', 760, 190, 70, 70, '#F3C77A', { alpha: 0.75 });
  cloud(p, 'c1', 230 + t * 6, 170, 1.1);
  cloud(p, 'c2', 640 + t * 4, 300, 0.8, 0.8);
  hills(p, 'qdh', 520, '#A9B9B2', 60, 0.6);
  // 海
  p.gradient(0, 500, W, H - 500, '#8DB5C2', '#6E9AAC', 0.9);
  waves(p, 'sea', 0, 560, W, 8, t, C.white, 44);
  // 栈桥：从左下延伸到回澜阁
  const deck = [[-40, 940], [80, 1000], [700, 560], [660, 548]];
  p.wash('deck', deck, '#D9CBB2', { alpha: 1 });
  p.poly('decko', deck, { width: 2.4 });
  for (let i = 0; i < 9; i++) {
    const k = i / 9;
    const x1 = lerp(-40, 660, k), y1 = lerp(940, 548, k);
    p.line('rail' + i, x1, y1, x1, y1 - 30 * (1 - k * 0.7), { width: 2 });
  }
  p.line('railtop', -40, 910, 660, 538, { width: 2 });
  // 回澜阁：两重黄琉璃顶 + 红柱
  const ax = 690, ay = 548;
  p.washRect('gbase', ax - 70, ay - 14, 140, 18, C.stone, { alpha: 1 });
  for (let i = 0; i < 5; i++) p.washRect('pillar' + i, ax - 56 + i * 28, ay - 70, 8, 58, C.brick, { alpha: 1, spread: 1 });
  const roof1 = [[ax - 92, ay - 66], [ax + 92, ay - 66], [ax + 56, ay - 104], [ax - 56, ay - 104]];
  p.wash('roof1', roof1, C.ginkgo, { alpha: 1 });
  p.poly('roof1o', roof1, { width: 2.2 });
  p.washRect('upper', ax - 40, ay - 136, 80, 34, C.brick, { alpha: 1, spread: 1 });
  const roof2 = [[ax - 66, ay - 132], [ax + 66, ay - 132], [ax + 10, ay - 172], [ax - 10, ay - 172]];
  p.wash('roof2', roof2, C.ginkgo, { alpha: 1 });
  p.poly('roof2o', roof2, { width: 2.2 });
  p.line('spire', ax, ay - 172, ax, ay - 194, { width: 2.4 });
  gullsFlying(p, 'wg', t, 3, 250);
  // 主角：拖着行李箱沿栈桥出发
  const k = easeInOut(u * 0.8);
  couple(p, { x: lerp(260, 420, k), y: lerp(880, 790, k), s: 1.05, pose: 'walk', t, gap: 160, sheFacing: 1, heExtra: undefined, sheExtra: 'suitcase' });
}

// ③ 贝加尔湖
export function baikal(p, t, u) {
  sky(p, '#D5E7EC', '#EFE4CF', 520);
  cloud(p, 'bc1', 200 + t * 5, 140, 1);
  cloud(p, 'bc2', 700 + t * 3, 220, 0.7, 0.8);
  hills(p, 'bfar', 420, '#9FB3C4', 120, 0.65);
  hills(p, 'bmid', 470, '#8AA3A0', 80, 0.7, 3);
  p.gradient(0, 460, W, 420, '#88BCC6', '#5D97A6', 0.95);
  waves(p, 'bw', 0, 500, W, 4, t, C.white, 40);
  // 清澈见底：浅水区的卵石
  const r = mulberry32(42);
  for (let i = 0; i < 26; i++) {
    const x = r() * W, y = 700 + r() * 150;
    p.washEllipse('peb' + i, x, y, 14 + r() * 24, 8 + r() * 10, i % 3 ? '#B8B09F' : '#9AA79F', { alpha: 0.45, edge: false });
  }
  // 粼光
  for (let i = 0; i < 12; i++) {
    const x = (i * 83 + t * 20) % W, y = 560 + (i % 4) * 36, a = 0.3 + 0.3 * Math.sin(t * 3 + i);
    p.ctx.save(); p.ctx.globalAlpha = a; p.ctx.fillStyle = '#fff'; p.ctx.fillRect(x, y, 26, 3); p.ctx.restore();
  }
  // 岸边
  const shore = [[0, 860], [200, 830], [420, 870], [700, 840], [W, 860], [W, H], [0, H]];
  p.wash('shore', shore, '#C9B79A', { alpha: 1 });
  p.curve('shoreo', shore.slice(0, 5), { width: 2.2 });
  birch(p, 'bb1', 90, 900, 330, C.ginkgo, Math.sin(t * 1.2) * 4);
  birch(p, 'bb2', 860, 920, 280, C.amber, Math.sin(t * 1.1 + 1) * 4);
  // 石头 + 坐着的小海鸥
  const rock = [[380, 960], [420, 890], [560, 880], [640, 930], [640, 980], [380, 990]];
  p.wash('rock', rock, C.stone, { alpha: 1 });
  p.poly('rocko', rock, { width: 2.4 });
  couple(p, { x: 510, y: 900, s: 0.85, pose: 'sit', t, gap: 120, sheFacing: 1 });
  leaves(p, 'bl', W, H, t, 8);
}

// ④ 沿湖火车
export function train(p, t, u) {
  sky(p, '#DCE8E4', '#F3DFC2', 500);
  cloud(p, 'tc1', 300 - t * 10, 150, 1);
  hills(p, 'tfar', 380, '#A5B7C2', 100, 0.6);
  p.gradient(0, 380, W, 250, '#8DBEC8', '#6EA0AE', 0.9);
  waves(p, 'tw', 0, 420, W, 4, t, C.white, 44);
  // 路基
  p.washRect('bank', 0, 620, W, 120, '#C7B593', { alpha: 1 });
  p.line('track1', 0, 700, W, 700, { width: 3, still: true });
  for (let i = 0; i < 20; i++) p.line('sleeper' + i, i * 50 + ((-t * 200) % 50), 692, i * 50 + 14 + ((-t * 200) % 50), 708, { width: 2, still: true, single: true });
  // 火车：车厢静止在画面中，背景向后移动（视差）
  const tx = lerp(-80, 120, easeOut(u * 2));
  const bounce = Math.sin(t * 18) * 1.5;
  const carW = 300;
  for (let c = 0; c < 3; c++) {
    const x0 = tx + c * (carW + 16);
    const y0 = 560 + bounce;
    const col = c === 2 ? C.brick : '#6F8F7A';
    const body = [[x0, y0], [x0 + carW, y0], [x0 + carW, y0 + 120], [x0, y0 + 120]];
    if (c === 2) { body[1] = [x0 + carW - 40, y0]; body[2] = [x0 + carW + 20, y0 + 120]; }
    p.wash('car' + c, body, col, { alpha: 1, spread: 2 });
    p.poly('caro' + c, body, { width: 2.6 });
    p.washRect('stripe' + c, x0, y0 + 84, c === 2 ? carW + 10 : carW, 10, C.snow, { alpha: 0.9, spread: 1 });
    for (let w = 0; w < (c === 2 ? 2 : 4); w++) {
      p.washRect(`win${c}_${w}`, x0 + 24 + w * 68, y0 + 22, 46, 40, '#F5EAD0', { alpha: 1, spread: 1 });
      p.rect(`wino${c}_${w}`, x0 + 24 + w * 68, y0 + 22, 46, 40, { width: 2 });
    }
    p.circle('wh1' + c, x0 + 60, y0 + 128, 34, { width: 2.4 });
    p.circle('wh2' + c, x0 + carW - 60, y0 + 128, 34, { width: 2.4 });
  }
  // 窗口里的两颗小脑袋（第二节车厢）
  const wx = tx + carW + 16 + 24 + 68;
  p.ctx.save();
  p.ctx.beginPath(); p.ctx.rect(wx, 582 + bounce, 46 * 2 + 22, 40); p.ctx.clip();
  gull(p, { id: 'whe', x: wx + 20, y: 700 + bounce, s: 0.42, accessory: 'scarf', t, facing: -1 });
  gull(p, { id: 'wshe', x: wx + 90, y: 700 + bounce, s: 0.42, accessory: 'hat', t: t + 0.4, facing: -1 });
  p.ctx.restore();
  // 车头烟
  for (let i = 0; i < 4; i++) {
    const k = ((t * 0.8 + i * 0.25) % 1);
    p.washEllipse('smoke' + i, tx + 2 * (carW + 16) + carW - 20 - k * 160, 530 - k * 120, 20 + k * 40, 14 + k * 26, C.white, { alpha: 0.6 * (1 - k) });
  }
  // 前景白桦，向左快速掠过
  p.washRect('ground', 0, 740, W, 300, '#BFA97D', { alpha: 0.9 });
  for (let i = 0; i < 5; i++) {
    const x = ((i * 260 - t * 260) % 1300 + 1300) % 1300 - 160;
    birch(p, 'fb' + i, x, 1060, 170 + (i % 2) * 40, i % 2 ? C.amber : C.ginkgo);
  }
}

// ⑤ 伊沃尔金斯克寺 + 草原
export function datsan(p, t, u) {
  sky(p, '#D4E5EE', '#F4E2C6', 600);
  cloud(p, 'dc1', 220 + t * 6, 140, 1.1);
  cloud(p, 'dc2', 760 + t * 3, 230, 0.8);
  hills(p, 'dfar', 520, '#B4C2A6', 70, 0.7);
  p.washRect('steppe', 0, 560, W, H - 560, '#D6C48C', { alpha: 1 });
  for (let i = 0; i < 40; i++) {
    const r = mulberry32(900 + i);
    const x = r() * W, y = 600 + r() * 400;
    p.line('grass' + i, x, y, x + 4 + Math.sin(t * 2 + i) * 3, y - 14, { width: 1.6, color: C.mossDeep, alpha: 0.6, single: true, still: true });
  }
  // 寺院主殿
  const cx = 470, base = 600;
  p.washRect('dbase', cx - 200, base - 20, 400, 30, C.snow, { alpha: 1 });
  p.rect('dbaseo', cx - 200, base - 20, 400, 30, { width: 2.2 });
  p.washRect('dhall', cx - 160, base - 150, 320, 130, C.white, { alpha: 1 });
  p.rect('dhallo', cx - 160, base - 150, 320, 130, { width: 2.4 });
  for (let i = 0; i < 6; i++) p.washRect('dcol' + i, cx - 140 + i * 54, base - 140, 12, 120, '#B5463A', { alpha: 1, spread: 1 });
  p.washRect('ddoor', cx - 30, base - 90, 60, 70, '#8E3A2F', { alpha: 1, spread: 1 });
  const roofA = [[cx - 210, base - 150], [cx + 210, base - 150], [cx + 230, base - 168], [cx + 140, base - 200], [cx - 140, base - 200], [cx - 230, base - 168]];
  p.wash('droof1', roofA, C.gold, { alpha: 1 });
  p.poly('droof1o', roofA, { width: 2.4 });
  p.washRect('dupper', cx - 100, base - 270, 200, 72, C.white, { alpha: 1 });
  p.rect('dupo', cx - 100, base - 270, 200, 72, { width: 2.2 });
  const roofB = [[cx - 140, base - 268], [cx + 140, base - 268], [cx + 156, base - 284], [cx + 70, base - 320], [cx - 70, base - 320], [cx - 156, base - 284]];
  p.wash('droof2', roofB, C.gold, { alpha: 1 });
  p.poly('droof2o', roofB, { width: 2.4 });
  p.washEllipse('dfinial', cx, base - 340, 12, 20, C.gold, { alpha: 1 });
  p.line('dfin', cx, base - 360, cx, base - 320, { width: 2.4 });
  // 白塔（舍利塔）
  for (const [sx, k] of [[150, 1], [800, 0.85]]) {
    const b = base + 10;
    p.washRect('sb' + sx, sx - 40 * k, b - 40 * k, 80 * k, 40 * k, C.snow, { alpha: 1 });
    p.washEllipse('sd' + sx, sx, b - 70 * k, 34 * k, 34 * k, C.snow, { alpha: 1 });
    p.ellipse('sdo' + sx, sx, b - 70 * k, 68 * k, 68 * k, { width: 2.2 });
    p.rect('sbo' + sx, sx - 40 * k, b - 40 * k, 80 * k, 40 * k, { width: 2.2 });
    p.line('ss' + sx, sx, b - 104 * k, sx, b - 150 * k, { width: 3, color: C.gold });
  }
  // 经幡
  const flags = ['#5B8DB8', '#F3F0E6', '#C8664B', '#7DAA6E', '#E6B655'];
  p.curve('fline', [[60, 330], [300, 380], [560, 360], [900, 320]], { width: 1.6 });
  for (let i = 0; i < 18; i++) {
    const k = i / 17;
    const x = lerp(80, 880, k), y = 340 + Math.sin(k * Math.PI) * 30 + Math.sin(t * 4 + i) * 2;
    p.washRect('flag' + i, x, y, 24, 30 + Math.sin(t * 5 + i) * 4, flags[i % 5], { alpha: 0.9, spread: 1, edge: false });
  }
  // 蒙古包
  p.washEllipse('ger', 840, 760, 70, 40, C.snow, { alpha: 1 });
  p.washRect('gerw', 770, 760, 140, 50, C.snow, { alpha: 1 });
  p.rect('gerwo', 770, 760, 140, 50, { width: 2.2 });
  p.curve('gerr', [[770, 760], [800, 730], [840, 720], [880, 730], [910, 760]], { width: 2.2 });
  p.washRect('gerd', 826, 772, 28, 38, '#C8664B', { alpha: 1, spread: 1 });
  couple(p, { x: 380, y: 920, s: 0.95, pose: 'wave', t, gap: 160, sheExtra: 'felt' });
}

// ⑥ 欧亚分界
export function border(p, t, u) {
  sky(p, '#D7E5E4', '#F0E0C8', 600);
  cloud(p, 'ec1', 240 + t * 5, 160, 1);
  for (let i = 0; i < 9; i++) pine(p, 'ep' + i, 30 + i * 112, 600 + (i % 2) * 20, 220 + (i % 3) * 40);
  for (let i = 0; i < 4; i++) birch(p, 'eb' + i, 110 + i * 240, 640, 240, i % 2 ? C.amber : C.ginkgo, Math.sin(t + i) * 3);
  p.washRect('eground', 0, 640, W, H - 640, '#CDBE9B', { alpha: 1 });
  // 欧亚分界线
  const lx = W / 2;
  p.wash('eline', [[lx - 8, 640], [lx + 8, 640], [lx + 22, H], [lx - 22, H]], C.white, { alpha: 1, spread: 1 });
  p.line('elo1', lx - 8, 640, lx - 22, H, { width: 2 });
  p.line('elo2', lx + 8, 640, lx + 22, H, { width: 2 });
  // 方尖碑
  const ob = [[lx - 34, 640], [lx + 34, 640], [lx + 20, 360], [lx, 320], [lx - 20, 360]];
  p.wash('obelisk', ob, '#9C9A95', { alpha: 1 });
  p.poly('obo', ob, { width: 2.6 });
  p.washRect('obb', lx - 60, 620, 120, 30, '#8A8680', { alpha: 1 });
  p.rect('obbo', lx - 60, 620, 120, 30, { width: 2.2 });
  p.text('ЕВРОПА', 200, 760, 52, { align: 'center', rotate: -0.04 });
  p.text('欧洲', 200, 820, 40, { align: 'center' });
  p.text('АЗИЯ', 760, 760, 52, { align: 'center', rotate: 0.04 });
  p.text('亚洲', 760, 820, 40, { align: 'center' });
  // 他左脚欧洲右脚亚洲，她也是
  const hop = Math.max(0, Math.sin(t * 3.2)) * 18 * (u > 0.45 ? 1 : 0);
  couple(p, { x: lx, y: 960 - hop, s: 0.95, pose: 'stand', t, gap: 120, sheFacing: 1, poses: ['wave', 'stand'] });
  leaves(p, 'el', W, H, t, 6);
}

// ⑦ 喀山克里姆林
export function kazan(p, t, u) {
  sky(p, '#D2E4EE', '#F3E3CC', 640);
  cloud(p, 'kc1', 200 + t * 5, 140, 1);
  cloud(p, 'kc2', 760 + t * 3, 220, 0.8);
  // 库尔·沙里夫清真寺（中央蓝顶 + 四座尖塔）
  const mx = 560, mb = 560;
  p.washRect('mbody', mx - 120, mb - 160, 240, 160, C.white, { alpha: 1 });
  p.rect('mbodyo', mx - 120, mb - 160, 240, 160, { width: 2.4 });
  for (let i = 0; i < 4; i++) {
    p.washRect('march' + i, mx - 100 + i * 52, mb - 120, 30, 70, '#A3C8D2', { alpha: 0.9, spread: 1 });
  }
  const dome = [];
  for (let i = 0; i <= 18; i++) { const a = Math.PI + (i / 18) * Math.PI; dome.push([mx + Math.cos(a) * 110, mb - 160 + Math.sin(a) * 120]); }
  p.wash('mdome', dome, C.turquoise, { alpha: 1 });
  p.poly('mdomeo', dome, { width: 2.4 });
  p.line('mspire', mx, mb - 280, mx, mb - 330, { width: 3, color: C.gold });
  for (const [dx, h] of [[-150, 380], [150, 380], [-200, 320], [200, 320]]) {
    const x = mx + dx;
    p.washRect('mn' + dx, x - 12, mb - h, 24, h, C.white, { alpha: 1, spread: 1 });
    p.rect('mno' + dx, x - 12, mb - h, 24, h, { width: 2 });
    const tip = [[x - 16, mb - h], [x + 16, mb - h], [x, mb - h - 70]];
    p.wash('mt' + dx, tip, C.turquoise, { alpha: 1, spread: 1 });
    p.poly('mto' + dx, tip, { width: 2 });
  }
  // 报喜大教堂（左侧，蓝顶金星洋葱）
  const cx2 = 210;
  p.washRect('cbody', cx2 - 80, mb - 150, 160, 150, C.white, { alpha: 1 });
  p.rect('cbodyo', cx2 - 80, mb - 150, 160, 150, { width: 2.4 });
  for (const [dx, s] of [[0, 1], [-50, 0.6], [50, 0.6]]) {
    const ox = cx2 + dx, oy = mb - 150 - (s === 1 ? 40 : 10);
    const on = [[ox - 30 * s, oy], [ox - 34 * s, oy - 40 * s], [ox, oy - 90 * s], [ox + 34 * s, oy - 40 * s], [ox + 30 * s, oy]];
    p.washRect('cdr' + dx, ox - 22 * s, oy, 44 * s, s === 1 ? 40 : 10, C.white, { alpha: 1, spread: 1 });
    p.wash('con' + dx, on, '#4E79A7', { alpha: 1 });
    p.poly('cono' + dx, on, { width: 2.2 });
    p.line('ccross' + dx, ox, oy - 90 * s, ox, oy - 120 * s, { width: 2.4, color: C.gold });
  }
  // 白色城墙 + 塔楼
  p.washRect('wall', 0, 560, W, 120, C.white, { alpha: 1 });
  p.line('walltop', 0, 560, W, 560, { width: 2.4 });
  for (let i = 0; i < 24; i++) p.rect('cren' + i, i * 40 + 6, 540, 24, 20, { width: 1.8, still: true });
  for (const x of [60, 880]) {
    p.washRect('tw' + x, x - 46, 470, 92, 210, C.white, { alpha: 1 });
    p.rect('two' + x, x - 46, 470, 92, 210, { width: 2.4 });
    const tr = [[x - 56, 470], [x + 56, 470], [x, 380]];
    p.wash('twr' + x, tr, '#6E9E7E', { alpha: 1 });
    p.poly('twro' + x, tr, { width: 2.4 });
  }
  // 卡赞卡河
  p.gradient(0, 680, W, H - 680, '#8EB6C0', '#6B98A8', 0.95);
  waves(p, 'kw', 0, 720, W, 7, t, C.white, 44);
  couple(p, { x: 480, y: 1010, s: 0.8, pose: 'stand', t, gap: 130, sheFacing: -1 });
}

// ⑧ 红场夜景
export function moscow(p, t, u) {
  p.gradient(0, 0, W, 700, '#2E3A5C', '#5B5F86', 1);
  const r = mulberry32(77);
  for (let i = 0; i < 40; i++) {
    const x = r() * W, y = r() * 380, a = 0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i));
    p.ctx.save(); p.ctx.globalAlpha = a; p.ctx.fillStyle = '#FFF4D6';
    p.ctx.beginPath(); p.ctx.arc(x, y, 1.5 + r() * 2, 0, Math.PI * 2); p.ctx.fill(); p.ctx.restore();
  }
  p.washEllipse('moon', 820, 130, 46, 46, '#F7E7B5', { alpha: 0.95 });
  // 圣瓦西里：红砖底座 + 九个彩色洋葱顶
  const bx = 480, bb = 640;
  p.washRect('sbbase', bx - 260, bb - 150, 520, 150, '#B4573F', { alpha: 1 });
  p.rect('sbbaseo', bx - 260, bb - 150, 520, 150, { width: 2.4, color: '#2B2230' });
  for (let i = 0; i < 7; i++) {
    p.washRect('sbw' + i, bx - 230 + i * 70, bb - 110, 26, 46, '#F7D488', { alpha: 0.9 + 0.1 * Math.sin(t * 3 + i), spread: 1 });
  }
  const domes = [
    { dx: 0, h: 330, w: 52, c: ['#D9A441', '#5E8C61'] },
    { dx: -150, h: 230, w: 60, c: ['#C8664B', '#F3EBDD'] },
    { dx: 150, h: 230, w: 60, c: ['#3F7CAC', '#F3EBDD'] },
    { dx: -230, h: 180, w: 46, c: ['#5E8C61', '#E6B655'] },
    { dx: 230, h: 180, w: 46, c: ['#E6B655', '#C8664B'] },
    { dx: -80, h: 270, w: 50, c: ['#7FA7B5', '#C8664B'] },
    { dx: 80, h: 270, w: 50, c: ['#C8664B', '#5E8C61'] },
  ];
  for (const d of domes) {
    const x = bx + d.dx, drumTop = bb - d.h;
    if (d.dx === 0) {
      const spire = [[x - 40, bb - 150], [x + 40, bb - 150], [x + 16, drumTop], [x - 16, drumTop]];
      p.wash('spire', spire, '#C9B79A', { alpha: 1 });
      p.poly('spireo', spire, { width: 2.2, color: '#2B2230' });
    } else {
      p.washRect('drum' + d.dx, x - d.w * 0.45, drumTop, d.w * 0.9, bb - 150 - drumTop, '#D7B98C', { alpha: 1, spread: 1 });
      p.rect('drumo' + d.dx, x - d.w * 0.45, drumTop, d.w * 0.9, bb - 150 - drumTop, { width: 2, color: '#2B2230' });
    }
    const w = d.w, y = drumTop;
    const onion = [[x - w * 0.5, y], [x - w * 0.62, y - w * 0.5], [x - w * 0.3, y - w * 1.0], [x, y - w * 1.35], [x + w * 0.3, y - w * 1.0], [x + w * 0.62, y - w * 0.5], [x + w * 0.5, y]];
    p.wash('on' + d.dx, onion, d.c[0], { alpha: 1 });
    // 条纹
    p.ctx.save();
    p.ctx.beginPath(); onion.forEach(([a, b], i) => (i ? p.ctx.lineTo(a, b) : p.ctx.moveTo(a, b))); p.ctx.closePath(); p.ctx.clip();
    for (let s = -3; s <= 3; s++) {
      p.ctx.strokeStyle = d.c[1]; p.ctx.globalAlpha = 0.85; p.ctx.lineWidth = w * 0.12;
      p.ctx.beginPath(); p.ctx.moveTo(x + s * w * 0.3 - w * 0.4, y); p.ctx.quadraticCurveTo(x + s * w * 0.2, y - w * 0.7, x, y - w * 1.35); p.ctx.stroke();
    }
    p.ctx.restore();
    p.poly('ono' + d.dx, onion, { width: 2.2, color: '#2B2230' });
    p.line('cr' + d.dx, x, y - w * 1.35, x, y - w * 1.35 - 26, { width: 2.4, color: C.gold });
  }
  // 广场
  p.washRect('square', 0, bb, W, H - bb, '#6E6273', { alpha: 1 });
  for (let j = 0; j < 7; j++) for (let i = 0; i < 12; i++) {
    const y = bb + 30 + j * 56, x = i * 84 + (j % 2) * 42;
    p.ctx.save(); p.ctx.globalAlpha = 0.25; p.ctx.strokeStyle = '#2B2230'; p.ctx.lineWidth = 2;
    p.ctx.strokeRect(x, y, 70, 34); p.ctx.restore();
  }
  // 路灯光晕
  for (const x of [90, 870]) {
    const g = p.ctx.createRadialGradient(x, 640, 0, x, 640, 160);
    g.addColorStop(0, 'rgba(255,220,140,0.55)'); g.addColorStop(1, 'rgba(255,220,140,0)');
    p.ctx.fillStyle = g; p.ctx.fillRect(x - 160, 480, 320, 320);
    p.line('lp' + x, x, 640, x, 900, { width: 4, color: '#2B2230' });
    p.washEllipse('lamp' + x, x, 630, 16, 22, '#FBE2A0', { alpha: 1 });
  }
  couple(p, { x: 480, y: 990, s: 0.85, pose: 'stand', t, gap: 130, sheFacing: -1, poses: ['wave', 'stand'] });
  leaves(p, 'ml', W, H, t, 10);
}

// ⑨ 圣彼得堡冬宫
export function spb(p, t, u) {
  sky(p, '#CFE1EA', '#F4E0C4', 600);
  cloud(p, 'sc1', 180 + t * 5, 130, 1);
  cloud(p, 'sc2', 700 + t * 4, 210, 0.9);
  // 冬宫立面：薄荷绿 + 白柱
  const top = 330, bot = 640;
  p.washRect('wp', 0, top, W, bot - top, C.mint, { alpha: 1 });
  p.rect('wpo', -4, top, W + 8, bot - top, { width: 2.4 });
  p.washRect('wpcorn', 0, top - 26, W, 26, C.white, { alpha: 1, spread: 1 });
  for (let i = 0; i < 26; i++) {
    const x = 16 + i * 37;
    p.washRect('wcol' + i, x, top + 8, 10, bot - top - 16, C.white, { alpha: 0.95, spread: 1, edge: false });
  }
  for (let r = 0; r < 3; r++) for (let i = 0; i < 25; i++) {
    const x = 30 + i * 37, y = top + 28 + r * 96;
    p.washRect(`ww${r}_${i}`, x, y, 18, 52, '#F6EBD1', { alpha: 0.95, spread: 0.8, edge: false });
  }
  for (let i = 0; i < 18; i++) {
    const x = 20 + i * 54;
    p.washEllipse('statue' + i, x, top - 40, 6, 14, C.ginkgo, { alpha: 0.9, edge: false });
  }
  p.washRect('arch', 420, 480, 120, 160, '#E9DFC8', { alpha: 1 });
  p.rect('archo', 420, 480, 120, 160, { width: 2.2 });
  // 广场 + 亚历山大柱
  p.washRect('psq', 0, bot, W, H - bot, '#D3C3A2', { alpha: 1 });
  const ax = 480;
  p.washRect('acol', ax - 22, 300, 44, 560, '#B3684C', { alpha: 1 });
  p.rect('acolo', ax - 22, 300, 44, 560, { width: 2.4 });
  p.washRect('aped', ax - 70, 840, 140, 80, '#8C8174', { alpha: 1 });
  p.rect('apedo', ax - 70, 840, 140, 80, { width: 2.4 });
  p.washEllipse('angel', ax, 270, 22, 34, '#8B7B5A', { alpha: 1 });
  p.line('angelc', ax, 236, ax, 190, { width: 3 });
  p.line('angelc2', ax - 14, 206, ax + 14, 206, { width: 3 });
  // 金色秋树
  for (const [x, y, s] of [[90, 1000, 1], [870, 1010, 1.05]]) {
    p.washRect('trk' + x, x - 10, y - 200 * s, 20, 200 * s, '#7A5A40', { alpha: 1, spread: 1 });
    p.washEllipse('tc' + x, x, y - 260 * s, 110 * s, 100 * s, C.ginkgo, { alpha: 0.85 });
    p.washEllipse('tc2' + x, x + 40, y - 220 * s, 70 * s, 60 * s, C.amber, { alpha: 0.6 });
  }
  couple(p, { x: 300, y: 1000, s: 0.85, pose: 'walk', t, gap: 130, sheFacing: 1 });
  leaves(p, 'sl', W, H, t, 16);
}
