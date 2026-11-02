// The village hub, 2D top-down: tap the ground to walk there (tile paths around trees, houses and water), tap a villager to
// walk up and talk. Drawn on a small pixel buffer, scaled up by a whole number so every pixel stays square.
import { canvas, painter, rng } from './px.js';
import { T, renderGround, makeArt, bubble } from './world.js';
import { walker, NPC_LOOKS } from './chars.js';
import { icon } from './icons.js';

const W = 20, H = 26;
// ---------------------------------------------------------------- the map: a very small village, everything a few steps apart
function buildGrid() {
  const g = Array.from({ length: H }, () => Array(W).fill('g'));
  const fill = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = ch; };
  fill(0, 0, 19, 4, 'w');                  // the sea
  fill(0, 5, 1, 5, 'w'); fill(2, 5, 9, 6, 's'); fill(0, 6, 1, 6, 's');
  fill(10, 5, 19, 6, 'q');                 // the quay
  fill(3, 1, 4, 5, 'p');                   // the pier
  fill(3, 7, 4, 9, 'd'); fill(3, 9, 13, 9, 'd'); fill(12, 7, 13, 9, 'd');
  fill(9, 9, 10, 25, 'd');                 // the street, down to the gate
  fill(8, 12, 11, 15, 'm');                // the square: flagstones
  fill(3, 12, 8, 12, 'd'); fill(3, 11, 5, 13, 'd');   // to the woodcutter's clearing
  fill(11, 14, 15, 14, 'd');               // to the trader
  fill(10, 21, 17, 21, 'd'); fill(5, 21, 9, 21, 'd'); // to the bank, to home
  fill(8, 23, 11, 23, 'd');                // the gate
  return g;
}

// props: [art, tile x, tile y (the bottom row), blocked footprint [x, y, w, h] relative to x, y (or null)]
function buildProps(A) {
  const R = rng(11), P = [];
  const add = (img, tx, ty, foot, opt = {}) => P.push({ img, x: tx * T + (opt.ox ?? T / 2), y: (ty + 1) * T + (opt.oy ?? 0), foot: foot ? [tx + foot[0], ty + foot[1], foot[2], foot[3]] : null, ...opt });
  const one = [0, 0, 1, 1];
  // the little wood on the west
  [[0, 7], [1, 8], [0, 10], [1, 12], [0, 14], [1, 16], [0, 18], [2, 15], [0, 20], [2, 8]].forEach(([x, y], i) => add(i % 2 ? A.pine[i % 2] : A.tree[(i / 2) % 2], x, y, one));
  add(A.olive[2], 6, 10, one); add(A.stumpAxe, 3, 11, one); add(A.logs, 5, 13, one); add(A.stump, 6, 13, null); add(A.cabbage, 2, 13, null); add(A.carrot, 7, 11, null);
  // the beach, the pier and the quay, the ship
  add(A.fishCrate, 4, 1, one); add(A.barrel, 4, 4, one); add(A.rock[1], 1, 6, null); add(A.rock[0], 8, 6, null); add(A.flowers[1], 6, 7, null);
  add(A.ship, 15, 4, null, { ox: 0, ship: true });
  add(A.anchor, 10, 5, one); add(A.ropeCoil, 14, 6, null); add(A.barrel, 17, 6, one); add(A.barrel, 18, 6, one); add(A.crate, 19, 6, one); add(A.crate, 16, 5, one);
  add(A.lamp, 11, 8, one); add(A.sign, 8, 8, null, { oy: -2 });
  // the trader's stall, the cottage behind it, the bank, the well
  add(A.stall, 13, 13, [-1, -1, 4, 2], { ox: 16 });
  add(A.cottage, 17, 11, [-2, -2, 5, 3], { ox: 8 });
  add(A.amphorae, 16, 13, one); add(A.flowers[0], 15, 12, null); add(A.bougain, 19, 13, one);
  add(A.bank, 16, 20, [-2, -3, 6, 4], { ox: 8 });
  add(A.well, 9, 13, [0, 0, 2, 1], { ox: 16 });
  add(A.bench, 7, 15, null); add(A.lamp, 12, 16, one); add(A.flowers[3], 8, 16, null); add(A.flowers[2], 11, 11, null);
  // home and its garden
  add(A.home, 5, 20, [-2, -2, 5, 3], { ox: 8 });
  add(A.picket, 2, 21, one); add(A.picket, 3, 21, one); add(A.flowers[0], 4, 22, null); add(A.flowers[1], 7, 22, null);
  add(A.pergola, 1, 23, [-1, -1, 3, 2], { ox: 8 });   // the home's vine pergola
  add(A.amphorae, 3, 23, one);
  // the south palisade and its gate, where the guard stands
  for (let x = 0; x < W; x++) if (x < 8 || x > 11) add(A.palisade, x, 24, one);
  add(A.torch, 7, 24, one); add(A.torch, 12, 24, one);
  // trees, bushes and flowers to the east
  for (const [x, y] of [[19, 8], [18, 17], [19, 22], [13, 22], [14, 24]]) add(A.tree[Math.floor(R() * 3)], x, y, one);
  add(A.shrine, 18, 15, [0, -1, 2, 2], { ox: 11 }); add(A.altar, 17, 14, one); add(A.cypress[0], 16, 12, one);
  for (const [x, y] of [[12, 18], [7, 17], [13, 10], [17, 22], [15, 23], [6, 16]]) add(A.flowers[Math.floor(R() * 4)], x, y, null);
  for (const [x, y] of [[12, 19], [7, 19], [18, 23], [16, 8]]) add(A.bush[Math.floor(R() * 2)], x, y, one);
  add(A.rock[0], 13, 17, null); add(A.rock[1], 11, 19, null);
  return P;
}
// the villagers: where they stand and what they offer
export const NPCS = [
  { id: 'fisher', tx: 3, ty: 2, face: 'down', badge: 'rod' },
  { id: 'shipwright', tx: 12, ty: 6, face: 'down', badge: 'hammer' },
  { id: 'woodcutter', tx: 4, ty: 11, face: 'down', badge: 'axe' },
  { id: 'trader', tx: 13, ty: 14, face: 'down', badge: 'scales' },
  { id: 'banker', tx: 17, ty: 21, face: 'down', badge: 'chest' },
  { id: 'guard', tx: 11, ty: 23, face: 'down', badge: 'lantern' },
];
export const HOME = { tx: 10, ty: 16 };

