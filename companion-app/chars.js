// The people: the player's own character (its look from the game: body, hair style and colour, skin, outfit) and the five
// villagers, as top-down walking sprites (down / up / side, idle and two steps) and as side-view figures posed for the tasks.
import { sprite, flip, light, dark } from './px.js';

const SKIN = { skin_1: '#e0a882', skin_2: '#f6d2b8', skin_4: '#b87a52', skin_3: '#8a5636' };
const HAIR = { teal: '#33cbbd', black: '#3a2a26', brown: '#7a4a2a', auburn: '#b04a2a', blonde: '#e8c060', white: '#e8e4ea', grey: '#a8a4a8' };
const CLOTH = { home: '#f4ecd8', leather: '#c08a52', dark: '#4e4258' };   // the game's three outfits: Val's cream chiton, light leather, dark cloth
const EYES = { brown: '#6a4224', blue: '#2a6ab8', green: '#3a8a56' };      // (the game's EYE_HEX, a touch brighter to read at this size)

// a look from the game's appearance record
export function heroLook(a = {}) {
  const body = a.body === 'm' ? 'm' : 'f';
  const dress = /leather/.test(a.outfit || '') ? 'leather' : /dark|battle/.test(a.outfit || '') ? 'dark' : 'home';
  const style = { f_braids: 'braids', f_bun: 'bun', f_loose: 'long', m_crop: 'short', m_curls: 'curls', m_locks: 'locks' }[a.hair] || (body === 'f' ? 'braids' : 'short');
  // the cream chiton has the sea's blue key at its hem (the game's "Val's Dress")
  return { body, skin: SKIN[a.skin] || SKIN.skin_2, hair: HAIR[a.hair_color] || (body === 'f' ? HAIR.teal : HAIR.black), style, eye: EYES[a.eye_color] || EYES.blue,
    top: CLOTH[dress], trim: dress === 'home' ? '#3a76c0' : dress === 'leather' ? '#7a4a26' : '#8a7a9a', legs: dress === 'dark' ? '#3a3046' : dress === 'leather' ? '#8a5a32' : '#e0d4bc', skirt: body === 'f' };
}
export const NPC_LOOKS = {
  fisher: { body: 'm', skin: SKIN.skin_1, hair: HAIR.grey, style: 'short', beard: HAIR.grey, hat: 'straw', top: '#4a7ac8', trim: '#e8e0d0', legs: '#6a5a44' },
  woodcutter: { body: 'm', skin: SKIN.skin_4, hair: HAIR.brown, style: 'short', beard: '#6a3a1e', hat: 'cap', hatC: '#3a6a3a', top: '#c8463a', trim: '#7a2a24', legs: '#4a4a5a', plaid: true },
  shipwright: { body: 'm', skin: SKIN.skin_3, hair: HAIR.black, style: 'short', hat: 'bandana', hatC: '#d8463a', top: '#3a8a8a', trim: '#8a5a32', legs: '#5a4a3a', apron: '#a8743e' },
  trader: { body: 'f', skin: SKIN.skin_2, hair: HAIR.auburn, style: 'bun', hat: 'scarf', hatC: '#e8b84a', top: '#4a9a5a', trim: '#e8c050', legs: '#3a6a44', skirt: true },
  guard: { body: 'm', skin: SKIN.skin_4, hair: HAIR.black, style: 'short', beard: '#3a2a26', hat: 'helm', top: '#b83a34', trim: '#e8c050', legs: '#6a4a2e' },
  banker: { body: 'f', skin: SKIN.skin_1, hair: HAIR.black, style: 'bun', top: '#6a4aa8', trim: '#f0c850', legs: '#4a3478', skirt: true, necklace: true },
};

