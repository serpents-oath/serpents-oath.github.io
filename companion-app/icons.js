// Every thing has its own 16 x 16 pixel icon (18 x 18 with its outline), drawn here: the seven fish, the seven woods, the seven ship goods, the game's
// draughts and nectars (the game's own liquid colours per tier), the three rare game items, the drachma, and the UI's tools.
import { sprite, light, dark, mix } from './px.js';

// the game's liquid colours (js/potions.js HP_COLORS / MP_COLORS), tier 1 first
const HP = ['#d42a36', '#ec5a2a', '#f08a28', '#e8b82a', '#8cc43a', '#22b27a', '#e0489a', '#a54ae0', '#f4a0a0', '#ffd24a'];
const MP = ['#2f6dff', '#2f9bff', '#2fd0e8', '#34d6b0', '#5a5cff', '#7a3ae0', '#b04ce8', '#e04ccc', '#a8d8ff', '#e8f0ff'];

// ---- fish: facing left; body, belly, tail, fins, eye
function fish(P, o) {
  const { b, belly = light(b, .45), fin = dark(b, .2), x = 2, y = 5, w = 10, h = 6 } = o;
  const ty = y + h / 2;
  P.poly([[x + w - 1, ty], [x + w + 3, ty - (o.tail || 3)], [x + w + 3, ty + (o.tail || 3)]], o.tailC || fin);   // tail
  if (o.dorsal !== false) P.poly([[x + 3, y + 1], [x + 5, y - (o.dh || 2)], [x + w - 3, y + 1]], fin);              // dorsal fin
  P.ell(x, y, w, h, b);
  P.ell(x + 1, y + Math.ceil(h / 2), w - 3, Math.floor(h / 2), belly);
  P.rect(x + 1, y + 1, w - 3, Math.ceil(h / 2) - 1, b);
  if (o.pattern) o.pattern(P);
  P.px(x + 2, ty - 1, '#ffffff'); P.px(x + 2, ty, '#1a1020');                                                         // eye
  P.px(x + 4, ty + 1, fin); P.px(x + 5, ty + 2, fin);                                                                   // gill fin
}
// ---- a log: lying left-right, cut end on the left with rings
function log(P, o) {
  const { bark, end, ring = dark(end, .25), y = 5, h = 7 } = o;
  P.rect(4, y, 10, h, bark); P.ell(11, y, 4, h, bark);
  if (o.marks) o.marks(P, y, h);
  P.ell(1, y, 6, h, end);
  P.ell(2, y + 2, 4, h - 4, ring); P.ell(3, y + 3, 2, Math.max(1, h - 6), end);
  P.px(3, y + Math.floor(h / 2), ring);
}

