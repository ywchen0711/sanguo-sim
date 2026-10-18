// The map: an ink-dark land with soft faction territories, rivers, roads, cities and the month's campaigns.
import { citiesOf } from '../sim/engine.js?v=2';
import { nameIn } from '../sim/text.js?v=2';

// rough coastline (the sea lies east and south of it) and the great rivers, in map units (0-100)
const COAST = [[96, 0], [97, 10], [92, 18], [88, 27], [93, 33], [90, 40], [89, 47], [94, 56], [97, 63], [96, 72], [94, 80], [86, 88], [70, 95], [55, 98], [42, 104], [100, 104], [100, 0]];
const RIVERS = [
  [[6, 30], [14, 28], [24, 24], [33, 15], [42, 10], [46, 16], [47, 30], [49, 37], [56, 37], [64, 34], [72, 30], [80, 29], [89, 28]],        // 黃河
  [[8, 64], [15, 73], [22, 76], [28, 73], [34, 70], [40, 73], [46, 75], [52, 72], [57, 70], [63, 73], [68, 70], [74, 66], [82, 65], [95, 62]], // 長江
  [[24, 52], [32, 56], [38, 58], [43, 63], [48, 67], [54, 69]],                                                                             // 漢水
  [[40, 38], [36, 40], [30, 42], [22, 43]],                                                                                                 // 渭水
  [[60, 52], [66, 56], [72, 60], [78, 62]],                                                                                                 // 淮水
];
let terrain = null, grid = null;

export function makeView(cv) {
  // fill wide screens: the map may stretch up to 35% wider than tall
  const W = cv.clientWidth, H = cv.clientHeight, sy = Math.min(H / 106, W / 104), sx = Math.min(W / 104, sy * 1.35), s = sy, ox = (W - 100 * sx) / 2, oy = (H - 104 * sy) / 2 + 2 * sy;
  return { W, H, s, sx, sy, X: (x) => ox + x * sx, Y: (y) => oy + y * sy, inv: (px, py) => [(px - ox) / sx, (py - oy) / sy] };
}
const inSea = (x, y) => { let r = false; for (let i = 0, j = COAST.length - 1; i < COAST.length; j = i++) { const [xi, yi] = COAST[i], [xj, yj] = COAST[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) r = !r; } return r; };

// which city each spot of land is nearest to (computed once; colouring it is cheap)
function buildGrid(G) {
  const N = 120, cells = new Int16Array(N * N).fill(-1), dist = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = i / N * 104 - 2, y = j / N * 106 - 2; if (inSea(x, y)) continue;
    let best = -1, bd = 1e9; for (const c of G.cities) { const d = (c.x - x) ** 2 + (c.y - y) ** 2; if (d < bd) { bd = d; best = c.id; } }
    if (bd < 16 * 16) { cells[j * N + i] = best; dist[j * N + i] = Math.sqrt(bd); }
  }
  return { N, cells, dist };
}
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