// ---------------------------------------------------------------- top-down (16 x 22): dir 'down' | 'up' | 'side' (facing right)
function drawTop(P, L, dir, step) {
  const bob = step ? 1 : 0, y0 = 1 + bob;
  // legs
  const lh = 3;
  if (dir === 'side') {
    const a = step === 1 ? -1 : step === 2 ? 1 : 0;
    P.rect(6 + a, 15 + y0, 2, lh - bob, L.legs); P.rect(9 - a, 15 + y0, 2, lh - bob, dark(L.legs, .15));
    P.rect(6 + a, 18, 3, 1, '#3a2a24'); P.rect(9 - a, 18, 3, 1, '#2a1e1a');
  } else {
    const l = step === 1 ? 1 : 0, r = step === 2 ? 1 : 0;
    P.rect(5, 15 + y0, 2, lh - bob - l, L.legs); P.rect(9, 15 + y0, 2, lh - bob - r, L.legs);
    P.rect(5, 18 - l, 2, 1, '#3a2a24'); P.rect(9, 18 - r, 2, 1, '#3a2a24');
  }
  // body
  if (L.skirt) P.poly([[4, 10 + y0], [12, 10 + y0], [13, 17 + y0], [3, 17 + y0]], L.top);
  else P.rect(4, 10 + y0, 8, 6, L.top);
  if (L.plaid) for (let j = 0; j < 6; j += 2) P.hline(4, 11 + y0 + j, 8, L.trim);
  if (L.apron && dir !== 'up') P.rect(5, 12 + y0, 6, 5, L.apron);
  P.hline(L.skirt ? 4 : 4, 13 + y0, 8, L.trim);                                    // belt
  if (L.necklace && dir === 'down') { P.px(7, 11 + y0, '#f0c850'); P.px(8, 11 + y0, '#f0c850'); }
  // arms
  const sw = step === 1 ? 1 : step === 2 ? -1 : 0;
  if (dir === 'side') { P.rect(7, 11 + y0 + sw, 2, 3, dark(L.top, .12)); P.px(7, 14 + y0 + sw, L.skin); P.px(8, 14 + y0 + sw, L.skin); }
  else { P.rect(3, 11 + y0 + sw, 1, 3, L.top); P.rect(12, 11 + y0 - sw, 1, 3, L.top); P.px(3, 14 + y0 + sw, L.skin); P.px(12, 14 + y0 - sw, L.skin); }
  // head
  const hx = dir === 'side' ? 4 : 3;
  P.ell(hx, y0, 10, 10, L.skin);
  // hair
  const H = L.hair, hd = dark(H, .18);
  if (dir === 'up') {
    P.ell(hx, y0, 10, 10, H); P.hline(hx + 2, y0 + 8, 6, hd);
  } else if (dir === 'down') {
    P.ell(hx, y0, 10, 6, H); P.rect(hx, y0 + 3, 1, 4, H); P.rect(hx + 9, y0 + 3, 1, 4, H); P.px(hx + 3, y0 + 5, H); P.px(hx + 6, y0 + 5, H);
    const ec = L.eye || '#24141f'; P.px(hx + 3, y0 + 6, '#24141f'); P.px(hx + 3, y0 + 7, ec); P.px(hx + 6, y0 + 6, '#24141f'); P.px(hx + 6, y0 + 7, ec);
    P.px(hx + 2, y0 + 8, '#f0889a'); P.px(hx + 7, y0 + 8, '#f0889a');
    if (L.beard) { P.rect(hx + 2, y0 + 8, 6, 2, L.beard); P.px(hx + 3, y0 + 10, L.beard); P.px(hx + 6, y0 + 10, L.beard); P.hline(hx + 4, y0 + 8, 2, '#a85a4a'); }
  } else {
    P.ell(hx, y0, 10, 6, H); P.rect(hx, y0 + 2, 4, 6, H);
    P.px(hx + 7, y0 + 6, '#24141f'); P.px(hx + 7, y0 + 7, L.eye || '#24141f'); P.px(hx + 7, y0 + 8, '#f0889a'); P.px(hx + 9, y0 + 6, L.skin);
    if (L.beard) { P.rect(hx + 5, y0 + 8, 4, 2, L.beard); }
  }
  // styles
  const s = L.style;
  if (s === 'bun') { if (dir === 'side') P.ell(hx - 1, y0 - 1, 4, 4, H); else P.ell(hx + 3, y0 - 2, 4, 4, H); }
  if (s === 'braids' && dir !== 'side') { P.rect(hx - 1, y0 + 6, 2, 5, H); P.rect(hx + 9, y0 + 6, 2, 5, H); P.px(hx - 1, y0 + 11, L.trim); P.px(hx + 10, y0 + 11, L.trim); }
  if (s === 'braids' && dir === 'side') { P.rect(hx - 1, y0 + 6, 2, 5, H); }
  if (s === 'long') { if (dir === 'side') P.rect(hx - 1, y0 + 3, 3, 8, H); else { P.rect(hx - 1, y0 + 3, 2, 9, H); P.rect(hx + 9, y0 + 3, 2, 9, H); } if (dir === 'up') P.rect(hx, y0 + 6, 10, 6, H); }
  if (s === 'curls') { for (const [i, j] of [[0, 1], [3, -1], [6, -1], [9, 1]]) P.ell(hx + i - 1, y0 + j, 3, 3, H); }
  if (s === 'locks') { if (dir !== 'side') { P.rect(hx - 1, y0 + 4, 2, 6, H); P.rect(hx + 9, y0 + 4, 2, 6, H); } else P.rect(hx - 1, y0 + 4, 3, 7, H); }
  // hats
  if (L.hat === 'straw') { P.ell(hx - 2, y0 + 1, 14, 5, '#f0cc60'); P.ell(hx + 1, y0 - 2, 8, 6, '#e8c050'); P.hline(hx + 1, y0 + 2, 8, '#c84a3a'); }
  if (L.hat === 'cap') { P.ell(hx, y0 - 1, 10, 6, L.hatC); P.ell(hx + 3, y0 - 2, 4, 2, light(L.hatC, .2)); }
  if (L.hat === 'bandana') { P.ell(hx, y0, 10, 5, L.hatC); P.rect(hx, y0 + 3, 10, 1, dark(L.hatC, .2)); if (dir !== 'down') P.rect(dir === 'side' ? hx - 2 : hx + 4, y0 + 3, 3, 2, L.hatC); }
  if (L.hat === 'scarf') { P.ell(hx, y0 - 1, 10, 6, L.hatC); P.hline(hx, y0 + 4, 10, dark(L.hatC, .2)); }
  if (L.hat === 'helm') { P.ell(hx, y0 - 1, 10, 7, '#d0a040'); P.hline(hx, y0 + 4, 10, '#a87a2a'); if (dir === 'side') P.rect(hx + 1, y0 - 4, 6, 3, '#d8463a'); else P.rect(hx + 3, y0 - 4, 4, 4, '#d8463a'); }
}

