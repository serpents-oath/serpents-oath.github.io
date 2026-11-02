// The village's art, top-down, 16 px tiles, in the reference's spirit: bright grass with tufts and flowers, soft dirt paths
// with rounded edges, a blue sea with foam, round outlined trees, red-roofed cottages, fences, crops, a pier and a big ship.
import { canvas, painter, sprite, finish, rng, light, dark, mix, hex } from './px.js';

export const T = 16;
export const C = {
  grass: '#80ac46', grassL: '#9cc05a', grassD: '#68963a', grassDD: '#527a30',
  dirt: '#d6b98a', dirtL: '#e6cfa2', dirtD: '#b89a68', dirtE: '#9a7c52',
  cob: ['#dcc294', '#d0b282', '#e4cc9e', '#c8a876'], mortar: '#a88a5c', flag: ['#e2d2b0', '#d8c6a0', '#e8dabb'],
  sand: '#f2d898', sandD: '#dcbc78',
  water: '#3e9ad6', waterL: '#62b8e8', waterD: '#2c7ac0', foam: '#e0f6ff',
  wood: '#b8783e', woodL: '#d6964e', woodD: '#86522a',
  stone: '#a8a8b0', stoneL: '#c8c8d0', stoneD: '#7a7a88',
  roof: '#c0463a', roofL: '#de6448', roofD: '#8e2e2e',
  wall: '#f2d4a8', wallD: '#d8b080', beam: '#8a5a32',
};