export function createVillage(cv, { onArrive = () => {}, onTapEmpty = () => {} } = {}) {
  const ctx = cv.getContext('2d');
  const grid = buildGrid(), PAD = 4, ground = renderGround([...Array.from({ length: PAD }, () => Array(W).fill('w')), ...grid, ...Array.from({ length: PAD }, () => Array.from({ length: W }, (_, x) => (x === 9 || x === 10 ? 'd' : 'g')))]), A = makeArt(), props = buildProps(A);
  const block = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => grid[y][x] === 'w'));
  for (const p of props) if (p.foot) { const [x0, y0, w, h] = p.foot; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (block[y]?.[x] !== undefined) block[y][x] = true; }
  const npcs = NPCS.map((n) => ({ ...n, x: n.tx * T + T / 2, y: n.ty * T + T - 2, W: walker(NPC_LOOKS[n.id], n.id), bub: bubble(icon(n.badge)), t: Math.random() * 6 }));
  for (const n of npcs) block[n.ty][n.tx] = true;
  const hero = { x: HOME.tx * T + T / 2, y: HOME.ty * T + T - 2, dir: 'down', path: [], W: null, step: 0, walkT: 0, target: null };
  const S = { k: 2, vw: 200, vh: 400, cam: { x: 0, y: 0 }, padT: 0, padB: 0, run: false, t: 0, marker: null, last: 0 };
  const [buf, bx] = canvas(8, 8);
  const R = rng(5);
  const waves = Array.from({ length: 40 }, () => { for (;;) { const x = Math.floor(R() * W), y = Math.floor(R() * 7); if (grid[y][x] === 'w') return { x: x * T + R() * T, y: y * T + R() * T, p: R() * 6, l: 3 + Math.floor(R() * 4) }; } });
  const flies = Array.from({ length: 4 }, (_, i) => ({ x: (6 + i * 5) * T, y: (24 + (i % 3) * 4) * T, p: i * 1.7, c: ['#fff6a8', '#ffffff', '#ffb0d8', '#a8e0ff'][i] }));
  const gulls = Array.from({ length: 3 }, (_, i) => ({ x: i * 150, y: 18 + i * 22, v: 9 + i * 3 }));

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3), w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    cv.width = w; cv.height = h;
    S.k = Math.max(2, Math.floor(Math.min(w / 190, h / 300)));
    S.vw = Math.ceil(w / S.k); S.vh = Math.ceil(h / S.k); buf.width = S.vw; buf.height = S.vh; bx.imageSmoothingEnabled = false;
    S.padT = Math.ceil(76 * dpr / S.k); S.padB = Math.ceil(84 * dpr / S.k);   // the HUD on top and the dock below cover the map's edges
  }
  // ---- paths: A* over tiles, 8 directions without cutting corners
  function findPath(sx, sy, gx, gy) {
    if (gx < 0 || gy < 0 || gx >= W || gy >= H) return null;
    const key = (x, y) => y * W + x, open = [[sx, sy]], came = new Map(), gS = new Map([[key(sx, sy), 0]]);
    const h = (x, y) => Math.max(Math.abs(x - gx), Math.abs(y - gy));
    const fS = new Map([[key(sx, sy), h(sx, sy)]]);
    let n = 0;
    while (open.length && n++ < 4000) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (fS.get(key(...open[i])) < fS.get(key(...open[bi]))) bi = i;
      const [x, y] = open.splice(bi, 1)[0];
      if (x === gx && y === gy) { const out = [[x, y]]; let k = key(x, y); while (came.has(k)) { k = came.get(k); out.unshift([k % W, Math.floor(k / W)]); } return out.slice(1); }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || block[ny][nx]) continue;
        if (dx && dy && (block[y][nx] || block[ny][x])) continue;
        const ng = gS.get(key(x, y)) + (dx && dy ? 1.41 : 1), k = key(nx, ny);
        if (ng < (gS.get(k) ?? Infinity)) { came.set(k, key(x, y)); gS.set(k, ng); fS.set(k, ng + h(nx, ny)); if (!open.some(([a, b]) => a === nx && b === ny)) open.push([nx, ny]); }
      }
    }
    return null;
  }
  const tileOf = (px, py) => [Math.floor(px / T), Math.floor((py - 1) / T)];
  function walkTo(tx, ty, then = null) {
    const [sx, sy] = tileOf(hero.x, hero.y);
    const p = findPath(sx, sy, tx, ty); if (!p) return false;
    hero.path = p.map(([x, y]) => [x * T + T / 2, y * T + T - 2]); hero.target = then; S.marker = { x: tx * T + T / 2, y: ty * T + T / 2, t: 0 };
    if (!p.length && then) { hero.target = null; then(); }
    return true;
  }
  // walk next to a villager (the free tile beside them closest to the hero), then talk
  function approach(n, cb = () => onArrive(n.id)) {
    const [sx, sy] = tileOf(hero.x, hero.y);
    const opts = [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1]].map(([dx, dy]) => [n.tx + dx, n.ty + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < W && y < H && !block[y][x]);
    opts.sort((a, b) => Math.hypot(a[0] - sx, a[1] - sy) - Math.hypot(b[0] - sx, b[1] - sy));
    for (const [x, y] of opts) if (walkTo(x, y, () => { faceTo(n); cb(); })) return true;
    return false;
  }
  function faceTo(n) { const dx = n.x - hero.x, dy = n.y - hero.y; hero.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); const ndx = -dx, ndy = -dy; n.face = Math.abs(ndx) > Math.abs(ndy) ? (ndx > 0 ? 'right' : 'left') : (ndy > 0 ? 'down' : 'up'); n.faceT = 6; }

  // ---- input: tap
  function onTap(e) {
    if (!S.run) return;
    const r = cv.getBoundingClientRect(), dpr = cv.width / r.width;
    const wx = (e.clientX - r.left) * dpr / S.k + S.cam.x, wy = (e.clientY - r.top) * dpr / S.k + S.cam.y;
    // a villager (their sprite and badge are generous targets)
    const n = npcs.find((q) => wx > q.x - 12 && wx < q.x + 12 && wy > q.y - 44 && wy < q.y + 4);
    if (n) { approach(n); return; }
    let [tx, ty] = [Math.floor(wx / T), Math.floor(wy / T)];
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return;
    if (block[ty][tx]) { // the nearest free tile
      let best = null, bd = 1e9; for (let y = ty - 2; y <= ty + 2; y++) for (let x = tx - 2; x <= tx + 2; x++) if (y >= 0 && x >= 0 && y < H && x < W && !block[y][x]) { const d = Math.hypot(x - tx, y - ty); if (d < bd) { bd = d; best = [x, y]; } }
      if (!best) return; [tx, ty] = best;
    }
    walkTo(tx, ty); onTapEmpty();
  }
  // ---- input: a floating joystick. It appears where a finger lands; a drag walks the hero continuously
  // in that direction (walls and villagers stop it); a quick tap with no drag still walks there or talks.
  const JOY_R = 44, JOY_DEAD = 10;   // CSS px: the base's reach, and how far a finger moves before a tap becomes a drag
  let joy = null, joyBase = null;
  cv.addEventListener('pointerdown', (e) => {
    if (!S.run || joy) return;
    joy = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, on: false };
    try { cv.setPointerCapture(e.pointerId); } catch { /* not every pointer can be captured */ }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!joy || e.pointerId !== joy.id) return;
    joy.x = e.clientX; joy.y = e.clientY;
    if (!joy.on && Math.hypot(joy.x - joy.sx, joy.y - joy.sy) > JOY_DEAD) { joy.on = true; hero.path = []; hero.target = null; S.marker = null; onTapEmpty(); }
  });
  const joyEnd = (e, tap) => { if (!joy || e.pointerId !== joy.id) return; const was = joy.on; joy = null; if (tap && !was) onTap(e); };
  cv.addEventListener('pointerup', (e) => joyEnd(e, true));
  cv.addEventListener('pointercancel', (e) => joyEnd(e, false));
  // the hero's feet (a small box) must stay on free tiles inside the map
  const freeAt = (x, y) => { for (const [fx, fy] of [[x - 4, y - 5], [x + 4, y - 5], [x - 4, y - 1], [x + 4, y - 1]]) { const tx = Math.floor(fx / T), ty = Math.floor(fy / T); if (tx < 0 || ty < 0 || tx >= W || ty >= H || block[ty][tx]) return false; } return true; };
  function joyMove(dt) {
    const dx = joy.x - joy.sx, dy = joy.y - joy.sy, m = Math.hypot(dx, dy);
    if (m < JOY_DEAD * .6) { hero.step = 0; hero.walkT = 0; return; }
    const sp = 58 * Math.min(1, .45 + .55 * m / JOY_R) * dt, ux = dx / m, uy = dy / m;
    hero.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    // per axis, so the hero slides along a wall instead of sticking to it
    const nx = hero.x + ux * sp, ny = hero.y + uy * sp;
    if (freeAt(nx, hero.y)) hero.x = nx;
    if (freeAt(hero.x, ny)) hero.y = ny;
    hero.walkT += dt; hero.step = 1 + (Math.floor(hero.walkT * 7) % 2);
  }
  // drawn into the pixel buffer, so it is pixel art at the map's scale: dark plum base, gold rim, gold knob
  function drawJoy(P) {
    if (!joy || !joy.on) return;
    const r = cv.getBoundingClientRect(), f = (cv.width / r.width) / S.k;
    const bx0 = Math.round((joy.sx - r.left) * f), by0 = Math.round((joy.sy - r.top) * f), R = Math.round(JOY_R * f);
    let dx = joy.x - joy.sx, dy = joy.y - joy.sy; const m = Math.hypot(dx, dy); if (m > JOY_R) { dx *= JOY_R / m; dy *= JOY_R / m; }
    const kx = Math.round(bx0 + dx * f), ky = Math.round(by0 + dy * f), kr = Math.max(6, Math.round(R * .5));
    const X = P.x, ring = (Q, cx, cy, rr, c) => Q.ell(cx - rr, cy - rr, rr * 2 + 1, rr * 2 + 1, c);
    // the base: a gold ring with a dark outline, its middle a see-through plum, gold notches for the four directions
    const o = R + 4;
    if (!joyBase || joyBase.R !== R) { const [bc, bxc] = canvas(o * 2 + 1, o * 2 + 2), Q = painter(bxc); joyBase = Object.assign(bc, { R });
    ring(Q, o, o + 1, R + 2, '#140b11'); ring(Q, o, o, R + 2, '#140b11'); ring(Q, o, o, R + 1, '#6a4a1c'); ring(Q, o, o, R, '#d8a840');
    bxc.globalCompositeOperation = 'destination-out'; ring(Q, o, o, R - 2, '#000'); bxc.globalCompositeOperation = 'source-over';
    Q.x.globalAlpha = .5; ring(Q, o, o, R - 2, '#24131f'); Q.x.globalAlpha = 1;
    for (const [ax, ay] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { const px = o + ax * (R - 5), py = o + ay * (R - 5); Q.rect(px - (ay ? 1 : 0), py - (ax ? 1 : 0), ay ? 3 : 1, ax ? 3 : 1, '#e0b048'); Q.px(px - ax, py - ay, '#e0b048'); }
    }
    X.drawImage(joyBase, bx0 - o, by0 - o);
    // the knob: shadow, dark outline, gold rim, plum face with a shine
    X.globalAlpha = .4; ring(P, kx, ky + 2, kr, '#000000'); X.globalAlpha = 1;
    ring(P, kx, ky, kr + 1, '#140b11'); ring(P, kx, ky, kr, '#f0c860'); ring(P, kx, ky, kr - 1, '#b07e28'); ring(P, kx, ky, kr - 2, '#5a3450'); ring(P, kx, ky - 1, kr - 3, '#6e4264');
    P.rect(kx - Math.round(kr / 2), ky - Math.round(kr / 2), 2, 1, '#f8e0a0'); P.px(kx - Math.round(kr / 2) - 1, ky - Math.round(kr / 2) + 1, '#f8e0a0');
  }

  // ---- the loop
  function update(dt) {
    S.t += dt;
    if (joy && joy.on) joyMove(dt);
    else if (hero.path.length) {
      const [px, py] = hero.path[0], dx = px - hero.x, dy = py - hero.y, d = Math.hypot(dx, dy), sp = 58 * dt;
      if (d <= sp) { hero.x = px; hero.y = py; hero.path.shift(); if (!hero.path.length && hero.target) { const f = hero.target; hero.target = null; f(); } }
      else { hero.x += dx / d * sp; hero.y += dy / d * sp; hero.dir = Math.abs(dx) > Math.abs(dy) + .1 ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }
      hero.walkT += dt; hero.step = 1 + (Math.floor(hero.walkT * 7) % 2);
    } else { hero.step = 0; hero.walkT = 0; }
    for (const n of npcs) { if (n.faceT > 0) { n.faceT -= dt; if (n.faceT <= 0) n.face = 'down'; } }
    for (const g of gulls) { g.x += g.v * dt; if (g.x > W * T + 30) g.x = -30; }
    if (S.marker) { S.marker.t += dt; if (S.marker.t > .8 || !hero.path.length) S.marker = null; }
    // camera: the hero in the middle, clamped to the map
    S.cam.x = Math.round(Math.max(0, Math.min(W * T - S.vw, hero.x - S.vw / 2)));
    S.cam.y = Math.round(Math.max(-S.padT, Math.min(H * T - S.vh + S.padB, hero.y - S.vh / 2)));
    if (W * T < S.vw) S.cam.x = Math.round((W * T - S.vw) / 2);
    if (H * T + S.padT + S.padB < S.vh) S.cam.y = Math.round((H * T - S.vh + S.padB - S.padT) / 2);
  }
  function draw() {
    const X = bx, P = painter(X), cx = S.cam.x, cy = S.cam.y, t = S.t;
    X.fillStyle = '#2c7ac0'; X.fillRect(0, 0, S.vw, S.vh);
    X.drawImage(ground, -cx, -cy - PAD * T);   // the ground carries PAD rows of sea above and of meadow below the map
    // the sea moves: drifting wave dashes and sparkles
    for (const w of waves) { const ox = Math.round(Math.sin(t * .8 + w.p) * 3), a = (Math.sin(t * 1.3 + w.p * 2) + 1) / 2; if (a < .25) continue; P.hline(Math.round(w.x + ox - cx), Math.round(w.y - cy), w.l, a > .8 ? '#e0f6ff' : '#78c6f0'); }
    // y-sorted: props, villagers, the hero
    const list = [];
    for (const p of props) list.push({ y: p.ship ? -1 : p.y, d: () => X.drawImage(p.img, Math.round(p.x - p.img.width / 2 - cx), Math.round(p.y - p.img.height - cy)) });
    for (const n of npcs) list.push({ y: n.y, d: () => {
      const fr = n.W[n.face][0], bobY = Math.sin(S.t * 2 + n.t) > .6 ? -1 : 0;
      X.globalAlpha = .25; P.ell(Math.round(n.x - 6 - cx), Math.round(n.y - 3 - cy), 12, 5, '#14200c'); X.globalAlpha = 1;
      X.drawImage(fr, Math.round(n.x - 8 - cx), Math.round(n.y - 20 - cy + bobY));
      const by = Math.round(n.y - 46 - cy + Math.sin(S.t * 2.4 + n.t) * 1.5); X.drawImage(n.bub, Math.round(n.x - 12 - cx), by);
    } });
    if (hero.W) list.push({ y: hero.y + .5, d: () => {
      X.globalAlpha = .28; P.ell(Math.round(hero.x - 6 - cx), Math.round(hero.y - 3 - cy), 12, 5, '#14200c'); X.globalAlpha = 1;
      X.drawImage(hero.W[hero.dir][hero.step], Math.round(hero.x - 8 - cx), Math.round(hero.y - 20 - cy));
    } });
    list.sort((a, b) => a.y - b.y); for (const o of list) o.d();
    // the tap marker
    if (S.marker) { const m = S.marker, r = 3 + m.t * 6; X.globalAlpha = Math.max(0, 1 - m.t / .8); P.rect(Math.round(m.x - r - cx), Math.round(m.y - cy), Math.round(r * 2), 1, '#fff6c0'); P.rect(Math.round(m.x - cx), Math.round(m.y - r / 2 - cy), 1, Math.round(r), '#fff6c0'); X.globalAlpha = 1; }
    // gulls, butterflies, chimney smoke
    for (const g of gulls) { const wy = Math.floor(t * 4 + g.x) % 2; const gx = Math.round(g.x - cx), gy = Math.round(g.y - cy); P.px(gx - 2, gy - wy, '#ffffff'); P.px(gx - 1, gy, '#ffffff'); P.px(gx, gy + 1, '#ffffff'); P.px(gx + 1, gy, '#ffffff'); P.px(gx + 2, gy - wy, '#ffffff'); }
    for (const f of flies) { const fx = Math.round(f.x + Math.sin(t * .7 + f.p) * 26 - cx), fy = Math.round(f.y + Math.sin(t * 1.3 + f.p) * 12 - cy), o = Math.floor(t * 8 + f.p) % 2; P.px(fx - 1, fy - o, f.c); P.px(fx + 1, fy - o, f.c); P.px(fx, fy, '#3a2a2a'); }
    for (const [hx, hy] of [[25.5, 12.3], [11.4, 30.3]]) for (let i = 0; i < 3; i++) { const ph = (t * .5 + i / 3) % 1; X.globalAlpha = .55 * (1 - ph); P.ell(Math.round(hx * T + Math.sin(ph * 6 + i) * 3 - cx), Math.round(hy * T - ph * 22 - cy), 4 + Math.round(ph * 4), 3 + Math.round(ph * 3), '#f4f0f0'); X.globalAlpha = 1; }
    drawJoy(P);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buf, 0, 0, S.vw * S.k, S.vh * S.k);
  }
  function frame(ts) { if (!S.run) return; const dt = Math.min(.05, (ts - (S.last || ts)) / 1000); S.last = ts; update(dt); draw(); requestAnimationFrame(frame); }
  const api = {
    size, npcs, hero, findPath, block,
    start() { if (S.run) return; S.run = true; S.last = 0; size(); requestAnimationFrame(frame); },
    stop() { S.run = false; },
    setHero(L, key) { hero.W = walker(L, key); },
    approach: (id, cb) => { const n = npcs.find((q) => q.id === id); return n ? approach(n, cb) : false; },
    // stand next to a villager at once (coming back from a task screen)
    placeNear(id) { const n = npcs.find((q) => q.id === id); if (!n) return; hero.x = n.x; hero.y = n.y + T; hero.path = []; hero.dir = 'up'; },
    get walking() { return hero.path.length > 0 || !!(joy && joy.on); },
    // the joystick as the player sees it (CSS px), or null while no finger drags (for tests)
    get joystick() { return joy && joy.on ? { x: joy.sx, y: joy.sy, kx: joy.x, ky: joy.y } : null; },
    get heroAt() { return { x: hero.x, y: hero.y, tile: tileOf(hero.x, hero.y), dir: hero.dir }; },
    isBlocked: (tx, ty) => tx < 0 || ty < 0 || tx >= W || ty >= H || block[ty][tx],
    // a villager's place on the screen, in CSS pixels (for tests and hints)
    screenOf(id) { const n = npcs.find((q) => q.id === id); const r = cv.getBoundingClientRect(), dpr = cv.width / r.width; return n ? { x: r.left + (n.x - S.cam.x) * S.k / dpr, y: r.top + (n.y - 10 - S.cam.y) * S.k / dpr } : null; },
    screenOfTile(tx, ty) { const r = cv.getBoundingClientRect(), dpr = cv.width / r.width; return { x: r.left + (tx * T + T / 2 - S.cam.x) * S.k / dpr, y: r.top + (ty * T + T / 2 - S.cam.y) * S.k / dpr }; },
    draw() { update(0); draw(); },
  };
  addEventListener('resize', () => { if (S.run) size(); });
  return api;
}