const cache = new Map();
// { down: [idle, step1, step2], up: [...], right: [...], left: [...] }
export function walker(L, key) {
  if (key && cache.has(key)) return cache.get(key);
  const mk = (dir, st) => sprite(16, 22, (P) => drawTop(P, L, dir, st), { out: .66 });
  const W = { down: [0, 1, 2].map((s) => mk('down', s)), up: [0, 1, 2].map((s) => mk('up', s)), right: [0, 1, 2].map((s) => mk('side', s)) };
  W.left = W.right.map(flip);
  if (key) cache.set(key, W);
  return W;
}

// ---------------------------------------------------------------- the dialog portrait (32 x 32, the head and shoulders)
export function portrait(L) {
  return sprite(34, 34, (P) => {
    P.x.translate(1, 1);
    P.ell(4, 22, 24, 16, L.top); if (L.plaid) for (let j = 24; j < 32; j += 3) P.hline(6, j, 20, L.trim); if (L.apron) P.rect(10, 26, 12, 6, L.apron);
    P.hline(9, 23, 14, L.trim); if (L.necklace) { P.ell(13, 24, 6, 3, '#f0c850'); }
    P.rect(13, 19, 6, 4, dark(L.skin, .1));
    P.ell(6, 2, 20, 20, L.skin);
    const H = L.hair;
    P.ell(5, 0, 22, 12, H); P.rect(5, 6, 3, 8, H); P.rect(24, 6, 3, 8, H);
    if (L.style === 'bun') P.ell(11, -3, 10, 7, H);
    if (L.style === 'braids') { P.rect(3, 10, 4, 12, H); P.rect(25, 10, 4, 12, H); P.rect(3, 21, 4, 2, L.trim); P.rect(25, 21, 4, 2, L.trim); }
    if (L.style === 'long' || L.style === 'locks') { P.rect(3, 6, 4, 16, H); P.rect(25, 6, 4, 16, H); }
    if (L.style === 'curls') for (const [i, j] of [[4, 2], [10, -2], [17, -2], [23, 2]]) P.ell(i, j, 6, 6, H);
    P.rect(10, 11, 3, 2, dark(H, .2)); P.rect(19, 11, 3, 2, dark(H, .2));
    const ec = L.eye || '#24141f'; P.rect(11, 13, 2, 3, ec); P.rect(19, 13, 2, 3, ec); P.hline(11, 15, 2, '#24141f'); P.hline(19, 15, 2, '#24141f'); P.px(11, 13, '#ffffff'); P.px(19, 13, '#ffffff');
    P.rect(8, 16, 3, 2, '#f4909e'); P.rect(21, 16, 3, 2, '#f4909e'); P.hline(14, 18, 4, '#a8524a');
    if (L.beard) { P.ell(9, 15, 14, 9, L.beard); P.hline(13, 18, 6, '#8a3a32'); }
    if (L.hat === 'straw') { P.ell(0, 3, 32, 8, '#f0cc60'); P.ell(7, -2, 18, 9, '#e8c050'); P.rect(7, 4, 18, 2, '#c84a3a'); }
    if (L.hat === 'cap') { P.ell(5, -1, 22, 10, L.hatC); P.rect(5, 6, 22, 2, dark(L.hatC, .2)); }
    if (L.hat === 'bandana') { P.ell(5, 0, 22, 9, L.hatC); P.rect(5, 6, 22, 2, dark(L.hatC, .2)); for (const [i, j] of [[9, 2], [15, 1], [21, 3]]) P.px(i, j, '#ffffff'); }
    if (L.hat === 'scarf') { P.ell(4, -1, 24, 11, L.hatC); P.rect(4, 7, 24, 2, dark(L.hatC, .2)); }
    if (L.hat === 'helm') { P.ell(5, -1, 22, 13, '#d8a840'); P.rect(5, 8, 22, 2, '#a87a2a'); P.rect(6, 9, 3, 7, '#c89838'); P.rect(23, 9, 3, 7, '#c89838'); P.ell(11, -4, 10, 6, '#d8463a'); P.px(10, 3, '#fff0b0'); }
  }, { out: .66 });
}