export function drawMap(c, G, v, ui, lang) {
  const { W, H, s, X, Y } = v;
  if (!grid) grid = buildGrid(G);
  // land and sea
  if (!terrain || terrain.w !== W || terrain.h !== H) {
    const t = document.createElement('canvas'); t.width = W; t.height = H; const g = t.getContext('2d');
    const bg = g.createRadialGradient(W * 0.45, H * 0.45, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.75); bg.addColorStop(0, '#2c281f'); bg.addColorStop(1, '#17150f');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 1400; k++) { g.fillStyle = `rgba(${200 + (k % 40)},${180 + (k % 30)},${120},${0.015 + (k % 7) * 0.004})`; const x = (k * 97.13) % W, y = (k * 57.71 + k * k * 0.013) % H; g.fillRect(x, y, 1 + (k % 3), 1); }
    g.beginPath(); COAST.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.closePath();
    const sea = g.createLinearGradient(X(85), 0, X(100), 0); sea.addColorStop(0, '#16252c'); sea.addColorStop(1, '#0d171c'); g.fillStyle = sea; g.fill();
    g.strokeStyle = 'rgba(160,190,200,.35)'; g.lineWidth = 1.5; g.stroke();
    for (const r of RIVERS) { g.beginPath(); r.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.strokeStyle = 'rgba(70,120,150,.55)'; g.lineWidth = Math.max(2, s * 0.7); g.lineJoin = 'round'; g.stroke(); g.strokeStyle = 'rgba(120,170,200,.25)'; g.lineWidth = 1; g.stroke(); }
    terrain = { w: W, h: H, cv: t };
  }
  c.drawImage(terrain.cv, 0, 0);
  // territories: each spot of land tinted by the owner of its nearest city, then smoothed
  const N = grid.N, img = new ImageData(N, N), cols = {};
  for (const f of Object.values(G.factions)) cols[f.id] = hexToRgb(f.color);
  for (let k = 0; k < N * N; k++) {
    const id = grid.cells[k]; if (id < 0) continue;
    const o = G.cities[id].owner; if (!o) continue;
    const [r, g, b] = cols[o], edge = grid.dist[k] / 16;
    img.data[k * 4] = r; img.data[k * 4 + 1] = g; img.data[k * 4 + 2] = b; img.data[k * 4 + 3] = Math.round(120 * (1 - edge * edge * 0.75));
  }
  const tc = document.createElement('canvas'); tc.width = N; tc.height = N; tc.getContext('2d').putImageData(img, 0, 0);
  c.save(); c.imageSmoothingEnabled = true; c.globalAlpha = 0.85; c.filter = `blur(${Math.max(3, s * 0.9)}px)`; c.drawImage(tc, X(-2), Y(-2), 104 * v.sx, 106 * v.sy); c.restore();
  // roads
  c.save(); c.setLineDash([3, 4]); c.lineWidth = 1; c.strokeStyle = 'rgba(210,190,140,.22)';
  for (const a of G.cities) for (const b of a.adj) if (b > a.id) { const d = G.cities[b]; c.beginPath(); c.moveTo(X(a.x), Y(a.y)); c.lineTo(X(d.x), Y(d.y)); c.stroke(); }
  c.restore();
  // campaigns of the last few months: an arrow from each source city to the target
  for (const e of ui.recentWars) {
    const age = G.t - e.t; if (age > 3) continue;
    const t = G.cities[e.city], a = Math.max(0.15, 1 - age / 4), col = G.factions[e.fac] ? G.factions[e.fac].color : '#fff';
    for (const sid of e.srcs || [e.from]) {
      const f = G.cities[sid], x0 = X(f.x), y0 = Y(f.y), x1 = X(t.x), y1 = Y(t.y), ang = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0) - 10;
      c.save(); c.globalAlpha = a; c.translate(x0, y0); c.rotate(ang);
      c.strokeStyle = col; c.lineWidth = 3; c.shadowColor = col; c.shadowBlur = 8;
      c.beginPath(); c.moveTo(8, 0); c.quadraticCurveTo(L / 2, -L * 0.12, L, 0); c.stroke();
      c.fillStyle = col; c.beginPath(); c.moveTo(L + 2, 0); c.lineTo(L - 8, -6); c.lineTo(L - 6, 1); c.lineTo(L - 9, 6); c.fill();
      c.restore();
    }
    // a burst where a city fell, a shield where the attack failed
    c.save(); c.globalAlpha = a; c.translate(X(t.x), Y(t.y));
    if (e.win) { c.strokeStyle = '#ffdc8a'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; c.beginPath(); c.moveTo(Math.cos(an) * 10, Math.sin(an) * 10); c.lineTo(Math.cos(an) * 17, Math.sin(an) * 17); c.stroke(); } }
    else { c.strokeStyle = '#9ad'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 13, 0, 7); c.stroke(); }
    c.restore();
  }
  // cities
  const seat = new Set(Object.values(G.factions).filter((f) => f.alive).map((f) => G.gens[f.lord].city));
  for (const ct of G.cities) {
    const x = X(ct.x), y = Y(ct.y), f = ct.owner && G.factions[ct.owner], r = 3 + ct.size * 1.6 + Math.min(4, ct.troops / 12000);
    if (ui.sel === ct.id) { c.strokeStyle = '#fff3c0'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r + 6, 0, 7); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.arc(x + 1, y + 2, r + 1.5, 0, 7); c.fill();
    c.fillStyle = f ? f.color : '#6a655a'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.strokeStyle = 'rgba(20,16,10,.9)'; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.35, r * 0.35, 0, 7); c.fill();
    if (seat.has(ct.id)) { c.fillStyle = '#ffe08a'; c.font = `${Math.round(10 + s * 0.3)}px serif`; c.textAlign = 'center'; c.fillText('★', x, y - r - 3); }
    if (s > 5.5 || ct.size >= 2 || ui.sel === ct.id) {
      const label = nameIn(ct.name, lang, true);
      c.font = `${lang === 'en' ? 600 : 700} ${Math.round(Math.max(11, Math.min(15, s * 1.6)))}px 'Noto Serif TC', serif`; c.textAlign = 'center';
      c.lineWidth = 3; c.strokeStyle = 'rgba(10,8,6,.85)'; c.strokeText(label, x, y + r + 13); c.fillStyle = f ? '#f4ead2' : '#a8a090'; c.fillText(label, x, y + r + 13);
    }
  }
}
export function cityAt(G, v, px, py) {
  let best = null, bd = 18 * 18;
  for (const c of G.cities) { const d = (v.X(c.x) - px) ** 2 + (v.Y(c.y) - py) ** 2; if (d < bd) { bd = d; best = c; } }
  return best;
}
// cities held by each faction over the years, as stacked bands
export function drawChart(c, G, W, H, lang) {
  c.fillStyle = '#15130f'; c.fillRect(0, 0, W, H);
  const hist = G.history, n = hist.length; if (n < 2) return;
  const x = (i) => 6 + (W - 12) * i / (n - 1), y = (v) => H - 14 - (H - 22) * v / G.cities.length;
  const ids = [...new Set(hist.flatMap((h) => Object.keys(h.f)))];
  const base = new Array(n).fill(0);
  for (const id of ids) {
    const f = G.factions[id]; const top = hist.map((h, i) => base[i] + (h.f[id] || 0));
    if (top.every((v, i) => v === base[i])) continue;
    c.beginPath(); top.forEach((v, i) => (i ? c.lineTo(x(i), y(v)) : c.moveTo(x(i), y(v)))); for (let i = n - 1; i >= 0; i--) c.lineTo(x(i), y(base[i]));
    c.closePath(); c.fillStyle = f.color; c.globalAlpha = 0.8; c.fill(); c.globalAlpha = 1;
    top.forEach((v, i) => { base[i] = v; });
  }
  c.fillStyle = '#a39a86'; c.font = '11px serif'; c.textAlign = 'left';
  for (let i = 0; i < n; i += Math.max(1, Math.ceil(n / 8))) c.fillText(lang === 'en' ? String(hist[i].year) : hist[i].year + '年', x(i) + 2, H - 2);
}
export const resetMap = () => { terrain = null; grid = null; };