// ---------------------------------------------------------------- ground: a field per material, smoothed, so edges are round
// grid: rows of characters: 'w' water, 's' sand, 'g' grass, 'd' dirt, 'p' pier (planks over water), 'q' quay (planks on land)
export function renderGround(grid, seed = 7) {
  const H = grid.length, W = grid[0].length, R = rng(seed);
  const [c, x] = canvas(W * T, H * T); const P = painter(x);
  const at = (i, j) => grid[Math.max(0, Math.min(H - 1, j))][Math.max(0, Math.min(W - 1, i))];
  // a smooth 0..1 field of a set of materials, sampled at pixel centres (bilinear between tile centres) plus a little noise
  const noise = new Float32Array(W * T * H * T); for (let k = 0; k < noise.length; k++) noise[k] = R();
  const field = (set) => {
    const m = new Float32Array(W * H); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) m[j * W + i] = set.includes(grid[j][i]) ? 1 : 0;
    return (px, py) => {
      const fx = px / T - .5, fy = py / T - .5, i0 = Math.floor(fx), j0 = Math.floor(fy), tx = fx - i0, ty = fy - j0;
      const g = (i, j) => m[Math.max(0, Math.min(H - 1, j)) * W + Math.max(0, Math.min(W - 1, i))];
      const s = (u) => u * u * (3 - 2 * u), a = s(tx), b = s(ty);
      return (g(i0, j0) * (1 - a) + g(i0 + 1, j0) * a) * (1 - b) + (g(i0, j0 + 1) * (1 - a) + g(i0 + 1, j0 + 1) * a) * b;
    };
  };
  const fWater = field(['w', 'p']), fSand = field(['w', 'p', 's']), fDirt = field(['d', 'q', 'm']);
  const im = x.createImageData(W * T, H * T), d = im.data;
  const kind = new Uint8Array(W * T * H * T); // 0 grass 1 dirt 2 sand 3 water
  for (let py = 0; py < H * T; py++) for (let pxx = 0; pxx < W * T; pxx++) {
    const k = py * W * T + pxx, n = (noise[k] - .5) * .12;
    let kd = 0;
    if (fSand(pxx + .5, py + .5) + n > .5) kd = 2;
    if (fWater(pxx + .5, py + .5) + n * .5 > .52) kd = 3;
    else if (fDirt(pxx + .5, py + .5) + n > .5) kd = 1;
    kind[k] = kd;
  }
  const K = (i, j) => kind[Math.max(0, Math.min(H * T - 1, j)) * W * T + Math.max(0, Math.min(W * T - 1, i))];   // past the edge: the edge continues
  for (let py = 0; py < H * T; py++) for (let pxx = 0; pxx < W * T; pxx++) {
    const k = py * W * T + pxx, kd = kind[k], r = noise[k];
    let col;
    if (kd === 0) {
      col = r < .07 ? C.grassD : r > .965 ? C.grassL : C.grass;
      if (K(pxx, py - 1) === 1 || K(pxx, py - 1) === 2) col = C.grassD;                  // grass lip over a path / sand
      if (K(pxx, py + 1) === 1 || K(pxx, py + 1) === 2 || K(pxx + 1, py) === 1 || K(pxx - 1, py) === 1) col = C.grassDD; // the grass edge line
    } else if (kd === 1) {
      // the game's streets: tan cobbles in staggered courses; the square: big pale flagstones
      if (at(Math.floor(pxx / T), Math.floor(py / T)) === 'm') {
        const fx = pxx % 12, fy = py % 12, fi = Math.floor(pxx / 12) * 7 + Math.floor(py / 12) * 13;
        col = fx === 0 || fy === 0 ? C.mortar : C.flag[fi % 3]; if (fx === 1 && fy > 0 && fy < 11) col = '#efe4c8'; if (fy === 11 && fx > 0) col = C.dirtD;
        if (col !== C.mortar && r < .04) col = C.dirtD;
      } else {
        const row = Math.floor(py / 5), xx = pxx + (row * 3) % 7, cy = py % 5, cx = xx % 7, si = Math.floor(xx / 7) * 5 + row * 11;
        col = cy === 0 || cx === 0 ? C.mortar : C.cob[(si * 7 + (si >> 2)) % 4];
        if (col !== C.mortar) { if (cy === 1 && cx < 4) col = C.dirtL; else if (cy === 4) col = C.dirtD; }
      }
      if (K(pxx, py - 1) === 0 || K(pxx, py - 2) === 0) col = C.dirtE;                     // shadow under the grass edge
    } else if (kd === 2) {
      col = r < .06 ? C.sandD : C.sand;
      if (K(pxx, py - 1) === 0) col = C.sandD;
    } else {
      // water: lighter near the shore, a white foam line at the edge
      let near = 9; for (let s = 1; s <= 8 && near === 9; s++) if (K(pxx, py - s) !== 3 || K(pxx - s, py) !== 3 || K(pxx + s, py) !== 3) near = s;
      col = near <= 1 ? C.foam : near <= 3 ? C.waterL : C.water;
      if (near > 6 && r < .006) col = C.waterL;
    }
    const [a, b, e] = hex(col); d[k * 4] = a; d[k * 4 + 1] = b; d[k * 4 + 2] = e; d[k * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  // grass tufts and little flowers
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (grid[j][i] !== 'g') continue;
    for (let t = 0; t < 2; t++) if (R() < .45) { const a = i * T + 2 + Math.floor(R() * 11), b = j * T + 3 + Math.floor(R() * 10); if (kind[b * W * T + a] !== 0) continue; P.px(a, b, C.grassDD); P.px(a + 2, b, C.grassDD); P.px(a + 1, b - 1, C.grassD); P.px(a + 1, b, C.grassD); P.px(a, b - 1, C.grassL); }
    if (R() < .07) { const a = i * T + 4 + Math.floor(R() * 8), b = j * T + 4 + Math.floor(R() * 8), fc = ['#ffffff', '#ffd84a', '#ff8ab0', '#b48aff'][Math.floor(R() * 4)]; P.px(a, b - 1, fc); P.px(a - 1, b, fc); P.px(a + 1, b, fc); P.px(a, b + 1, fc); P.px(a, b, '#ffe070'); }
  }
  // pebbles on the paths
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (grid[j][i] === 'd' && R() < 0) { const a = i * T + 3 + Math.floor(R() * 10), b = j * T + 4 + Math.floor(R() * 9); P.px(a, b, C.dirtD); P.px(a + 1, b, C.dirtD); P.px(a, b - 1, C.dirtL); }
  // planks: the pier over the water and the quay
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const g = grid[j][i]; if (g !== 'p' && g !== 'q') continue;
    const vertical = g === 'p' && (at(i, j - 1) === 'p' || at(i, j + 1) === 'p');
    const bx = i * T, by = j * T;
    P.rect(bx, by, T, T, C.wood);
    if (vertical) { for (let s = 0; s < 4; s++) { P.vline(bx + s * 4, by, T, C.woodD); P.vline(bx + s * 4 + 1, by, T, C.woodL); } P.hline(bx, by + (i * 7 + j * 3) % 16, T, C.woodD); }
    else { for (let s = 0; s < 4; s++) { P.hline(bx, by + s * 4, T, C.woodD); P.hline(bx, by + s * 4 + 1, T, C.woodL); } P.vline(bx + (i * 5 + j * 11) % 16, by, T, C.woodD); }
    if (g === 'p') { // posts in the water and a shadow under the edge
      if (at(i - 1, j) === 'w') { P.vline(bx, by, T, C.woodD); }
      if (at(i + 1, j) === 'w') { P.vline(bx + T - 1, by, T, C.woodD); }
      if (at(i, j + 1) === 'w') { P.rect(bx, by + T, T, 3, C.waterD); P.rect(bx + 1, by + T - 1, 3, 4, C.woodD); P.rect(bx + T - 4, by + T - 1, 3, 4, C.woodD); }
    }
  }
  return c;
}

