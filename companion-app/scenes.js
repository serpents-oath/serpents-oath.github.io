// The three task screens, 2D side view, always moving: FISHING on a chair at the end of the pier (rod, line, bobber, the
// fish under the water, the catch jumping into the bucket), WOODCUTTING at the forest's edge (the swing, chips, the tree
// falling, the log pile growing) and SHIP REPAIR at the dry dock (the big hull on its cradle, holes patched one by one, the
// hammer). What happens is the server's: event(id) plays a catch of exactly that thing.
import { canvas, painter, sprite, rng, light, dark, mix, flip } from './px.js';
import { icon } from './icons.js';
import { sideFrames } from './chars.js';

const SKY = ['#7cc6f0', '#8ed0f4', '#a2daf6', '#b6e4f8', '#c8ecfa', '#daf3fc'];
function sky(P, w, h0, h1, cols = SKY) { const n = cols.length, band = (h1 - h0) / n; for (let i = 0; i < n; i++) { P.rect(0, Math.round(h0 + i * band), w, Math.ceil(band) + 1, cols[i]); if (i) for (let x = (i % 2); x < w; x += 2) P.px(x, Math.round(h0 + i * band), cols[i - 1]); } }
const cloudSpr = [0, 1, 2].map((v) => sprite(40 + v * 8, 16, (P) => { const w = 38 + v * 8; P.ell(2, 6, w - 4, 9, '#ffffff'); P.ell(8, 1, 14, 12, '#ffffff'); P.ell(18 + v * 3, 0, 16, 13, '#ffffff'); P.hline(4, 13, w - 8, '#dcecf8'); }, { outline: false, under: .08, rim: 0 }));
const gullSpr = [0, 1].map((f) => sprite(9, 5, (P) => { if (f) { P.line(0, 2, 4, 3, '#ffffff'); P.line(4, 3, 8, 2, '#ffffff'); } else { P.line(0, 0, 4, 3, '#ffffff'); P.line(4, 3, 8, 0, '#ffffff'); } }, { outline: false, shade: false }));
function clouds(P, w, t, y0) { for (let i = 0; i < 4; i++) { const c = cloudSpr[i % 3], x = ((i * 97 + t * (3 + i)) % (w + 60)) - 50; P.x.drawImage(c, Math.round(x), y0 + (i * 13) % 34); } }
function gulls(P, w, t, y) { for (let i = 0; i < 2; i++) { const x = ((t * (14 + i * 5) + i * 120) % (w + 40)) - 20; P.x.drawImage(gullSpr[Math.floor(t * 4 + i) % 2], Math.round(x), Math.round(y + i * 14 + Math.sin(t + i) * 3)); } }
function hills(P, w, y, col, amp, seed, step = 1) { const R = rng(seed), ph = R() * 6, f1 = .03 + R() * .02, f2 = .07 + R() * .03; for (let x = 0; x < w; x += step) { const hgt = Math.round(amp * (.6 + .4 * Math.sin(x * f1 + ph) * Math.cos(x * f2 + ph * 2))); P.rect(x, y - hgt, step, hgt + 400, col); } }
function pines(P, w, y, col, seed, gap = 9, size = 1) { const R = rng(seed); for (let x = -4; x < w + 8; x += gap + Math.floor(R() * 5)) { const h = Math.round((14 + R() * 12) * size); for (let j = 0; j < h; j++) { const half = Math.round((j / h) * 5 * size); P.hline(x - half, y - h + j, half * 2 + 1, col); } P.rect(x, y, 1, 2, col); } }

// a far-off town like the game's: cream plaster houses under terracotta hip roofs, a little temple, cypresses
function farTown(P, x0, y, n, seed, dusk = 0) {
  const R = rng(seed), wall = dusk ? ['#c8a8a0', '#bc9c98', '#d0b0a4'] : ['#f3ede1', '#f0e4c9', '#ebdfc6'], roof = dusk ? ['#8a4a3e', '#7e4238'] : ['#c86a40', '#b85a3a'], shade = dusk ? '#9a7e80' : '#d4c8ab';
  let x = x0;
  for (let i = 0; i < n; i++) {
    const w = 12 + Math.floor(R() * 8), h = 7 + Math.floor(R() * 6), yy = y - Math.floor(R() * 4);
    if (i === Math.floor(n / 2)) { // the temple: columns and a pediment
      const tw = 22; P.rect(x, yy - 2, tw, 2, shade); for (let c = 1; c < tw; c += 4) P.rect(x + c, yy - 11, 2, 9, wall[0]); P.rect(x - 1, yy - 13, tw + 2, 2, wall[0]); P.poly([[x - 1, yy - 13], [x + tw / 2, yy - 19], [x + tw + 1, yy - 13]], wall[1]); P.poly([[x + 3, yy - 14], [x + tw / 2, yy - 17], [x + tw - 3, yy - 14]], dusk ? '#3a3a5a' : '#3d6390'); x += tw + 3; continue;
    }
    P.rect(x, yy - h, w, h, wall[i % 3]); P.vline(x + w - 1, yy - h, h, shade);
    P.poly([[x - 2, yy - h + 1], [x + 3, yy - h - 5], [x + w - 3, yy - h - 5], [x + w + 2, yy - h + 1]], roof[i % 2]); P.hline(x - 2, yy - h + 1, w + 4, dusk ? '#5e3022' : '#7a3822');
    const lit = dusk ? '#ffd870' : '#1c212d'; P.rect(x + 2, yy - h + 3, 2, 3, lit); if (w > 15) P.rect(x + w - 5, yy - h + 3, 2, 3, dusk && i % 2 ? '#3a2e3a' : lit);
    if (R() < .45) { const cx = x + w + 1; P.poly([[cx, yy - 16], [cx + 2, yy - 10], [cx + 2, yy], [cx - 2, yy], [cx - 2, yy - 10]], dusk ? '#24302e' : '#2f6a3c'); x += 4; }
    x += w + 2 + Math.floor(R() * 3);
  }
}