// ---------------------------------------------------------------- side view (40 x 44), posed. pose: joints in pixels
// { sit, lean, armA / armB: [shoulder angle, elbow angle] in radians (0 = straight down, positive = forward),
//   legA / legB: [hip, knee], tool: 'rod' | 'axe' | 'hammer' | null, toolAngle }
function seg(P, x, y, a, len, w, c) { const x2 = x + Math.sin(a) * len, y2 = y + Math.cos(a) * len; P.thick(x, y, x2, y2, w, c); return [x2, y2]; }
function drawSide(P, L, p) {
  const cx = 16, hipY = p.sit ? 30 : 29, lean = p.lean || 0;
  const shX = cx + Math.sin(lean) * 10, shY = hipY - Math.cos(lean) * 10;
  // back leg, back arm, body, front leg, front arm, head
  const leg = (h, c) => { const [kx, ky] = seg(P, cx, hipY, h[0], 7, 3, c); const [fx, fy] = seg(P, kx, ky, h[0] + h[1], 7, 3, c); P.rect(Math.round(fx) - 1, Math.round(fy), 5, 2, '#3a2a24'); };
  const arm = (h, c) => { const [ex, ey] = seg(P, shX, shY + 1, h[0], 6, 3, c); const [hx, hy] = seg(P, ex, ey, h[0] + h[1], 5, 3, c); P.rect(Math.round(hx) - 1, Math.round(hy) - 1, 3, 3, L.skin); return [hx, hy, h[0] + h[1]]; };
  leg(p.legB || [0.1, 0], dark(L.legs, .2));
  arm(p.armB || [0.2, 0.3], dark(L.top, .2));
  // torso: a slanted box
  P.poly([[cx - 3, hipY + 1], [cx + 4, hipY + 1], [shX + 4, shY], [shX - 3, shY]], L.top);
  if (L.skirt && !p.sit) P.poly([[cx - 4, hipY - 2], [cx + 5, hipY - 2], [cx + 7, hipY + 8], [cx - 5, hipY + 8]], L.top);
  if (L.plaid) for (let j = 0; j < 9; j += 3) P.hline(Math.round(shX) - 3, Math.round(shY) + j, 7, L.trim);
  if (L.apron) P.rect(cx + 1, Math.round(shY) + 4, 4, 8, L.apron);
  P.hline(cx - 3, hipY - 2, 8, L.trim);
  leg(p.legA || [-0.1, 0], L.legs);
  // the tool sits in the front hand
  const fr = arm(p.armA || [-0.2, 0.3], L.top);
  p._hand = [fr[0], fr[1]];
  if (p.tool && p.tool !== 'lantern') {
    const [hx, hy] = fr, ta = p.toolAngle ?? fr[2];
    if (p.tool === 'rod') { const [tx, ty] = seg(P, hx, hy, ta, 26, 1, '#8a5a2a'); P.px(Math.round(tx), Math.round(ty), '#e8e0d0'); p._tip = [Math.round(tx) + 4, Math.round(ty) + 4]; P.rect(Math.round(hx) - 1, Math.round(hy) + 1, 3, 2, '#3a3440'); }
    if (p.tool === 'axe') { const [tx, ty] = seg(P, hx, hy, ta, 11, 2, '#8a5a2a'); p._tip = [Math.round(tx) + 4, Math.round(ty) + 4]; const nx = Math.cos(ta), ny = -Math.sin(ta); P.poly([[tx - nx * 1, ty - ny * 1], [tx + nx * 5 - Math.sin(ta) * 2, ty + ny * 5 - Math.cos(ta) * 2], [tx + nx * 5 + Math.sin(ta) * 3, ty + ny * 5 + Math.cos(ta) * 3], [tx - nx * 1 + Math.sin(ta) * 2, ty - ny * 1 + Math.cos(ta) * 2]], '#c8d0d8'); }
    if (p.tool === 'hammer') { const [tx, ty] = seg(P, hx, hy, ta, 8, 2, '#8a5a2a'); p._tip = [Math.round(tx) + 4, Math.round(ty) + 4]; const nx = Math.cos(ta), ny = -Math.sin(ta); P.thick(tx - nx * 3, ty - ny * 3, tx + nx * 3, ty + ny * 3, 3, '#9aa4b0'); }
  }
  // head
  const hx = Math.round(shX) - 5, hy = Math.round(shY) - 11;
  P.ell(hx, hy, 11, 11, L.skin);
  const H = L.hair;
  P.ell(hx - 1, hy - 1, 12, 6, H); P.rect(hx - 1, hy + 2, 5, 6, H);
  if (L.style === 'bun') P.ell(hx - 3, hy - 1, 5, 5, H);
  if (L.style === 'braids') P.rect(hx - 1, hy + 7, 3, 7, H);
  if (L.style === 'long' || L.style === 'locks') P.rect(hx - 2, hy + 3, 4, 10, H);
  if (L.style === 'curls') for (const [i, j] of [[-2, 0], [2, -2], [6, -2]]) P.ell(hx + i, hy + j, 4, 4, H);
  P.px(hx + 8, hy + 5, '#24141f'); P.px(hx + 8, hy + 6, L.eye || '#24141f'); P.px(hx + 7, hy + 8, '#f0889a'); P.px(hx + 11, hy + 6, L.skin);
  if (L.beard) P.rect(hx + 5, hy + 8, 6, 3, L.beard);
  if (L.hat === 'straw') { P.rect(hx - 4, hy + 1, 19, 2, '#f0cc60'); P.ell(hx, hy - 4, 11, 7, '#e8c050'); P.hline(hx, hy, 11, '#c84a3a'); }
  if (L.hat === 'cap') { P.ell(hx - 1, hy - 2, 12, 6, L.hatC); P.rect(hx + 8, hy + 1, 5, 1, L.hatC); }
  if (L.hat === 'bandana') { P.ell(hx - 1, hy - 1, 12, 5, L.hatC); P.rect(hx - 4, hy + 2, 4, 2, L.hatC); }
  if (L.hat === 'scarf') P.ell(hx - 1, hy - 2, 13, 7, L.hatC);
  if (L.hat === 'helm') { P.ell(hx - 1, hy - 2, 13, 8, '#d8a840'); P.rect(hx - 1, hy + 3, 5, 5, '#c89838'); P.ell(hx - 3, hy - 6, 10, 5, '#d8463a'); }
  if (p.tool === 'lantern' && p._hand) { const [lx, ly] = p._hand; P.vline(Math.round(lx), Math.round(ly) + 1, 3, '#3a3440'); P.rect(Math.round(lx) - 2, Math.round(ly) + 4, 5, 6, '#3a3440'); P.rect(Math.round(lx) - 1, Math.round(ly) + 5, 3, 4, '#ffd060'); P.px(Math.round(lx), Math.round(ly) + 6, '#fff8d0'); p._tip = [Math.round(lx) + 4, Math.round(ly) + 11]; }
}
export function sideFigure(L, pose) { const p = { ...pose }; const c = sprite(40, 46, (P) => { P.x.translate(4, 4); drawSide(P, L, p); }, { out: .66, under: .14 }); c.tip = p._tip || [0, 0]; return c; }