// ---------------------------------------------------------------- props
const S = (w, h, f, o) => sprite(w, h, f, o);
export function makeArt() {
  const A = {};
  // ---- trees: silver-green olives with gnarled trunks, a lemon tree, dark cypress spires
  const olive = (seed, big = 1) => S(36, 40, (P) => {
    const R = rng(seed), tr = '#7a6a58', trL = '#9c8c74';
    P.thick(18, 38, 16, 28, 4, tr); P.thick(16, 29, 10, 20, 3, tr); P.thick(18, 30, 24, 19, 3, tr); P.vline(17, 29, 9, trL); P.px(13, 38, tr); P.px(21, 38, tr); P.px(15, 34, '#5e5040');
    const base = '#8aa463', hi = '#b6c88c', lo = '#66824a', sil = '#d2dcbc';
    for (const [a, b, w, h] of [[1, 10, 15, 11], [11, 3, 16, 11], [20, 8, 15, 11], [5, 15, 26, 9], [0, 17, 11, 7], [25, 16, 11, 7]]) P.ell(a, b, w, h, base);
    for (const [a, b, w, h] of [[3, 19, 12, 5], [21, 19, 12, 5], [8, 21, 20, 4]]) P.ell(a, b, w, h, lo);
    for (const [a, b] of [[4, 11], [14, 4], [23, 9], [10, 15], [19, 14]]) P.ell(a, b, 6, 3, hi);
    for (let k = 0; k < 22; k++) P.px(2 + Math.floor(R() * 32), 4 + Math.floor(R() * 20), R() < .55 ? sil : lo);
    if (big) for (let k = 0; k < 6; k++) P.px(4 + Math.floor(R() * 28), 9 + Math.floor(R() * 14), '#3e4a2a');
  }, { out: .7, rim: .08 });
  const tree = (seed, base = '#4fa03e', fruit = null) => S(34, 42, (P) => {
    const R = rng(seed);
    P.rect(14, 26, 6, 12, '#8a5a32'); P.rect(15, 26, 1, 12, '#a8703e'); P.px(13, 37, '#8a5a32'); P.px(20, 37, '#8a5a32');
    const hi = light(base, .3), lo = dark(base, .22);
    P.ell(2, 3, 30, 26, base);
    for (const [a, b, w, h] of [[1, 9, 12, 12], [21, 9, 12, 12], [6, 1, 14, 12], [15, 2, 13, 11], [5, 16, 24, 13]]) P.ell(a, b, w, h, base);
    P.ell(4, 18, 26, 10, lo); P.ell(6, 15, 22, 9, base);
    for (const [a, b] of [[8, 5], [16, 4], [5, 11], [12, 9], [22, 8]]) { P.ell(a, b, 6, 4, hi); }
    for (let k = 0; k < 18; k++) { const a = 4 + Math.floor(R() * 26), b = 4 + Math.floor(R() * 22); P.px(a, b, R() < .5 ? hi : lo); }
    if (fruit) for (const [a, b] of [[9, 12], [20, 10], [14, 18], [25, 16], [7, 20]]) { P.rect(a, b, 2, 2, fruit); P.px(a, b, light(fruit, .5)); }
  }, { out: .7, rim: .08 });
  A.olive = [olive(3), olive(9), olive(14, 0)];
  A.tree = [A.olive[0], A.olive[1], tree(5, '#3f7c2c')];   // olives, and a round dark-green tree (the game's town trees)
  const cypress = (h) => S(16, h + 4, (P) => {
    P.rect(7, h - 1, 2, 4, '#6a4a32');
    P.poly([[8, 0], [11, 6], [13, h * .45], [12, h * .8], [8, h + 1], [4, h * .8], [3, h * .45], [5, 6]], '#2f6a3c');
    P.poly([[8, 1], [11, 6], [13, h * .45], [12, h * .8], [8, h + 1]], '#24573a');
    for (let y = 5; y < h - 2; y += 4) { P.px(6, y, '#4a8a50'); P.px(5, y + 1, '#4a8a50'); P.px(9, y + 2, '#3a7a46'); }
  }, { out: .7, rim: .1 });
  A.pine = [cypress(36), cypress(30)];   // the old name: the west grove's tall trees are cypresses now
  A.cypress = A.pine;
  A.bush = [0, 1].map((v) => S(20, 16, (P) => { const b = v ? '#5aa046' : '#6aa84a'; P.ell(1, 3, 18, 12, b); P.ell(3, 1, 9, 8, b); P.ell(9, 2, 9, 8, b); P.ell(4, 3, 4, 3, light(b, .3)); P.ell(11, 4, 4, 3, light(b, .3)); if (v) for (const [a, c] of [[6, 8], [12, 7], [9, 11]]) P.rect(a, c, 2, 2, '#9a6ad0'); }, { out: .7 }));
  // a stone planter with red and cream flowers (the game's town planters)
  A.bougain = S(24, 18, (P) => { P.rect(1, 9, 22, 8, '#cfc2a2'); P.hline(1, 9, 22, '#e2d8bc'); P.hline(1, 16, 22, '#a89a7a'); P.ell(1, 2, 22, 10, '#4f7c3c'); P.ell(4, 3, 8, 4, '#73904c'); for (const [a, b, c] of [[4, 5, '#e04848'], [9, 3, '#f2e6c4'], [14, 6, '#e04848'], [18, 3, '#f2e6c4'], [7, 8, '#f2e6c4'], [19, 7, '#e04848']]) { P.rect(a, b, 2, 2, c); P.px(a, b, light(c, .4)); } }, { out: .7, rim: .1 });
  // pots of geraniums (red, pink) and of basil, in terracotta
  A.pot = ['#e8303a', '#f06aa8', null].map((fc, v) => S(14, 18, (P) => {
    P.poly([[2, 9], [12, 9], [10, 17], [4, 17]], '#c8643a'); P.rect(1, 8, 12, 3, '#e07c4a'); P.hline(3, 13, 8, '#a84a2a');
    P.ell(1, 1, 12, 9, '#4a9a3c'); P.ell(3, 2, 5, 3, '#6ab84e');
    if (fc) for (const [a, b] of [[3, 2], [8, 1], [6, 5], [10, 4]]) { P.ell(a - 1, b - 1, 4, 4, fc); P.px(a, b, light(fc, .45)); }
    else for (const [a, b] of [[3, 3], [7, 2], [9, 5]]) P.px(a, b, '#9ad870');
  }, { out: .65 }));
  A.flowers = [A.pot[0], A.pot[1], S(14, 12, (P) => { for (const [a, b] of [[2, 5], [7, 3], [10, 7], [5, 8]]) { P.vline(a + 1, b + 2, 3, '#3a8a3a'); P.px(a + 1, b, '#ffffff'); P.px(a, b + 1, '#ffffff'); P.px(a + 2, b + 1, '#ffffff'); P.px(a + 1, b + 2, '#ffffff'); P.px(a + 1, b + 1, '#ffe070'); } }, { out: .55 }), S(14, 12, (P) => { for (const [a, b] of [[2, 4], [6, 2], [9, 6], [4, 7]]) { P.vline(a + 1, b + 1, 4, '#5a8a4a'); P.px(a + 1, b, '#9a7ae0'); P.px(a + 1, b - 1, '#b49af0'); P.px(a + 1, b + 1, '#8060c8'); } }, { out: .55 })];
  // amphorae: terracotta with a black band and a meander
  const amph = (P, a, b, s = 1) => { P.ell(a, b + 4 * s, 10 * s, 12 * s, '#c86a3a'); P.rect(a + 3 * s, b, 4 * s, 5 * s, '#c86a3a'); P.rect(a + 2 * s, b, 6 * s, 2, '#e08a52'); P.line(a + 2 * s, b + 2, a + 1, b + 6 * s, '#a84e2a'); P.line(a + 8 * s, b + 2, a + 9 * s - 1, b + 6 * s, '#a84e2a'); P.rect(a + 1, b + 8 * s, 10 * s - 2, 3, '#2a1a14'); for (let k = a + 2; k < a + 10 * s - 2; k += 3) P.px(k, b + 9 * s, '#e08a52'); P.ell(a + 2, b + 5 * s, 3, 3, '#e8945c'); P.rect(a + 4 * s, b + 15 * s, 2 * s, 2, '#a84e2a'); };
  A.amphora = S(12, 20, (P) => amph(P, 1, 1), { out: .7 });
  A.amphorae = S(24, 20, (P) => { amph(P, 12, 1); amph(P, 1, 3); }, { out: .7 });
  // the old names still used by the layout
  A.barrel = A.amphora;
  A.stump = S(18, 14, (P) => { P.ell(2, 4, 14, 9, '#7a6a58'); P.ell(2, 1, 14, 7, '#e8c088'); P.ell(5, 2, 8, 4, '#d0a068'); P.ell(7, 3, 4, 2, '#e8c088'); }, { out: .7 });
  A.stumpAxe = S(20, 22, (P) => { P.ell(2, 12, 14, 9, '#7a6a58'); P.ell(2, 9, 14, 7, '#e8c088'); P.ell(5, 10, 8, 4, '#d0a068'); P.thick(13, 1, 9, 11, 2, '#8a5a32'); P.poly([[6, 9], [11, 12], [9, 15], [5, 12]], '#c8d0d8'); }, { out: .7 });
  A.logs = S(30, 22, (P) => { for (const [a, b] of [[1, 12], [10, 12], [19, 12], [5, 5], [14, 5]]) { P.ell(a, b, 10, 9, '#7a6a58'); P.ell(a + 1, b + 1, 7, 7, '#e8c088'); P.ell(a + 3, b + 3, 3, 3, '#c8965a'); } }, { out: .7 });
  A.rock = [0, 1].map((v) => S(16, 13, (P) => { P.ell(1, 2 + v, 14, 10 - v, '#c8bfae'); P.ell(3, 2 + v, 7, 4, '#e4ddd0'); if (v) P.ell(9, 7, 5, 4, '#a49a88'); }, { out: .7 }));
  A.crate = S(16, 16, (P) => { P.rect(1, 2, 14, 13, '#c08848'); P.rect(1, 2, 14, 2, '#d8a060'); P.line(2, 5, 13, 14, '#8a5a30'); P.rect(1, 2, 1, 13, '#8a5a30'); P.rect(14, 2, 1, 13, '#8a5a30'); P.hline(1, 8, 14, '#8a5a30'); }, { out: .7 });
  A.fishCrate = S(18, 16, (P) => { P.rect(1, 4, 16, 11, '#c08848'); P.hline(1, 9, 16, '#8a5a30'); for (const [a, c] of [[3, 2], [8, 1], [12, 3]]) { P.ell(a, c, 6, 4, '#b8c8d8'); P.px(a + 1, c + 1, '#24141f'); } }, { out: .7 });
  A.anchor = S(18, 20, (P) => { P.vline(8, 2, 14, '#5a6070'); P.vline(9, 2, 14, '#5a6070'); P.ell(6, 0, 6, 4, '#5a6070'); P.hline(4, 5, 10, '#5a6070'); P.thick(3, 13, 8, 17, 2, '#5a6070'); P.thick(14, 13, 9, 17, 2, '#5a6070'); }, { out: .6 });
  A.ropeCoil = S(14, 10, (P) => { P.ell(1, 1, 12, 8, '#c8a060'); P.ell(4, 3, 6, 4, '#8a6a3a'); P.ell(5, 4, 4, 2, '#c8a060'); }, { out: .7 });
  // marble: a bench, a stele, a brazier on a fluted pillar
  const M = '#f2eee4', ML = '#ffffff', MD = '#d4ccbc', MDD = '#b4aa98';
  A.bench = S(28, 14, (P) => { P.rect(3, 6, 5, 7, MD); P.rect(20, 6, 5, 7, MD); P.rect(1, 2, 26, 5, M); P.hline(1, 2, 26, ML); P.hline(1, 6, 26, MDD); for (const a of [4, 21]) P.vline(a + 1, 7, 6, MDD); }, { out: .7 });
  A.sign = S(14, 22, (P) => { P.rect(2, 19, 10, 3, MD); P.rect(3, 4, 8, 16, M); P.ell(3, 1, 8, 6, M); P.vline(10, 4, 16, MD); for (const y of [7, 10, 13]) P.hline(5, y, 4, MDD); P.px(6, 3, ML); }, { out: .7 });
  A.lamp = S(14, 32, (P) => { P.rect(3, 4, 2, 27, '#6e4629'); P.rect(2, 29, 4, 2, '#45301f'); P.rect(3, 4, 8, 2, '#6e4629'); P.vline(10, 6, 2, '#3a3a42'); P.rect(8, 8, 5, 7, '#3a3a42'); P.rect(9, 9, 3, 5, '#ffd870'); P.px(9, 9, '#fff6c8'); P.hline(8, 15, 5, '#3a3a42'); }, { out: .6 });
  A.torch = S(14, 36, (P) => { P.rect(1, 6, 12, 29, '#dcc48e'); for (let y = 8; y < 35; y += 4) { P.hline(1, y, 12, '#b89c66'); P.vline(1 + ((y / 4) % 2 ? 3 : 7), y, 4, '#b89c66'); } P.rect(0, 3, 14, 4, '#e8d6a6'); P.hline(0, 3, 14, '#f4e8c4'); P.rect(4, 9, 6, 16, '#d9a63a'); P.rect(5, 9, 4, 1, '#f0c858'); P.poly([[4, 25], [10, 25], [7, 28]], '#d9a63a'); P.px(7, 15, '#fff0b0'); P.px(6, 16, '#fff0b0'); P.px(8, 16, '#fff0b0'); P.px(7, 17, '#fff0b0'); }, { out: .6 });   // a gate pier: sandstone blocks, a gold banner with a star
  // the town wall: courses of sandstone blocks with a pale coping (Elaia's wall, low)
  const ashlar = (P, w, h, seed) => { const R = rng(seed); P.rect(0, 3, w, h - 3, '#dcc48e'); for (let y = 4, r = 0; y < h; y += 4, r++) { P.hline(0, y, w, '#b89c66'); for (let a = (r % 2) * 4 + Math.floor(R() * 2); a < w; a += 8) P.vline(a, y, 4, '#b89c66'); for (let a = 2; a < w; a += 5) if (R() < .3) P.px(a, y + 2, '#e8d4a2'); } P.hline(0, h - 1, w, '#a88a58'); P.rect(0, 0, w, 4, '#e8d6a6'); P.hline(0, 0, w, '#f4e8c4'); P.hline(0, 3, w, '#c8ae78'); };
  A.palisade = S(17, 18, (P) => ashlar(P, 17, 17, 4), { out: .7 });
  A.picket = S(17, 14, (P) => ashlar(P, 17, 13, 7), { out: .7 });
  A.wall = A.palisade;
  A.cabbage = S(14, 12, (P) => { P.ell(1, 3, 12, 8, '#7a9a4a'); for (const [a, b] of [[3, 3], [7, 2], [9, 5], [4, 6]]) { P.ell(a, b, 4, 4, '#94b85a'); } P.px(6, 4, '#c8d88a'); }, { out: .7 });   // herbs
  A.carrot = S(12, 12, (P) => { for (const [a, b] of [[1, 4], [5, 2], [8, 5]]) { P.vline(a + 1, b + 2, 5, '#6a8a4a'); P.px(a + 1, b, '#9a7ae0'); P.px(a + 1, b + 1, '#b49af0'); P.px(a, b + 3, '#7aa050'); P.px(a + 2, b + 2, '#7aa050'); } }, { out: .6 });   // lavender
  // the fountain: a round stone rim, bright blue water, a little statue on a pedestal spouting water (the game's fountain)
  A.well = S(36, 40, (P) => {
    P.ell(1, 18, 34, 21, '#a89a7a'); P.ell(1, 17, 34, 20, '#d4c8ab'); P.ell(3, 18, 30, 16, '#e2d8bc'); P.ell(5, 20, 26, 12, '#2f9ad8'); P.ell(7, 21, 14, 5, '#5cc0f0'); P.hline(10, 28, 6, '#bfeaff'); P.hline(21, 25, 5, '#bfeaff');
    P.rect(15, 16, 6, 11, '#cfc2a2'); P.rect(14, 15, 8, 2, '#e2d8bc');
    P.ell(15, 2, 6, 6, '#d9a63a'); P.rect(15, 7, 6, 9, '#2f6fb3'); P.px(16, 4, '#f4d070'); P.thick(20, 9, 24, 5, 1, '#d9a63a'); P.rect(24, 3, 3, 3, '#c86a40');
    for (const [a, b] of [[11, 10], [9, 14], [8, 18], [26, 8], [28, 12], [28, 17]]) P.px(a, b, '#9ad8f8');
  }, { out: .7, rim: .08 });
  // the little temple: a stepped marble base, four doric columns, a red-black meander, a blue tympanum with gold, an altar
  A.shrine = S(40, 46, (P) => {
    const m = '#ece6d6', m2 = '#ddd5c2', m3 = '#cfc6b0';
    P.rect(1, 40, 38, 5, m3); P.rect(3, 37, 34, 4, m2); P.hline(3, 37, 34, m);
    P.rect(7, 18, 26, 19, '#5a4a3a'); P.rect(15, 24, 10, 13, '#3a2e24'); P.ell(17, 25, 6, 6, '#d9a63a'); P.rect(18, 30, 4, 7, '#d9a63a');
    for (const a of [5, 13, 23, 31]) { P.rect(a, 17, 5, 20, m); P.vline(a + 2, 18, 18, m3); P.rect(a - 1, 16, 7, 2, m2); }
    P.rect(3, 12, 34, 5, m); P.hline(3, 14, 34, '#a8322a'); for (let a = 4; a < 37; a += 3) P.px(a, 15, '#1f2633');
    P.poly([[2, 12], [20, 2], [38, 12]], m); P.poly([[7, 11], [20, 5], [33, 11]], '#3d6390'); P.ell(17, 7, 6, 4, '#d9a63a');
    P.px(2, 11, '#a8322a'); P.px(37, 11, '#a8322a'); P.rect(19, 0, 2, 3, '#d9a63a');
    P.line(2, 12, 20, 2, '#fbf8ef');
  }, { out: .7, rim: .06 });
  A.altar = S(18, 18, (P) => { P.rect(2, 9, 14, 8, '#ece6d6'); P.hline(2, 9, 14, '#fbf8ef'); P.rect(2, 15, 14, 2, '#cfc6b0'); P.hline(3, 12, 12, '#a8322a'); P.ell(4, 1, 10, 9, '#ff9a2a'); P.ell(6, 3, 6, 5, '#ffe070'); }, { out: .7 });
  // the grape pergola: whitewashed posts, timber beams, a vine with bunches
  A.pergola = S(52, 46, (P) => {
    const R = rng(33);
    for (const a of [3, 45]) { P.rect(a, 14, 4, 31, '#8a5c34'); P.vline(a + 3, 14, 31, '#6e4629'); }
    for (const y of [8, 14]) P.rect(0, y, 52, 3, '#8a6040');
    for (let a = 2; a < 52; a += 7) P.rect(a, 4, 2, 14, '#a8784a');
    for (let k = 0; k < 16; k++) { const a = Math.floor(R() * 46), b = Math.floor(R() * 12) + 1; P.ell(a, b, 8, 6, k % 3 ? '#5aa046' : '#6ab84e'); }
    for (const [a, b] of [[8, 13], [20, 15], [33, 12], [41, 16]]) { for (let j = 0; j < 4; j++) P.hline(a + j / 2, b + j, 4 - j, j % 2 ? '#7a3a8a' : '#a05ab8'); P.px(a + 1, b, '#c890e0'); }
    P.thick(46, 44, 44, 18, 2, '#6a4a32');
  }, { out: .7, rim: .08 });
  A.stall = makeStall(); A.cottage = makeHouse('tile'); A.house = makeHouse('flat'); A.bank = makeBank(); A.home = makeHouse('dome'); A.ship = turn(makeShip());
  return A;
}