export function createScene(cv, kind, look, key = 'hero') {
  const ctx = cv.getContext('2d');
  const S = { k: 2, vw: 200, vh: 400, run: false, t: 0, last: 0, n: 0, bag: {}, ev: [], fx: [], bg: null };
  const [buf, bx] = canvas(8, 8);
  const R = rng(3);
  const frames = sideFrames(look, key, { fishing: 'fish', woodcutting: 'chop', shipwright: 'hammer', guard: 'patrol' }[kind]);
  const pickF = kind === 'guard' ? sideFrames(look, key, 'pick') : null;
  const mir = (f) => Object.assign(flip(f), { tip: f.tip });
  const framesL = kind === 'guard' ? frames.map(mir) : null, pickL = pickF ? pickF.map(mir) : null;
  const reel = kind === 'fishing' ? sideFrames(look, key, 'reel') : null;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3), w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    cv.width = w; cv.height = h;
    S.k = Math.max(2, Math.round(dpr * Math.min(innerWidth / 150, innerHeight / 290)));
    S.vw = Math.ceil(w / S.k); S.vh = Math.ceil(h / S.k); buf.width = S.vw; buf.height = S.vh; bx.imageSmoothingEnabled = false;
    // the ground / water line: the action sits above the bottom panel (which covers about the lowest 30%)
    S.gy = Math.round(Math.min(S.vh * (kind === 'fishing' ? .5 : kind === 'guard' ? .56 : .6), S.vw * 1.3 + 40));
    S.bg = background();
  }
  // ---------------------------------------------------------------- static layers per size
  function background() {
    const [c, x] = canvas(S.vw, S.vh), P = painter(x), w = S.vw, gy = S.gy;
    if (kind === 'fishing') {
      sky(P, w, 0, gy - 18);
      P.ell(w - 48, 14, 22, 22, '#fff4c0'); P.ell(w - 45, 17, 16, 16, '#fffbe0');
      hills(P, w, gy - 16, '#86b8d8', 10, 4, 2); farTown(P, Math.round(w * .5), gy - 20, 5, 7); hills(P, w, gy - 12, '#7aa468', 8, 9, 2);
      // the sea: surface bands, then deeper and deeper
      const sea = ['#5cb4e6', '#4aa6de', '#3e98d4', '#3488c6', '#2c78b6', '#2668a4', '#225a92', '#1e4e80'];
      P.rect(0, gy - 10, w, 6, '#6cc0ec');
      for (let i = 0; i < sea.length; i++) P.rect(0, gy - 4 + i * Math.ceil((S.vh - gy) / sea.length), w, Math.ceil((S.vh - gy) / sea.length) + 1, sea[i]);
      // light shafts, a sandy bottom with weed
      x.globalAlpha = .08; for (let i = 0; i < 5; i++) P.poly([[w * .2 + i * 40, gy], [w * .2 + i * 40 + 14, gy], [w * .2 + i * 40 - 30, S.vh], [w * .2 + i * 40 - 50, S.vh]], '#ffffff'); x.globalAlpha = 1;
      const by = S.vh - 30; P.rect(0, by, w, 30, '#c8a868'); for (let i = 0; i < w; i += 3) P.px(i, by + (i * 7) % 5, '#b0905a');
      for (let i = 0; i < 9; i++) { const sx = (i * 47 + 13) % w; for (let j = 0; j < 22; j++) P.px(sx + Math.round(Math.sin(j / 3 + i) * 2), by - j, j % 4 ? '#3a8a5a' : '#5ab07a'); }
      for (let i = 0; i < 6; i++) P.ell((i * 61 + 30) % w, by - 4, 10, 6, '#8a8a98');
      // the pier: deck, rails, posts into the water
      const pw = Math.round(w * .46), dy = gy - 14;
      for (let px = 6; px < pw; px += 22) { P.rect(px, dy + 4, 4, S.vh - dy, '#6a4024'); P.rect(px + 1, dy + 4, 1, S.vh - dy, '#86522a'); }
      P.rect(0, dy, pw, 5, '#b8783e'); P.hline(0, dy, pw, '#d6964e'); P.hline(0, dy + 4, pw, '#6a4024'); for (let px = 0; px < pw; px += 8) P.vline(px, dy + 1, 3, '#86522a');
      P.rect(pw - 4, dy - 12, 3, 12, '#86522a'); P.rect(2, dy - 12, 3, 12, '#86522a'); P.rect(2, dy - 12, pw - 4, 2, '#a8703a');
    } else if (kind === 'woodcutting') {
      sky(P, w, 0, gy, ['#86c8ec', '#98d2f0', '#acdcf2', '#c0e6f4', '#d4eef4', '#e4f4ec']);
      P.ell(30, 16, 20, 20, '#fff4c0');
      hills(P, w, gy - 34, '#9cbcd0', 16, 7, 2); pines(P, w, gy - 22, '#6a9a8a', 2, 7, .9); pines(P, w, gy - 12, '#4a7a5a', 5, 9, 1.1); pines(P, w, gy - 2, '#3a6a44', 8, 12, 1.3);
      // the ground: grass, then earth in section, roots and stones
      P.rect(0, gy - 4, w, 8, '#62b446'); for (let i = 0; i < w; i += 2) P.px(i, gy - 5 - (i * 13 % 3 === 0 ? 1 : 0), '#4a9a3c');
      P.rect(0, gy + 4, w, S.vh - gy, '#8a5a36'); P.rect(0, gy + 4, w, 3, '#6a4228');
      for (let i = 0; i < 40; i++) { const sx = (i * 53) % w, sy = gy + 12 + (i * 37) % (S.vh - gy - 14); P.ell(sx, sy, 5 + i % 4, 3 + i % 3, i % 3 ? '#7a4e2e' : '#9a9aa4'); }
      const deep = ['#7a4e2e', '#6a4228', '#5a3822', '#4a2e1c']; for (let i = 0; i < 4; i++) { x.globalAlpha = .55; P.rect(0, gy + 60 + i * 40, w, 40, deep[i]); } x.globalAlpha = 1;
      // a grass lip hanging over the earth, then clover and tufts on the lip
      for (let i = 0; i < w; i += 4) { const d = 2 + (i * 7) % 4; P.rect(i, gy + 4, 4, d, '#4a9a3c'); P.px(i + 1, gy + 4 + d, '#3a7a30'); }
      for (let i = 0; i < 26; i++) { const sx = (i * 41 + 7) % w; P.px(sx, gy - 2, '#8ad064'); P.px(sx - 1, gy - 1, '#8ad064'); P.px(sx + 1, gy - 1, '#8ad064'); if (i % 4 === 0) P.px(sx + 3, gy - 3, ['#fff4f0', '#ffe070', '#f0a0c0'][i % 3]); }
    } else if (kind === 'guard') {
      // dusk at the village's south gate: a warm sky, the first stars, roofs with lit windows, the palisade
      sky(P, w, 0, gy, ['#3a2c5a', '#5a3a6a', '#8a4a6a', '#c0606a', '#e8885a', '#f4b46a']);
      for (let i = 0; i < 26; i++) P.px((i * 67) % w, (i * 29) % Math.round(gy * .45), i % 3 ? '#f8f0ff' : '#c8c0e8');
      P.ell(w - 40, 10, 15, 15, '#f4e8c8'); P.ell(w - 39, 10, 13, 13, '#fff6dc'); P.ell(w - 36, 13, 3, 3, '#e8dab8'); P.ell(w - 31, 17, 2, 2, '#e8dab8'); P.ell(w - 35, 19, 2, 2, '#ece0c0');
      hills(P, w, gy - 30, '#5a4a6a', 12, 21, 2);
      farTown(P, 2, gy - 30, 8, 5, 1);
      // the town wall: courses of sandstone blocks under a pale coping, a gold banner here and there
      const py = gy - 4, wh = 30;
      P.rect(0, py - wh, w, wh, '#a8906a'); for (let y = py - wh + 4, r = 0; y < py; y += 5, r++) { P.hline(0, y, w, '#806a4c'); for (let a = (r % 2) * 5; a < w; a += 10) P.vline(a, y, 5, '#806a4c'); }
      for (let a = 0; a < w; a += 7) if ((a * 13) % 5 === 0) P.px(a + 2, py - wh + 8 + (a % 15), '#bca07a');
      P.rect(0, py - wh - 4, w, 5, '#c8b08a'); P.hline(0, py - wh - 4, w, '#dcc8a0'); P.hline(0, py - wh, w, '#806a4c');
      for (const bx of [Math.round(w * .3), Math.round(w * .62)]) { P.rect(bx, py - wh + 2, 8, 16, '#c8902a'); P.rect(bx + 1, py - wh + 2, 6, 1, '#e8b44a'); P.poly([[bx, py - wh + 18], [bx + 8, py - wh + 18], [bx + 4, py - wh + 21]], '#c8902a'); P.px(bx + 4, py - wh + 9, '#f8e0a0'); }
      // the path along it and the grass in front
      P.rect(0, gy - 4, w, 10, '#b88a5a'); for (let i = 0; i < w; i += 3) P.px(i, gy - 4 + (i * 7) % 9, '#9a7048');
      const mead = ['#4a8a40', '#447f3c', '#3e7438', '#386a34', '#326030', '#2c562c', '#284e28'];
      for (let i = 0; i < mead.length; i++) P.rect(0, gy + 6 + i * 14, w, i === mead.length - 1 ? S.vh : 14, mead[i]);
      for (let i = 0; i < w; i += 2) P.px(i, gy + 5 - (i % 3 === 0 ? 1 : 0), '#5aa04c');
      // tufts, flowers, stones, a few bushes and a hay bale in the dusk meadow
      for (let i = 0; i < 70; i++) { const sx = (i * 37 + 11) % w, sy = gy + 12 + (i * 53) % Math.max(20, S.vh - gy - 16), sh = sy > gy + 60 ? '#2a4a26' : '#356a30'; P.px(sx, sy, sh); P.px(sx - 1, sy + 1, sh); P.px(sx + 1, sy + 1, sh); }
      for (let i = 0; i < 18; i++) { const sx = (i * 59 + 23) % w, sy = gy + 14 + (i * 31) % Math.max(20, S.vh - gy - 20); P.px(sx, sy, ['#f0c8e8', '#ffe890', '#c8d8ff'][i % 3]); P.px(sx, sy + 1, '#2e5a2a'); }
      for (let i = 0; i < 5; i++) P.ell((i * 83 + 40) % w, gy + 20 + (i * 47) % Math.max(20, S.vh - gy - 40), 6, 4, '#6a6a7a');
      for (let i = 0; i < 4; i++) { const bx2 = (i * 97 + 14) % w, by2 = gy + 34 + (i * 61) % Math.max(20, S.vh - gy - 60); P.ell(bx2, by2, 20, 12, '#2a5226'); P.ell(bx2 + 2, by2 + 1, 15, 8, '#3a6a32'); P.px(bx2 + 6, by2 + 3, '#c84a5a'); P.px(bx2 + 12, by2 + 5, '#c84a5a'); }
      { const hx = Math.round(w * .38), hy = gy + 8; P.rect(hx, hy, 18, 10, '#c8a050'); P.hline(hx, hy, 18, '#e8c870'); P.hline(hx, hy + 4, 18, '#a88038'); P.vline(hx + 6, hy, 10, '#a88038'); P.vline(hx + 12, hy, 10, '#a88038'); }
    } else {
      sky(P, w, 0, gy - 30, ['#7cc0ec', '#8ecaf0', '#a2d4f2', '#b6def4', '#cae8f6', '#dcf0f8']);
      hills(P, w, gy - 34, '#94b4cc', 8, 12, 2); farTown(P, 4, gy - 38, 4, 11);
      P.rect(0, gy - 34, w, 30, '#4aa6de'); for (let i = 0; i < 18; i++) P.hline((i * 37) % w, gy - 32 + (i * 5) % 26, 4 + i % 3, '#8ad0f4');
      // the stone dry dock and its floor
      // a timber slipway: a stone quay edge, then long planks with nail heads, getting darker toward the bottom
      P.rect(0, gy - 4, w, 6, '#a8a8b0'); P.hline(0, gy - 4, w, '#d0d0d8'); for (let xx = 0; xx < w; xx += 12) P.vline(xx, gy - 3, 5, '#8a8a96');
      const plank = ['#c08a52', '#b47e48', '#c89458', '#ae7842'];
      for (let y = gy + 2, r = 0; y < S.vh; y += 9, r++) {
        P.rect(0, y, w, 9, plank[r % 4]); P.hline(0, y, w, '#d8a868'); P.hline(0, y + 8, w, '#7a4e2e');
        for (let xx = (r * 23) % 46; xx < w; xx += 46) { P.vline(xx, y, 9, '#7a4e2e'); P.px(xx + 2, y + 2, '#5a5a66'); P.px(xx + 2, y + 6, '#5a5a66'); P.px(xx - 3, y + 2, '#5a5a66'); P.px(xx - 3, y + 6, '#5a5a66'); }
        for (let k = 0; k < 4; k++) P.hline((r * 31 + k * 53) % w, y + 3 + k % 4, 6, '#a06a3a');
      }
      for (let i = 0; i < 4; i++) { x.globalAlpha = .12; P.rect(0, gy + 50 + i * 36, w, S.vh, '#2a1a10'); } x.globalAlpha = 1;
      for (let i = 0; i < 6; i++) { const sx = (i * 67 + 30) % w, sy = gy + 30 + (i * 43) % Math.max(20, S.vh - gy - 50); P.hline(sx, sy, 4, '#e8c890'); P.px(sx + 1, sy - 1, '#e8c890'); }
    }
    return c;
  }

  // ---------------------------------------------------------------- the moving parts
  const fishSwim = Array.from({ length: 6 }, (_, i) => ({ id: ['pond_minnow', 'silver_carp', 'reed_perch', 'golden_trout', 'moonfin', 'pond_minnow'][i], x: R() * 200, y: .2 + R() * .7, v: (6 + R() * 10) * (R() < .5 ? -1 : 1), p: R() * 6 }));
  const leaves = Array.from({ length: 6 }, () => ({ x: R() * 200, y: R() * 100, p: R() * 6 }));
  const C = { chopN: 0, fall: -1, grow: 1, hit: 0, patched: 0 };

  function drawFishing(P, t) {
    const { vw: w, gy } = S, dy = gy - 14, pw = Math.round(w * .46);
    // fish under the water
    for (const f of fishSwim) {
      f.x += f.v * S.dt; if (f.x < -20) f.x = w + 10; if (f.x > w + 20) f.x = -10;
      const yy = Math.round(gy + 14 + f.y * (S.vh - gy - 60) + Math.sin(t + f.p) * 3);
      const ic = icon(f.id); P.x.globalAlpha = .75; P.x.drawImage(f.v > 0 ? flip(ic) : ic, Math.round(f.x), yy); P.x.globalAlpha = 1;
    }
    // bubbles
    for (let i = 0; i < 6; i++) { const ph = (t * .3 + i / 6) % 1; P.px(Math.round((i * 53 + 20) % w + Math.sin(t * 2 + i) * 2), Math.round(S.vh - 40 - ph * (S.vh - gy - 40)), '#a8dcf4'); }
    // waves on the surface
    for (let i = 0; i < 14; i++) { const ox = ((i * 29 + t * 6) % (w + 20)) - 10; P.hline(Math.round(ox), gy - 7 + (i % 3) * 3, 5, '#a8e0f8'); }
    // the bucket and the chair
    const cx = pw - 26, bk = cx - 28;   // the chair, the bucket behind it
    P.rect(bk - 16, dy - 9, 12, 9, '#8a5a30'); P.rect(bk - 16, dy - 9, 12, 2, '#b07a42'); P.vline(bk - 10, dy - 7, 7, '#6a4024');
    P.poly([[bk, dy - 11], [bk + 11, dy - 11], [bk + 10, dy], [bk + 1, dy]], '#a8a4b0'); P.hline(bk, dy - 11, 11, '#d0ccd8'); P.hline(bk + 1, dy - 6, 9, '#8a8694'); P.line(bk + 1, dy - 11, bk + 5, dy - 16, '#5a5664'); P.line(bk + 10, dy - 11, bk + 6, dy - 16, '#5a5664');
    { const ids = Object.keys(S.bag), nC = Math.min(3, ids.length); for (let i = 0; i < nC; i++) P.x.drawImage(icon(ids[i]), bk - 4 + i * 3, dy - 22 + (i % 2) * 2); }
    // the angler: sitting, a gentle bob; reeling when a catch comes
    const catching = S.ev.length && S.ev[0].t < 1.2;
    const fr = catching ? reel[Math.floor(t * 8) % 2] : frames[Math.floor(t * 1.5) % frames.length];
    // the folding chair (behind and under the angler)
    const ch = cx - 5, seat = dy - 11;
    P.line(ch, dy - 1, ch + 10, seat + 1, '#6a4024'); P.line(ch + 10, dy - 1, ch, seat + 1, '#6a4024'); P.line(ch + 1, dy - 1, ch + 11, seat + 1, '#86522a');
    P.line(ch - 1, seat - 12, ch + 1, seat, '#6a4024'); P.rect(ch - 2, seat - 12, 3, 9, '#c8463a'); P.rect(ch - 1, seat, 13, 3, '#c8463a'); P.hline(ch - 1, seat, 13, '#e0624a'); P.hline(ch - 1, seat + 3, 13, '#6a4024');
    const fx0 = ch - 14, fy0 = seat - 33;
    P.x.drawImage(fr, fx0, fy0);
    // the rod tip (from the frame's pose), the line, the bobber
    const tipX = fx0 + fr.tip[0], tipY = fy0 + fr.tip[1];
    const bobX = Math.round(w * .78), bob = catching ? Math.sin(S.ev[0].t * 30) * 2 + 3 : Math.round(Math.sin(t * 2.2) * 1.2);
    const by = gy - 8 + bob;
    for (let i = 0; i <= 24; i++) { const u = i / 24, lx = tipX + (bobX - tipX) * u, ly = tipY + (by - tipY) * u + Math.sin(u * Math.PI) * 6; P.px(Math.round(lx), Math.round(ly), '#f4f0e8'); }
    P.rect(bobX - 1, by - 3, 3, 3, '#e83a3a'); P.rect(bobX - 1, by, 3, 2, '#ffffff'); P.px(bobX, by - 4, '#3a2a2a');
    const rr = (t * 1.2) % 1; P.x.globalAlpha = 1 - rr; P.hline(Math.round(bobX - 3 - rr * 8), by + 2, Math.round(6 + rr * 16), '#d8f2ff'); P.x.globalAlpha = 1;
    // a catch: the fish jumps from the bobber in an arc into the bucket
    if (S.ev.length) {
      const e = S.ev[0], u = Math.min(1, Math.max(0, (e.t - .5) / 1));
      if (e.t > .5 && u < 1) { const fx = bobX + (bk + 5 - bobX) * u, fy = by - 8 - Math.sin(u * Math.PI) * 50 + u * (dy - 12 - by + 8); P.x.drawImage(icon(e.id), Math.round(fx - 9), Math.round(fy - 9)); for (let k = 0; k < 3; k++) P.px(Math.round(bobX + (k - 1) * 4), by - 2 - Math.round(Math.sin(e.t * 9 + k) * 3), '#ffffff'); }
      if (u >= 1) splashPop(bk + 5, dy - 20, e.id);
    }
  }
  function splashPop(x, y, id) { if (S.ev[0].popped) return; S.ev[0].popped = true; S.fx.push({ x, y, id, t: 0 }); }

  function drawWood(P, t) {
    const { vw: w, gy } = S;
    // the log pile behind (grows with the trees felled)
    const pileX = 8, n = Math.min(14, S.n);
    for (let i = 0; i < n; i++) { const row = i < 5 ? 0 : i < 9 ? 1 : i < 12 ? 2 : 3, col = i < 5 ? i : i < 9 ? i - 5 : i < 12 ? i - 9 : i - 12; const lx = pileX + col * 9 + row * 4, ly = gy - 9 - row * 8; P.ell(lx, ly, 10, 9, '#8a5a32'); P.ell(lx + 1, ly + 1, 8, 7, '#e8c088'); P.ell(lx + 3, ly + 3, 4, 3, '#c8965a'); P.px(lx, ly + 4, '#5a3a20'); }
    // the tree: trunk and canopy; a notch that grows with each strike; it falls when a log comes (an event)
    const tx = Math.round(w * .66), base = gy - 2;
    const fallU = C.fall >= 0 ? Math.min(1, C.fall / 1.1) : 0, ang = (fallU * fallU) * Math.PI / 2;
    const grow = C.grow;
    const drawTree = (X) => {
      const th = Math.round(64 * grow), tw = Math.max(3, Math.round(9 * grow));
      X.save(); X.translate(tx, base); X.rotate(ang);
      const Q = painter(X);
      Q.rect(-Math.floor(tw / 2), -th, tw, th, '#8a5a32'); Q.rect(-Math.floor(tw / 2) + 1, -th, 2, th, '#a8703e'); Q.vline(Math.floor(tw / 2) - 1, -th, th, '#6a4024');
      if (C.fall < 0 && grow >= 1) { const nd = Math.min(5, C.chopN); Q.rect(-Math.floor(tw / 2), -14, nd, 5, '#e8c088'); Q.px(-Math.floor(tw / 2) + nd, -12, '#c8965a'); }
      const cs = Math.round(44 * grow), cy0 = -th - cs * .55;
      for (const [a, b, ww, hh, c] of [[-cs * .55, cy0 + cs * .25, cs * .7, cs * .6, '#3e8a34'], [-cs * .05, cy0 + cs * .2, cs * .65, cs * .6, '#3e8a34'], [-cs * .45, cy0 - cs * .05, cs * .9, cs * .7, '#4fa03e'], [-cs * .3, cy0 - cs * .2, cs * .5, cs * .4, '#62b446']]) Q.ell(Math.round(a), Math.round(b), Math.round(ww), Math.round(hh), c);
      for (const [a, b] of [[-.2, -.1], [.05, .0], [-.35, .15]]) Q.ell(Math.round(cs * a), Math.round(cy0 + cs * b), 6, 4, '#86cc58');
      X.restore();
    };
    drawTree(P.x);
    P.ell(tx - 6, base - 3, 12, 5, '#8a5a32'); P.ell(tx - 5, base - 4, 10, 3, '#e8c088');
    if (C.fall >= 0 && C.fall > 1.1 && C.fall < 1.6) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI, rr = (C.fall - 1.1) * 60; P.x.globalAlpha = 1 - (C.fall - 1.1) * 2; P.ell(Math.round(tx + 30 + Math.cos(a) * rr), Math.round(base - 4 - Math.sin(a) * rr * .3), 5, 3, '#d8c8a8'); P.x.globalAlpha = 1; }
    // the woodcutter: swing cycle 1.4 s, the strike on frame 2
    const cyc = (t % 1.4) / 1.4, fi = cyc < .35 ? 0 : cyc < .55 ? 1 : cyc < .7 ? 2 : 3;
    if (fi === 2 && C.lastFi !== 2 && C.fall < 0 && grow >= 1) { C.chopN = (C.chopN + 1) % 6; C.hit = .25; for (let k = 0; k < 5; k++) S.fx.push({ chip: true, x: tx - 5, y: base - 12, vx: -(20 + Math.random() * 40), vy: -(20 + Math.random() * 50), t: 0 }); }
    C.lastFi = fi;
    const shake = C.hit > 0 ? 1 : 0;
    P.x.drawImage(frames[fi], tx - 44 + shake, gy - 46);
    // falling leaves
    for (const l of leaves) { const ly = (l.y + t * 9) % (gy + 10), lx = (l.x + Math.sin(t + l.p) * 8) % w; if (ly > 10) P.px(Math.round(lx), Math.round(ly), (l.p > 3 ? '#86cc58' : '#e8c050')); }
  }

  function drawShip(P, t) {
    const { vw: w, gy } = S;
    // the hull, side view, on its cradle: bow to the right
    const hx = 6, hw = w - 12, top = gy - 74, keel = gy - 18;
    const holes = 8, fixed = Math.min(holes, Math.floor(S.n / Math.max(1, S.max / holes)) + (S.n > 0 ? 1 : 0));
    // masts and furled sails above the hull
    for (const [mx, mh] of [[.34, 92], [.66, 104]]) { const X = Math.round(hx + hw * mx); P.rect(X, top - mh, 4, mh, '#7a4a28'); P.rect(X + 1, top - mh, 1, mh, '#9a6a3a'); P.rect(X - 22, top - mh + 18, 48, 4, '#f0e8d4'); P.hline(X - 22, top - mh + 21, 48, '#c8bca0'); P.rect(X - 18, top - mh + 46, 40, 4, '#f0e8d4'); P.hline(X - 18, top - mh + 49, 40, '#c8bca0'); P.line(X + 2, top - mh, hx + hw - 4, top - 6, '#5a3a24'); }
    const fl = Math.round(hx + hw * .66 + 4), ft = top - 104; for (let j = 0; j < 6; j++) P.hline(fl, ft + j, 10 + Math.round(Math.sin(t * 6 + j * .6) * 2), j < 3 ? '#d8463a' : '#f4f0e8');
    // hull shape: a deck line with a raised stern, a curved bottom
    const pts = [[hx, top - 8], [hx + 20, top - 8], [hx + 22, top], [hx + hw - 26, top], [hx + hw, top - 12], [hx + hw - 10, keel - 20], [hx + hw - 40, keel], [hx + 40, keel], [hx + 6, keel - 22]];
    P.poly(pts, '#8a5432');
    for (let y = top + 4; y < keel; y += 6) P.hline(hx + 4, y, hw - 8, '#6a3e24');
    P.poly([[hx, top - 8], [hx + 20, top - 8], [hx + 22, top], [hx + hw - 26, top], [hx + hw, top - 12], [hx + hw - 2, top - 8], [hx + hw - 26, top + 4], [hx + 2, top + 4]], '#b8783e');
    for (let i = 0; i < 9; i++) P.rect(Math.round(hx + 30 + i * (hw - 70) / 8), top + 9, 5, 5, '#3a2618');
    P.rect(hx + 4, keel - 30, hw - 30, 2, '#e8c050');
    // the holes: dark gaps; patched ones are fresh light planks with nail heads
    for (let i = 0; i < holes; i++) {
      const X = Math.round(hx + 26 + i * (hw - 64) / (holes - 1)), Y = keel - 26 + (i % 2) * 8 - Math.round(Math.sin(i * 1.7) * 4);
      if (i < fixed) { P.rect(X - 1, Y - 1, 13, 6, '#e0a868'); P.hline(X - 1, Y - 1, 13, '#f0c080'); P.px(X, Y + 1, '#5a5a66'); P.px(X + 10, Y + 1, '#5a5a66'); }
      else { P.rect(X, Y, 11, 4, '#24160e'); P.px(X + 3, Y - 1, '#24160e'); P.px(X + 7, Y + 4, '#24160e'); }
    }
    // the cradle under the hull, the scaffold in front
    for (const cx of [.18, .45, .72]) { const X = Math.round(hx + hw * cx); P.poly([[X - 8, gy - 4], [X + 8, gy - 4], [X + 4, keel - 2], [X - 4, keel - 2]], '#86522a'); P.hline(X - 8, gy - 5, 16, '#a8703a'); }
    const sx = Math.round(w * .5), sy = gy - 30;
    P.rect(sx - 26, sy, 56, 4, '#c08848'); P.hline(sx - 26, sy, 56, '#d8a060'); P.rect(sx - 24, sy + 4, 3, gy - sy - 4, '#86522a'); P.rect(sx + 25, sy + 4, 3, gy - sy - 4, '#86522a'); P.line(sx - 22, sy + 4, sx + 24, gy - 5, '#86522a');
    // props on the dock floor
    P.rect(10, gy - 14, 14, 10, '#c08848'); P.hline(10, gy - 10, 14, '#8a5a30'); P.rect(28, gy - 12, 10, 8, '#7a5a3a'); P.ell(28, gy - 15, 10, 4, '#2a1e1a');
    P.ell(w - 30, gy - 10, 16, 8, '#c8a060'); P.ell(w - 26, gy - 8, 8, 4, '#8a6a3a');
    // the shipwright: the hammer every 0.9 s, sparks on the strike
    const cyc = (t % .9) / .9, fi = cyc < .5 ? 0 : cyc < .7 ? 1 : 2;
    if (fi === 2 && C.lastFi !== 2) { C.hit = .15; for (let k = 0; k < 4; k++) S.fx.push({ spark: true, x: sx + 24, y: sy - 20, vx: 10 + Math.random() * 30, vy: -(10 + Math.random() * 30), t: 0 }); }
    C.lastFi = fi;
    P.x.drawImage(frames[fi], sx - 14, sy - 44);
    P.rect(sx + 22, sy - 26, 10, 3, '#e0a868'); // the plank being nailed
    gulls(P, w, t, 18);
  }

  const G = { x: .3, dir: 1, pick: 0 };
  function drawGuard(P, t) {
    const { vw: w, gy } = S;
    // the watchtower with its torch on the right
    const tx = w - 34;
    P.rect(tx - 2, gy - 92, 30, 88, '#b89c74'); for (let y = gy - 88, r = 0; y < gy - 4; y += 5, r++) { P.hline(tx - 2, y, 30, '#8a7254'); for (let a = tx - 2 + (r % 2) * 5; a < tx + 28; a += 10) P.vline(a, y, 5, '#8a7254'); }
    P.vline(tx + 27, gy - 92, 88, '#8a7254'); P.rect(tx - 4, gy - 94, 34, 4, '#d0b890');
    P.poly([[tx - 6, gy - 93], [tx + 4, gy - 106], [tx + 22, gy - 106], [tx + 32, gy - 93]], '#9a4a34'); for (let y = gy - 103; y < gy - 93; y += 3) P.hline(tx - 2 + (gy - 93 - y) / 2, y, 30 - (gy - 93 - y), '#7a3a2a');
    P.rect(tx + 7, gy - 84, 12, 14, '#2a1e1a'); P.ell(tx + 7, gy - 88, 12, 8, '#2a1e1a');
    const fl = Math.sin(t * 13) > 0 ? 1 : 0; P.rect(tx + 9, gy - 72, 8, 2, '#a8692e'); P.ell(tx + 9, gy - 81 - fl, 8, 9, '#ff9a2a'); P.ell(tx + 11, gy - 78 - fl, 4, 5, '#ffe070');
    P.rect(tx + 6, gy - 60, 14, 22, '#c8902a'); P.rect(tx + 7, gy - 60, 12, 1, '#e8b44a'); P.poly([[tx + 6, gy - 38], [tx + 20, gy - 38], [tx + 13, gy - 34]], '#c8902a'); P.px(tx + 13, gy - 50, '#f8e0a0');
    P.x.globalAlpha = .14 + fl * .04; P.ell(tx - 1, gy - 92, 28, 26, '#ffb050'); P.x.globalAlpha = .1; P.ell(tx - 9, gy - 100, 44, 42, '#ffb050'); P.x.globalAlpha = 1;
    // fireflies
    for (let i = 0; i < 9; i++) { const fx = (i * 41 + Math.sin(t * .6 + i) * 14) % w, fy = gy - 6 - ((i * 23) % 40) + Math.sin(t * 1.3 + i * 2) * 5; if (Math.sin(t * 3 + i * 1.7) > -.2) P.px(Math.round(fx), Math.round(fy), '#f8ff9a'); }
    // the guard walks the palisade and back; on a find, crouches to pick it up
    let fr;
    if (S.ev.length && S.ev[0].t < 1.1) { G.pick = 1; fr = (G.dir > 0 ? pickF : pickL)[0]; }
    else { G.pick = 0; G.x += G.dir * S.dt * .045; if (G.x > .72) G.dir = -1; if (G.x < .12) G.dir = 1; fr = (G.dir > 0 ? frames : framesL)[Math.floor(t * 5) % 4]; }
    const gx = Math.round(w * G.x);
    P.x.globalAlpha = .3; P.ell(gx + 6, gy - 2, 22, 5, '#1a1020'); P.x.globalAlpha = 1;
    P.x.drawImage(fr, gx - 3, gy - 44);
    const lx = gx - 3 + (G.dir > 0 ? fr.tip[0] : 40 - fr.tip[0]), ly = gy - 44 + fr.tip[1] - 4;
    P.x.globalAlpha = .18; P.ell(lx - 14, ly - 16, 28, 26, '#ffd070'); P.x.globalAlpha = 1;
    if (S.ev.length && !S.ev[0].popped && S.ev[0].t > .6) { S.ev[0].popped = true; S.fx.push({ x: gx + 16, y: gy - 30, id: S.ev[0].id, t: 0 }); }
  }

  function draw() {
    const X = bx, P = painter(X), t = S.t;
    X.drawImage(S.bg, 0, 0);
    if (kind === 'woodcutting') clouds(P, S.vw, t * .6, 4); else if (kind !== 'guard') clouds(P, S.vw, t, 6);
    if (kind === 'fishing') { gulls(P, S.vw, t, 22); drawFishing(P, t); }
    else if (kind === 'woodcutting') drawWood(P, t);
    else if (kind === 'guard') drawGuard(P, t);
    else drawShip(P, t);
    // effects: chips, sparks, the "+1" pop of a catch
    for (const f of S.fx) {
      f.t += S.dt;
      if (f.chip || f.spark) { f.vy += 160 * S.dt; f.x += f.vx * S.dt; f.y += f.vy * S.dt; P.px(Math.round(f.x), Math.round(f.y), f.spark ? (f.t < .15 ? '#ffffff' : '#ffd870') : '#e8c088'); if (f.chip) P.px(Math.round(f.x) + 1, Math.round(f.y), '#c8965a'); }
      else { const y = f.y - f.t * 22; X.globalAlpha = Math.max(0, 1 - f.t / 1.4); X.drawImage(icon(f.id), Math.round(f.x - 9), Math.round(y - 18)); P.rect(Math.round(f.x + 10), Math.round(y - 12), 5, 1, '#ffffff'); P.rect(Math.round(f.x + 12), Math.round(y - 14), 1, 5, '#ffffff'); X.globalAlpha = 1; }
    }
    S.fx = S.fx.filter((f) => f.t < (f.chip || f.spark ? .6 : 1.4));
    ctx.imageSmoothingEnabled = false; ctx.drawImage(buf, 0, 0, S.vw * S.k, S.vh * S.k);
  }
  function update(dt) {
    S.t += dt; S.dt = dt;
    if (C.hit > 0) C.hit -= dt;
    if (S.ev.length) {
      const e = S.ev[0]; e.t += dt;
      if (kind === 'woodcutting') { if (C.fall < 0) C.fall = 0; }
      if (kind === 'shipwright' && !e.popped) { e.popped = true; S.fx.push({ x: S.vw * .5 + 26, y: S.gy - 60, id: e.id, t: 0 }); }
      const done = kind === 'fishing' ? e.t > 1.7 : kind === 'woodcutting' ? e.t > 2.4 : kind === 'guard' ? e.t > 1.6 : e.t > 1.2;
      if (done) S.ev.shift();
    }
    if (C.fall >= 0) { C.fall += dt; if (C.fall > 1.1 && !C.popped) { C.popped = true; const id = S.lastWood || 'oak_log'; S.fx.push({ x: S.vw * .66 + 30, y: S.gy - 8, id, t: 0 }); } if (C.fall > 2) { C.fall = -1; C.popped = false; C.grow = .15; C.chopN = 0; } }
    if (C.grow < 1) C.grow = Math.min(1, C.grow + dt * .9);
  }
  function frame(ts) { if (!S.run) return; const dt = Math.min(.05, (ts - (S.last || ts)) / 1000); S.last = ts; update(dt); draw(); requestAnimationFrame(frame); }
  addEventListener('resize', () => { if (S.run) size(); });
  return {
    start() { if (S.run) return; S.run = true; S.last = 0; size(); requestAnimationFrame(frame); },
    stop() { S.run = false; },
    // the task as the server says: the bag so far and the attempts
    set(task) { S.bag = task?.bag || {}; S.n = task?.attempts || 0; S.max = task?.max || 96; },
    // one thing the server has just rolled: play its catch
    event(id) { if (S.ev.length < 4) S.ev.push({ id, t: 0 }); if (kind === 'woodcutting') S.lastWood = id; },
    draw() { if (!S.bg) size(); update(.016); draw(); },
  };
}