// the poses of the three tasks, as frame lists
export const POSES = {
  // sitting on a stool, rod held forward and up; a gentle bob; 'cast' lifts the rod
  fish: [0, 1, 2, 3].map((i) => ({ sit: true, lean: -0.08 + (i === 1 || i === 2 ? 0.03 : 0), legA: [1.5, -1.45], legB: [1.4, -1.35], armA: [1.25, 0.15], armB: [1.1, 0.25], tool: 'rod', toolAngle: 2.35 - (i === 2 ? 0.05 : 0) })),
  reel: [0, 1].map((i) => ({ sit: true, lean: -0.15, legA: [1.5, -1.45], legB: [1.4, -1.35], armA: [1.6 + i * 0.3, 0.2], armB: [1.3, 0.5], tool: 'rod', toolAngle: 2.75 })),
  // chopping: wind-up, overhead, strike, follow-through
  chop: [
    { lean: -0.15, legA: [0.25, 0], legB: [-0.25, 0], armA: [2.4, 0.4], armB: [2.2, 0.4], tool: 'axe', toolAngle: 3.4 },
    { lean: -0.2, legA: [0.25, 0], legB: [-0.25, 0], armA: [2.9, 0.2], armB: [2.7, 0.3], tool: 'axe', toolAngle: 3.7 },
    { lean: 0.15, legA: [0.25, 0], legB: [-0.25, 0], armA: [1.6, 0], armB: [1.5, 0.1], tool: 'axe', toolAngle: 1.7 },
    { lean: 0.25, legA: [0.3, 0], legB: [-0.25, 0], armA: [1.2, -0.1], armB: [1.1, 0], tool: 'axe', toolAngle: 1.3 },
  ],
  // hammering at a plank in front of the chest
  hammer: [
    { lean: 0.05, legA: [0.15, 0], legB: [-0.15, 0], armA: [2.6, 0.5], armB: [1.4, 0.2], tool: 'hammer', toolAngle: 3.4 },
    { lean: 0.1, legA: [0.15, 0], legB: [-0.15, 0], armA: [1.9, 0.2], armB: [1.4, 0.2], tool: 'hammer', toolAngle: 2.2 },
    { lean: 0.12, legA: [0.15, 0], legB: [-0.15, 0], armA: [1.5, 0], armB: [1.4, 0.2], tool: 'hammer', toolAngle: 1.6 },
  ],
};
// the watch: walking the palisade with a lantern (4 steps), and crouching to pick something up
POSES.patrol = [0, 1, 2, 3].map((i) => { const a = [0.45, 0.15, -0.35, 0.15][i]; return { lean: 0.04, legA: [a, i === 2 ? 0.3 : 0.05], legB: [-a, i === 0 ? 0.3 : 0.05], armA: [0.55, -0.35], armB: [-a * .8, 0.2], tool: 'lantern' }; });
POSES.pick = [{ lean: 0.6, legA: [0.9, -1.3], legB: [-0.2, 0.4], armA: [1.0, 0.7], armB: [0.4, 0.3], tool: 'lantern' }];
const sideCache = new Map();
export function sideFrames(L, key, name) { const k = key + ':' + name; if (!sideCache.has(k)) sideCache.set(k, POSES[name].map((p) => sideFigure(L, p))); return sideCache.get(k); }