const D = {
  // fishing
  pond_minnow: (P) => fish(P, { b: '#9ab08a', x: 3, y: 6, w: 8, h: 4, tail: 2, dh: 1, pattern: (P) => P.hline(5, 8, 5, '#c8d6b4') }),
  silver_carp: (P) => fish(P, { b: '#b8c6d4', fin: '#e8a040', x: 1, y: 4, w: 11, h: 8, tail: 3, dh: 2, pattern: (P) => { for (const [i, j] of [[4, 6], [6, 6], [8, 6], [5, 8], [7, 8], [9, 8], [6, 10], [8, 10]]) P.px(i, j, '#8898aa'); } }),
  reed_perch: (P) => fish(P, { b: '#a8c848', fin: '#ee6a34', x: 2, y: 5, w: 10, h: 6, dh: 3, pattern: (P) => { for (const i of [5, 7, 9]) P.vline(i, 6, 3, '#4a6a24'); } }),
  golden_trout: (P) => fish(P, { b: '#f2c040', fin: '#e8803a', x: 1, y: 5, w: 12, h: 5, tail: 3, pattern: (P) => { P.hline(3, 8, 8, '#f08a8a'); for (const [i, j] of [[5, 6], [8, 6], [10, 7], [6, 9]]) P.px(i, j, '#c8402a'); } }),
  moonfin: (P) => { P.poly([[4, 6], [7, 0], [10, 6]], '#e8f6ff'); P.poly([[4, 10], [7, 15], [10, 10]], '#e8f6ff'); fish(P, { b: '#a8c4ff', fin: '#d8eeff', x: 2, y: 4, w: 10, h: 8, dorsal: false, tailC: '#e8f6ff', pattern: (P) => { P.px(6, 6, '#ffffff'); P.px(8, 7, '#ffffff'); P.px(7, 9, '#d6c8ff'); } }); },
  sapphire_koi: (P) => fish(P, { b: '#f6f2ea', belly: '#ffffff', fin: '#f0e8dc', tailC: '#3a6ed8', x: 1, y: 5, w: 11, h: 6, tail: 4, pattern: (P) => { P.rect(5, 5, 3, 2, '#2a5ec8'); P.rect(8, 7, 3, 2, '#2a5ec8'); P.px(4, 8, '#e84a3a'); P.px(1, 9, '#3a2a20'); P.px(0, 10, '#3a2a20'); } }),
  lake_serpentfish: (P) => {
    const pts = [[1, 7], [3, 6], [5, 6], [7, 8], [9, 9], [11, 8], [13, 6], [14, 5]];
    for (let i = 0; i < pts.length - 1; i++) P.thick(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 3, '#2f8a78');
    for (let i = 1; i < pts.length - 1; i++) P.px(pts[i][0], pts[i][1] + 1, '#e8c050');
    for (const [i, j] of [[4, 4], [8, 6], [12, 4]]) P.px(i, j, '#e8c050');
    P.px(1, 6, '#ff4a3a'); P.px(0, 8, '#1a3a30');
  },
  // woodcutting
  oak_log: (P) => log(P, { bark: '#8a5a32', end: '#e8b878', marks: (P, y, h) => { P.hline(7, y + 2, 4, '#6a4024'); P.hline(9, y + h - 2, 4, '#6a4024'); } }),
  pine_log: (P) => { log(P, { bark: '#7a4630', end: '#f0cc90', marks: (P, y) => { P.hline(8, y + 3, 5, '#5a3020'); } }); P.rect(10, 2, 1, 4, '#3a7a3a'); P.px(9, 3, '#4a9a44'); P.px(11, 3, '#4a9a44'); P.px(9, 4, '#4a9a44'); P.px(11, 4, '#4a9a44'); },
  birch_log: (P) => log(P, { bark: '#efe8d6', end: '#f0d098', ring: '#d0a868', marks: (P, y, h) => { P.hline(7, y + 1, 2, '#2a2228'); P.hline(11, y + 3, 2, '#2a2228'); P.hline(8, y + h - 2, 3, '#2a2228'); } }),
  cedar_log: (P) => log(P, { bark: '#a8502e', end: '#eea47a', ring: '#c06a48', marks: (P, y, h) => { P.hline(7, y + 2, 6, '#7a3420'); P.hline(8, y + h - 3, 5, '#c8704a'); } }),
  olive_heartwood: (P) => { P.poly([[2, 11], [10, 3], [14, 6], [6, 14]], '#9a7a3a'); P.line(5, 10, 10, 5, '#5a4220'); P.line(7, 11, 12, 6, '#c8a058'); P.px(8, 8, '#3a2a14'); P.ell(10, 1, 5, 3, '#7aa042'); P.px(12, 2, '#a8c860'); },
  amber_resin: (P) => { P.ell(3, 5, 10, 10, '#f09a1a'); P.poly([[6, 6], [8, 1], [10, 6]], '#f09a1a'); P.ell(5, 7, 5, 5, '#ffc040'); P.px(6, 8, '#fff2b0'); P.px(7, 8, '#fff2b0'); P.px(9, 11, '#6a3a10'); P.px(10, 11, '#6a3a10'); P.px(9, 10, '#8a5a20'); },
  dryad_acorn: (P) => { P.ell(4, 7, 8, 8, '#f0c838'); P.ell(5, 9, 4, 4, '#ffe880'); P.ell(3, 4, 10, 5, '#8a5a2a'); P.rect(4, 6, 8, 1, '#6a4020'); P.rect(7, 1, 2, 4, '#6a4020'); P.ell(9, 0, 6, 3, '#5ab04a'); P.px(1, 2, '#fff6b0'); P.px(14, 9, '#fff6b0'); P.px(2, 12, '#fff6b0'); },
  // ship repair
  iron_nails: (P) => { for (const [x, y] of [[3, 3], [7, 2], [11, 4]]) { P.rect(x - 1, y, 4, 2, '#c8ced6'); P.rect(x, y + 2, 2, 9, '#9aa4b0'); P.px(x, y + 11, '#7a8490'); } },
  hemp_rope: (P) => { P.ell(1, 2, 14, 12, '#c8a060'); P.ell(4, 5, 8, 6, '#8a6a3a'); P.ell(6, 7, 4, 2, '#c8a060'); for (const [i, j] of [[3, 4], [5, 3], [11, 4], [12, 7], [3, 10], [9, 12]]) P.px(i, j, '#e8c888'); P.thick(12, 11, 15, 15, 2, '#c8a060'); },
  pine_tar: (P) => { P.rect(3, 5, 10, 9, '#7a5a3a'); P.hline(3, 7, 10, '#5a4028'); P.hline(3, 11, 10, '#5a4028'); P.ell(3, 3, 10, 4, '#2a1e1a'); P.ell(5, 4, 4, 1, '#5a4a40'); P.vline(5, 6, 3, '#2a1e1a'); P.vline(10, 6, 2, '#2a1e1a'); P.thick(2, 3, 1, 1, 1, '#9aa0a8'); P.thick(14, 3, 15, 1, 1, '#9aa0a8'); },
  sailcloth: (P) => { P.poly([[2, 4], [13, 2], [14, 12], [3, 14]], '#f2ecdc'); P.line(3, 8, 13, 7, '#d8ccb0'); P.poly([[2, 4], [13, 2], [13, 4], [3, 6]], '#c8403a'); P.rect(7, 2, 2, 12, '#a87a48'); },
  brass_fitting: (P) => { P.ell(1, 1, 14, 14, '#e0b040'); P.ell(4, 4, 8, 8, '#5a9ac8'); P.ell(5, 5, 4, 3, '#a8d8f0'); for (const [i, j] of [[7, 1], [7, 13], [1, 7], [13, 7]]) P.px(i, j, '#8a6420'); },
  sea_pearl: (P) => { P.ell(1, 7, 14, 8, '#f0a8b8'); P.ell(2, 2, 12, 7, '#f6c4d0'); P.line(3, 4, 7, 7, '#d88898'); P.line(12, 4, 9, 7, '#d88898'); P.ell(5, 6, 6, 6, '#fbf8ff'); P.px(6, 7, '#ffffff'); P.px(9, 10, '#d8d0e8'); },
  old_compass: (P) => { P.ell(1, 1, 14, 14, '#c89838'); P.ell(3, 3, 10, 10, '#f4ecd0'); P.line(8, 4, 8, 8, '#d83a2a'); P.line(8, 8, 8, 11, '#3a3440'); P.px(7, 7, '#3a3440'); P.px(9, 7, '#3a3440'); P.rect(7, 0, 2, 1, '#8a6420'); },
  // the village watch (what a patrol of the palisade turns up)
  flint_arrowhead: (P) => { P.poly([[8, 1], [13, 9], [8, 15], [3, 9]], '#7a7a8a'); P.poly([[8, 1], [13, 9], [8, 9]], '#a8a8b8'); P.px(7, 6, '#d0d0dc'); P.rect(7, 13, 2, 2, '#6a4a2a'); },
  wild_herbs: (P) => { for (const [x, c] of [[4, '#5aa848'], [8, '#7ac85a'], [11, '#4a9a3c']]) { P.line(8, 14, x, 3, '#3a7a32'); P.ell(x - 2, 2, 5, 4, c); } P.rect(5, 11, 6, 2, '#c8a060'); P.px(4, 4, '#f0e070'); },
  lost_coin: (P) => { P.ell(3, 3, 10, 10, '#b87a3a'); P.ell(5, 5, 6, 6, '#d89a4a'); P.px(7, 7, '#8a5222'); P.px(8, 8, '#8a5222'); P.px(5, 5, '#f8d090'); P.line(11, 12, 14, 15, '#6a6a7a'); },
  boar_bristle: (P) => { for (let i = 0; i < 6; i++) P.line(4 + i * 1.5, 13, 3 + i * 2, 2 + (i % 2) * 2, i % 2 ? '#5a4030' : '#7a5a40'); P.rect(3, 12, 10, 3, '#a8703a'); P.hline(3, 13, 10, '#c8903a'); },
  bronze_buckle: (P) => { P.rect(2, 4, 12, 9, '#c8902e'); P.rect(4, 6, 8, 5, '#3a2a20'); P.vline(8, 5, 7, '#e8c060'); P.hline(2, 4, 12, '#f0d070'); P.px(3, 12, '#8a5a1a'); },
  helm_crest: (P) => { P.ell(2, 5, 12, 9, '#d8463a'); P.ell(3, 4, 6, 4, '#f06a5a'); for (const x of [4, 7, 10]) P.vline(x, 7, 6, '#a82a2a'); P.rect(5, 12, 6, 3, '#c89838'); },
  griffin_feather: (P) => { P.poly([[3, 15], [12, 1], [14, 3], [6, 15]], '#f0d070'); P.poly([[5, 13], [12, 3], [13, 5], [7, 13]], '#ffffff'); P.line(3, 15, 13, 2, '#a8702a'); P.px(12, 1, '#e8f8ff'); P.px(2, 8, '#fff6b0'); P.px(14, 10, '#fff6b0'); },
  lantern: (P) => { P.ell(5, 0, 6, 4, '#3a3440'); P.rect(4, 3, 8, 2, '#3a3440'); P.rect(4, 5, 8, 8, '#ffd060'); P.rect(6, 6, 4, 5, '#fff4c0'); P.vline(4, 5, 8, '#3a3440'); P.vline(11, 5, 8, '#3a3440'); P.rect(3, 13, 10, 2, '#3a3440'); },
  // the game's rare items
  lore_scroll: (P) => { P.rect(3, 3, 10, 10, '#f0e2b8'); P.rect(2, 2, 12, 2, '#d8c490'); P.rect(2, 12, 12, 2, '#d8c490'); for (const j of [5, 7, 9]) P.hline(5, j, 6, '#a89870'); P.ell(9, 9, 5, 5, '#c8302a'); P.px(11, 11, '#f06050'); },
  treasure_map: (P) => { P.poly([[1, 3], [6, 2], [10, 4], [15, 3], [15, 13], [10, 14], [6, 12], [1, 13]], '#e8d098'); P.vline(6, 3, 9, '#c8a868'); P.vline(10, 4, 9, '#c8a868'); for (const [i, j] of [[3, 11], [4, 9], [6, 8], [8, 9], [9, 7]]) P.px(i, j, '#8a5a30'); P.line(10, 4, 13, 7, '#d02a2a'); P.line(13, 4, 10, 7, '#d02a2a'); },
  relic: (P) => { P.poly([[8, 0], [13, 6], [8, 15], [3, 6]], '#5ad8c8'); P.poly([[8, 0], [13, 6], [8, 6]], '#a8fff0'); P.poly([[3, 6], [8, 6], [8, 15]], '#2aa898'); P.rect(1, 12, 14, 3, '#b8903a'); P.px(0, 4, '#e8fffa'); P.px(15, 2, '#e8fffa'); },
  // drachmas
  drachma: (P) => { P.ell(2, 2, 12, 12, '#f2c440'); P.ell(4, 4, 8, 8, '#e0a828'); P.ell(5, 5, 6, 6, '#f8d860'); P.px(7, 6, '#b07818'); P.px(8, 6, '#b07818'); P.rect(7, 7, 2, 3, '#b07818'); P.px(4, 4, '#fff6c0'); },
  coins: (P) => { for (const [x, y] of [[1, 9], [4, 7], [7, 5]]) { P.ell(x, y, 9, 5, '#f2c440'); P.hline(x + 2, y + 2, 5, '#c8901e'); } P.ell(5, 1, 9, 5, '#f8d860'); P.hline(7, 3, 5, '#c8901e'); },
  // tools and places (the bubbles over the NPCs, the buttons)
  bag: (P) => { P.ell(2, 5, 12, 10, '#b07a42'); P.rect(5, 3, 6, 3, '#8a5a30'); P.rect(4, 2, 8, 2, '#c89058'); P.rect(6, 8, 4, 3, '#e8c060'); P.px(7, 9, '#8a6020'); },
  rod: (P) => { P.line(2, 14, 13, 1, '#a8703a'); P.line(3, 14, 14, 1, '#7a4a24'); P.rect(2, 11, 3, 2, '#3a3a48'); P.vline(14, 2, 9, '#e8f0ff'); P.rect(13, 11, 3, 3, '#e83a3a'); P.hline(13, 11, 3, '#ffffff'); },
  axe: (P) => { P.thick(4, 14, 10, 3, 2, '#a8703a'); P.poly([[8, 1], [14, 2], [15, 8], [11, 6]], '#c8d0d8'); P.line(9, 2, 14, 3, '#f0f4f8'); },
  hammer: (P) => { P.thick(4, 14, 9, 5, 2, '#a8703a'); P.rect(5, 1, 9, 5, '#9aa4b0'); P.rect(5, 1, 9, 1, '#d0d8e0'); P.rect(12, 1, 2, 5, '#6a7480'); },
  chest: (P) => { P.rect(1, 6, 14, 8, '#a8642e'); P.ell(1, 2, 14, 8, '#c07a3a'); P.rect(1, 6, 14, 2, '#7a4420'); P.vline(4, 3, 11, '#e8c050'); P.vline(11, 3, 11, '#e8c050'); P.rect(7, 7, 2, 3, '#f0d870'); },
  scales: (P) => { P.vline(7, 2, 11, '#8a6a3a'); P.rect(4, 13, 8, 2, '#8a6a3a'); P.hline(2, 3, 12, '#c8a050'); P.ell(0, 6, 6, 3, '#e8c050'); P.ell(10, 6, 6, 3, '#e8c050'); P.line(1, 4, 2, 6, '#c8a050'); P.line(14, 4, 13, 6, '#c8a050'); },
};
const potion = (col, tall) => (P) => {
  if (tall) { P.rect(5, 4, 6, 10, '#d8eef8'); P.rect(6, 7, 4, 7, col); P.rect(6, 7, 4, 1, light(col, .35)); P.rect(5, 2, 6, 2, '#a8703a'); P.rect(6, 1, 4, 1, '#c88a4a'); P.px(6, 9, '#ffffff'); }
  else { P.ell(2, 5, 12, 10, '#d8eef8'); P.ell(3, 8, 10, 6, col); P.rect(4, 8, 8, 1, light(col, .35)); P.rect(6, 2, 4, 4, '#d8eef8'); P.rect(6, 1, 4, 2, '#a8703a'); P.px(4, 9, '#ffffff'); P.px(5, 7, '#ffffff'); }
};
HP.forEach((c, i) => { D[i ? 'potion_hp' + (i + 1) : 'potion_hp'] = potion(c, false); });
MP.forEach((c, i) => { D[i ? 'potion_mp' + (i + 1) : 'potion_mp'] = potion(c, true); });

const cache = new Map();
export function icon(id) {
  if (cache.has(id)) return cache.get(id);
  const draw = D[id] || ((P) => { P.ell(3, 3, 10, 10, '#8a8070'); P.rect(7, 5, 2, 4, '#e8e0d0'); P.px(7, 10, '#e8e0d0'); });
  const c = sprite(18, 18, (P) => { P.x.translate(1, 1); draw(P); }, { out: .66 });
  cache.set(id, c); return c;
}
export const ICON_IDS = Object.keys(D);
export const potionColor = (id) => { const m = /^potion_(hp|mp)(\d*)$/.exec(id); if (!m) return null; const t = (+m[2] || 1) - 1; return (m[1] === 'hp' ? HP : MP)[t]; };
export { mix };
