// The online skills of the live build (Skills v4, js/skillsv4: ON for everyone online, flags.js) into the wiki's data.
// Run after the game's wiki-gen and tools/wiki-extra.mjs:  node tools/wiki-skills.mjs --game /path/to/game [--port 8979]
// Reads everything from the game's own modules in a headless page (no game started, no network beyond the local server):
//   D.online.v4        the 193 skills: name / desc (he, en, es), job, calling, job tier, slot, category, unlock level, mana and
//                      cooldown as the game's skill table gives them (skillrules.js applied), price at the trainer, what it
//                      replaces, its cast data (target, reach, hits, statuses), authored or "soon"
//   D.online.v4cats    the category names and colours of the in-game skills window
//   D.online.skills[]  each old online job skill gets retired: true (and v4: its successor) unless the game still uses it
//   wiki/img/sv4-SKL-NNN.webp   each icon cut from the game's one icon sheet
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), SITE = path.resolve(HERE, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const GAME = path.resolve(arg('game', '../game')), PORT = +arg('port', 8979);
const DATA = path.join(SITE, 'wiki/data.json'), IMG = path.join(SITE, 'wiki/img');
const common = await import(pathToFileURL(path.join(GAME, 'tools/site/common.mjs')).href);
const srv = await common.gameServer(PORT), b = await common.browser();
let out;
try {
  const c = await common.newPage(b, 960, 540, { vclock: false });
  await c.page.goto(`http://127.0.0.1:${PORT}/js/skillsv4/atlasmeta.js`);
  out = await c.page.evaluate(pageSkills);
} finally { await b.close(); srv.close?.(); }

const D = JSON.parse(fs.readFileSync(DATA, 'utf8')), O = D.online;
let bytes = 0;
for (const s of out.skills) {
  const m = /^data:image\/webp;base64,(.+)$/.exec(s.icon || ''); delete s.icon; if (!m) continue;
  const f = 'sv4-' + s.id + '.webp', buf = Buffer.from(m[1], 'base64');
  fs.writeFileSync(path.join(IMG, f), buf); s.img = f; bytes += buf.length;
}
O.v4 = out.skills; O.v4cats = out.cats; O.v4info = out.info;
const kept = new Set(out.info.kept);
let retired = 0;
for (const s of O.skills || []) {
  if (kept.has(s.id)) { delete s.retired; delete s.v4; continue; }
  s.retired = true; retired++;
  const n = out.successor[s.id]; if (n) s.v4 = n; else delete s.v4;
}
D.counts = { ...(D.counts || {}), v4skills: out.skills.length, v4authored: out.skills.filter((s) => s.authored).length, retiredSkills: retired };
D.extraGenerated = { ...(D.extraGenerated || {}), skillsV4: new Date().toISOString() };
fs.writeFileSync(DATA, JSON.stringify(D));
console.log(`v4 skills ${out.skills.length} (authored ${D.counts.v4authored}), old online skills retired ${retired}, kept ${[...kept].join(',')}; icons ${(bytes / 1024).toFixed(0)} KB`);

// ---------------------------------------------------------------- in the page
async function pageSkills() {
  const V = await import('/js/skillsv4/index.js'), K = await import('/js/skillsv4/kit.js'), A = await import('/js/skillsv4/skills/index.js');
  const R = await import('/js/skillsv4/registry.js'), I = await import('/js/skillsv4/icons.js'), ON = await import('/js/skillsv4/online.js');
  const W = await import('/js/weapons.js'), RU = await import('/js/skillrules.js'), JS = await import('/js/online/jobskills.js');
  R.installRegistry({}); // the authored skills into the game's skill table (mana / cooldown through skillrules.js), at each one's unlock level
  await I.loadSheet();
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const ctx = cv.getContext('2d');
  const tri = (o) => (o ? { he: o.he, en: o.en, es: o.es ?? o.en } : null);
  const r2 = (x) => (x == null || x === '' ? null : Math.round(+x * 100) / 100);
  const skills = V.SKILLS_V4.map((r) => {
    const a = A.AUTHORED[r.id], s = A.isAuthoredV4(r.id) ? W.SKILLS[r.id] : null, e = a?.e || {};
    ctx.clearRect(0, 0, 64, 64); I.drawIcon(ctx, r.id, 0, 0, 64);
    const hits = (e.hits || []).filter((h) => h.beu > 0);
    const cast = s ? {
      tgt: e.tgt || null, range: r2(e.range), radius: r2(e.radius), arc: r2(e.arc), width: r2(e.width), move: r2(e.move), cap: e.cap ?? null, dur: r2(e.dur), el: e.el || null,
      hits: hits.reduce((n, h) => n + (h.n || 1), 0) || null,
      cc: (e.cc || []).map((x) => ({ k: x.k, dur: r2(x.dur) })),
      buff: e.buff ? { dur: r2(e.buff.dur ?? e.buff.d), ...Object.fromEntries(Object.entries(e.buff).filter(([k, v]) => typeof v === 'number' && k !== 'dur' && k !== 'd')) } : null,
      heal: !!(e.heal || s.heal), cls: RU.skillClass(s),
    } : null;
    return {
      id: r.id, n: r.n, name: tri(r.name), desc: tri(s?.desc || e.desc) || null, job: r.job, path: r.path, oldPath: r.path ? V.OLD_PATH[r.path] : null, tier: r.tier, slot: r.slot, cat: r.cat, lvl: r.lvl,
      authored: !!s, mana: s ? Math.round(s.mana) : null, cd: s ? r2(s.cd) : null, price: K.priceV4(r.id), replaces: [...r.replaces], cast,
      icon: cv.toDataURL('image/webp', 0.9),
    };
  });
  const successor = {}; for (const id of Object.keys(JS.JOB_SKILLS)) { const n = K.successor(id); if (n) successor[id] = n; }
  const cats = Object.fromEntries(V.CATS.map((c) => [c, { name: tri(ON.CAT_NAME[c]), color: ON.CAT_LOOK[c]?.[0] || null }]));
  return { skills, successor, cats, info: { kept: [...V.NOT_A_SLOT], first: K.SALMON, orphans: [...K.ORPHANS], tierStart: [...V.TIER_START], manifest: V.MANIFEST_VERSION } };
}