// the agora stall: a striped awning on timber poles over a wooden counter with pottery and fruit (the game's market stall)
function makeStall() {
  return S(66, 54, (P) => {
    for (const a of [4, 59]) { P.rect(a, 14, 3, 38, '#6e4629'); P.vline(a, 14, 38, '#8a5c34'); }
    P.rect(2, 32, 62, 18, '#8a5c34'); P.rect(2, 32, 62, 3, '#a8784a'); for (let a = 8; a < 64; a += 10) P.vline(a, 35, 15, '#6e4629'); P.hline(2, 49, 62, '#45301f');
    for (const [a, h] of [[6, 12], [14, 10]]) { P.ell(a, 32 - h, 8, h, '#c86a40'); P.rect(a + 2, 31 - h, 4, 3, '#c86a40'); P.rect(a + 1, 26 - Math.round(h / 3), 6, 2, '#1f2633'); }
    for (const [a, c] of [[24, '#e04848'], [31, '#e8a33a'], [38, '#7ac85a']]) { P.ell(a, 26, 8, 7, c); P.px(a + 2, 27, '#ffffff'); }
    P.rect(47, 24, 13, 8, '#b8844a'); P.hline(47, 27, 13, '#8a5c34'); for (const a of [49, 53, 57]) P.ell(a - 1, 22, 4, 4, '#7a3a6a');
    for (let i = 0; i < 8; i++) P.poly([[1 + i * 8, 4], [9 + i * 8, 4], [9 + i * 8, 15], [5 + i * 8, 18], [1 + i * 8, 15]], i % 2 ? '#f2e6c4' : '#d8463a');
    P.rect(1, 2, 64, 3, '#a8322a');
  }, { out: .7, rim: .1 });
}
// the game's town house, seen from above and in front: warm plaster walls on a stone socle, a low terracotta hip roof
// with pale antefixes along the eave, coloured shutters, a brown door with a step, a flower box (70 x 80)
function makeHouse(kind) {
  const V = { home: { w: '#f0e4c9', sh: '#3f7a5a', door: '#6e4629' }, tile: { w: '#f4e8d4', sh: '#2f6fb3', door: '#5a3a26' }, flat: { w: '#efe0c0', sh: '#8a3a2a', door: '#7a3a2a' } }[kind] || { w: '#f3ede1', sh: '#2f6fb3', door: '#6e4629' };
  return S(72, 80, (P) => {
    const R = rng(kind.length * 7), rf = ['#c86a40', '#bf6038', '#cf7446', '#b85a3a'], rfE = '#7a3822', anti = '#efe9da';
    // walls: plaster over a stone socle
    P.rect(5, 42, 62, 36, V.w); P.vline(66, 42, 36, mix(V.w, '#a89a7a', .3));
    for (let k = 0; k < 18; k++) P.px(6 + Math.floor(R() * 58), 44 + Math.floor(R() * 24), mix(V.w, '#c8b890', .35));
    P.rect(5, 70, 62, 8, '#cfc2a2'); for (let a = 5; a < 67; a += 7) P.vline(a, 70, 8, '#bfb6a3'); P.hline(5, 74, 62, '#bfb6a3'); P.hline(5, 70, 62, '#d4c8ab'); P.hline(5, 77, 62, '#a89a7a');
    // the roof: a low hip of terracotta tiles in rows, a ridge, antefixes along the front eave
    P.poly([[1, 44], [14, 14], [58, 14], [71, 44]], rf[0]);
    for (let y = 17, r = 0; y < 44; y += 3, r++) { const ins = Math.round((44 - y) * 13 / 30); P.hline(1 + ins, y, 70 - ins * 2, rf[(r + 1) % 4]); for (let a = 3 + ins + (r % 2) * 2; a < 70 - ins; a += 4) { P.px(a, y + 1, rfE); P.px(a + 1, y - 1, light(rf[r % 4], .25)); } }
    P.rect(13, 12, 46, 3, '#cf7446'); P.hline(13, 12, 46, '#e08a58'); P.line(1, 44, 14, 14, rf[2]); P.line(58, 14, 71, 44, rfE);
    P.hline(1, 44, 70, rfE); for (let a = 2; a < 71; a += 4) { P.px(a, 45, anti); P.px(a + 1, 45, anti); P.px(a, 46, anti); }
    // the door, with a step
    P.rect(30, 52, 13, 19, '#45301f'); P.rect(31, 53, 11, 18, V.door); P.vline(36, 53, 18, '#45301f'); P.px(39, 62, '#e2ab38'); P.rect(28, 50, 17, 3, '#cfc2a2'); P.rect(28, 71, 17, 3, '#d4c8ab');
    // windows: dark openings with coloured shutters, a flower box under one
    for (const a of [11, 52]) {
      P.rect(a + 3, 51, 6, 9, '#1c212d'); P.px(a + 4, 52, '#3a4258');
      for (const s2 of [a, a + 9]) { P.rect(s2, 50, 3, 11, V.sh); for (let y = 52; y < 60; y += 2) P.hline(s2, y, 3, dark(V.sh, .3)); }
      P.rect(a - 1, 61, 14, 2, '#cfc2a2');
    }
    P.rect(51, 63, 14, 3, '#8a5c34'); for (const [a, c] of [[52, '#e04848'], [55, '#f2e6c4'], [58, '#e04848'], [61, '#f2e6c4']]) { P.rect(a, 61, 2, 2, c); P.px(a + 1, 63, '#4f7c3c'); }
    if (kind === 'home') { P.rect(9, 63, 14, 3, '#8a5c34'); for (const a of [10, 14, 18]) { P.rect(a, 61, 2, 2, '#e8a33a'); P.px(a + 1, 63, '#4f7c3c'); } }
    if (kind === 'tile') { for (let i = 0; i < 6; i++) P.poly([[26 + i * 4, 47], [30 + i * 4, 47], [30 + i * 4, 51], [28 + i * 4, 52], [26 + i * 4, 51]], i % 2 ? '#f2e6c4' : '#2f6fb3'); }
  }, { out: .7, rim: .06 });
}
// the bank: a little Greek treasury, stone, four columns, a gold coin on the pediment (84 x 82)
function makeBank() {
  return S(86, 84, (P) => {
    P.rect(4, 74, 78, 6, C.stoneD); P.rect(6, 70, 74, 5, C.stone); P.hline(6, 70, 74, C.stoneL);
    P.rect(10, 34, 66, 36, '#e8e2d4'); P.rect(10, 34, 66, 3, '#d4ccbc');
    P.rect(36, 48, 14, 22, '#5a3a24'); P.rect(37, 49, 12, 21, '#7a4a2a'); P.vline(43, 49, 21, '#5a3420'); P.px(41, 60, '#f0c850'); P.px(45, 60, '#f0c850');
    for (const a of [12, 24, 54, 66]) { P.rect(a, 36, 8, 34, '#f8f4ec'); P.vline(a + 2, 38, 30, '#dcd6c8'); P.vline(a + 5, 38, 30, '#dcd6c8'); P.rect(a - 1, 34, 10, 3, '#d4ccbc'); P.rect(a - 1, 68, 10, 2, '#d4ccbc'); }
    P.rect(4, 28, 78, 7, '#d8d0c0'); P.hline(4, 28, 78, '#f8f4ec'); for (let a = 6; a < 80; a += 6) P.rect(a, 31, 3, 2, '#b8b0a0');
    P.poly([[2, 28], [43, 4], [84, 28]], '#ece6d8'); P.poly([[10, 25], [43, 9], [76, 25]], '#3d6390'); P.hline(4, 33, 78, '#a8322a');
    P.ell(35, 11, 16, 14, '#f2c440'); P.ell(38, 14, 10, 8, '#e0a828'); P.rect(42, 15, 2, 5, '#b07818'); P.px(37, 12, '#fff6c0');
    P.line(2, 28, 43, 4, '#ffffff');
  }, { out: .7, rim: .06 });
}
// the big ship at the quay, seen from above: pointed bow up, deck planks, two masts with furled sails, rails (60 x 150)
function makeShip() {
  return S(64, 156, (P) => {
    const hull = '#8a5432', deck = '#d8a060', deckD = '#b8844a';
    P.poly([[32, 2], [52, 30], [56, 70], [54, 130], [46, 150], [18, 150], [10, 130], [8, 70], [12, 30]], hull);
    P.poly([[32, 8], [48, 32], [51, 70], [49, 128], [43, 144], [21, 144], [15, 128], [13, 70], [16, 32]], deck);
    for (let y = 20; y < 144; y += 5) P.hline(14, y, 36, deckD);
    for (let y = 22; y < 144; y += 10) for (let a = 18 + (y % 20 ? 4 : 0); a < 48; a += 9) P.px(a, y + 2, deckD);
    // a few broken planks (the repair) and a scaffold
    P.rect(40, 96, 8, 10, '#3a2618'); P.rect(41, 97, 6, 8, '#24160e'); P.rect(18, 60, 6, 8, '#3a2618');
    // masts, booms, furled sails
    for (const [y, w] of [[50, 40], [104, 34]]) { P.rect(32 - w / 2, y + 2, w, 4, '#f0e8d4'); P.hline(32 - w / 2, y + 5, w, '#c8bca0'); P.rect(32 - w / 2 - 1, y + 3, w + 2, 2, '#7a4a28'); P.ell(27, y - 1, 10, 10, '#6a4024'); P.ell(29, y + 1, 6, 6, '#8a5a32'); }
    // the bow sprit, the stern cabin, rails, a flag
    P.thick(32, 2, 32, -2, 2, '#7a4a28');
    P.rect(18, 128, 28, 16, '#a8683a'); P.rect(18, 128, 28, 3, '#c88a52'); P.rect(24, 134, 4, 4, '#5ab0e8'); P.rect(36, 134, 4, 4, '#5ab0e8');
    P.line(12, 30, 9, 70, '#6a4024'); P.line(52, 30, 55, 70, '#6a4024');
    for (let y = 36; y < 128; y += 12) { P.px(10, y, '#e8c050'); P.px(54, y, '#e8c050'); }
  }, { out: .7, rim: .05 });
}

// a quarter turn clockwise (the ship lies along the quay, bow to the east)
function turn(c) { const [o, x] = canvas(c.height, c.width); x.translate(c.height, 0); x.rotate(Math.PI / 2); x.drawImage(c, 0, 0); return o; }

// the speech-bubble badge over a villager (what they offer): 22 x 22 with the icon inside
export function bubble(ic) {
  return sprite(24, 26, (P) => { P.ell(1, 1, 22, 20, '#fff8ec'); P.poly([[9, 18], [12, 24], [15, 18]], '#fff8ec'); P.x.drawImage(ic, 3, 2); }, { out: .7, shade: false, outColor: '#3a2632' });
}
export { finish, mix };
