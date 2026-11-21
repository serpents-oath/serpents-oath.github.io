// The wiki's second pass: adds to wiki/data.json what the game's own generator (game repo tools/site/wiki-gen.mjs) does not
// write yet, all of it READ FROM THE GAME (its modules in a headless page, its pure rule files in node, and the JSON settings
// of its server migrations), never typed by hand:
//   data.fateforge       the Fateforge: threads, tiers, chances, fees, bonuses, families, recipes, catalysts, drop sources
//   data.shopStock       the rotating town stock (js/shopstock.js STOCK) and each town's band, campaign and online
//   data.events          the special events: the schedule, Tartarus (events/tartarus/core.js) and the Golden Goose (its SQL cfg)
//   data.caveRules       caves: the online minimum level (poi.js CAVES_MIN), the mini-boss (mlevels.js LEADER), skipped caves
//   data.attackPatterns  the 32 telegraph patterns and 4 self-buffs (species/patterns.js); monsters[].attacks, onlineMonsters[].attacks
//   data.online.w200     Weapons 200: the jobs' current weapons and off hands (js/weapons200), with icons in wiki/img/w200-*.png
//   data.online.offJob   whose off hand each kind is (online/jobs.js OFF_JOB: the orb and the book are the wizard's)
//   data.online.weapons[].retired   the older job pieces Weapons 200 replaced online (weapons200/replace.js)
//
//   node tools/wiki-extra.mjs --game /path/to/game [--port 8978]      (run AFTER the game's tools/site/wiki-gen.mjs)
// Needs playwright-core and Chromium as the game's generator does (PLAYWRIGHT_CORE, CHROMIUM).
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) { const v = argv[i + 1]; if (v == null || v.startsWith('--')) A[argv[i].slice(2)] = true; else { A[argv[i].slice(2)] = v; i++; } }
if (!A.game) { console.error('usage: node tools/wiki-extra.mjs --game <game repo> [--port 8978]'); process.exit(1); }
const GAME = path.resolve(A.game), SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(SITE, 'wiki', 'data.json'), IMG = path.join(SITE, 'wiki', 'img');
const PORT = +(A.port || 8978);
const imp = (p) => import(pathToFileURL(path.join(GAME, p)).href);
const D = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const t0 = Date.now();

// ------------------------------------------------------------------ node: the pure rule files and the server's settings
const R = await imp('js/fateforge_rules.js');
const TA = await imp('js/online/events/tartarus/core.js');
const sql = (f) => fs.readFileSync(path.join(GAME, 'server/supabase/migrations', f), 'utf8');
// the JSON literal of an `insert into private.online_config (key, value) values ('<key>', '{...}'` in a migration
function cfgJson(file, key) {
  const s = sql(file), i = s.indexOf(`('${key}',`); if (i < 0) throw new Error(`${key} not in ${file}`);
  const a = s.indexOf("'{", i), b = s.indexOf("}'", a); return JSON.parse(s.slice(a + 1, b + 1));
}
const SRC = cfgJson('20261229100000_fateforge_sources.sql', 'ff_sources');
const SE = cfgJson('20261225100000_special_events.sql', 'special_events');
const GOOSE = (() => { const s = sql('20261225100000_special_events.sql'), i = s.indexOf("('golden_goose',"), a = s.indexOf("'{", i), b = s.indexOf("}'", a);
  const head = s.slice(i, a).match(/\('golden_goose',\s*(\w+),\s*(\d+),\s*(\d+)/); return { daily: head[1] === 'true', lead: +head[2], run: +head[3], cfg: JSON.parse(s.slice(a + 1, b + 1)) }; })();
const TART_DEF = (() => { const s = sql('20261225100000_special_events.sql'), m = s.match(/\('tartarus',\s*(\w+),\s*(\d+),\s*(\d+)/); return { daily: m[1] === 'true', lead: +m[2], run: +m[3] }; })();
// the goose's coins (private.goose_coins: kills x 1.5 x (2 + 1.2 x level)): the factors read from the function's own text
const GC = (() => { const m = sql('20261225100000_special_events.sql').match(/\*\s*([\d.]+)\s*\*\s*\(\s*([\d.]+)\s*\+\s*([\d.]+)\s*\*\s*least\(\s*(\d+)/); return { k: +m[1], a: +m[2], b: +m[3], cap: +m[4] }; })();

const FF = {
  onlineOnly: true, max: R.FF_MAX, slots: R.FF_SLOTS, chance: R.FF_CHANCE.slice(), fee: R.FEE.slice(), types: R.FF_TYPES.slice(), typeName: R.TYPE_NAME,
  familyTypes: R.FAMILY_TYPES, catFamily: R.CAT_FAMILY, jobPrimary: R.JOB_PRIMARY, balance: R.BALANCE, speedCapItem: R.SPEED_CAP_ITEM, speedCapWorn: R.SPEED_CAP_WORN,
  tiers: R.TIERS.map((T) => ({ id: T.id, min: T.min, max: T.max, rarity: T.rarity, name: T.name })),
  threads: R.THREADS.map((x) => ({ id: x.id, design: x.design, tier: x.tier, type: x.type, min: x.min, max: x.max, rarity: x.rarity, name: x.name })),
  mats: R.MATS.map((m) => ({ id: m.id, design: m.design, rarity: m.rarity, name: m.name })),
  recipes: R.RECIPES.map((r) => ({ id: r.id, tier: r.tier, typed: r.typed, fee: r.fee, ins: r.ins.map(([w, n]) => ({ what: w, n, mat: !!R.MAT_BY[w] })) })),
  sources: R.SOURCES, sourcesOff: R.SOURCES_OFF.slice(), endgameLv: R.ENDGAME_LV, catalysts: R.CATALYSTS.map(([id, n, p]) => ({ id, n, chance: p })),
  server: { // the server's own rules for the drops (migration 20261229100000_fateforge_sources.sql, 'ff_sources')
    enabled: SRC.enabled, greyGap: SRC.kill.grey_gap, overGap: SRC.kill.over_gap, eliteBurst: SRC.kill.elite_burst, eliteEveryS: Math.round(1 / SRC.kill.elite_per_s),
    killBurst: SRC.kill.burst, killPerS: SRC.kill.per_s, bossLvGap: SRC.boss_lv_gap, tartarus: !!SRC.tartarus?.enabled, goose: !!SRC.goose?.enabled,
    bosscaves: Object.entries(SRC.bosscaves).map(([id, [lv, respawnMin]]) => ({ id, lv, respawnMin })), dungeons: Object.entries(SRC.dungeons).map(([id, top]) => ({ id, top })),
  },
};
const EV = {
  tz: SE.tz, gapMin: SE.gap_min, lateMin: SE.late_min,
  tartarus: { daily: TART_DEF.daily, leadS: TA.TT.noticeS, maxPlayers: TA.TT.maxPlayers, minPlayers: TA.TT.minPlayers, bossHp: TA.TT.bossHp, dps: TA.TT.dps, hands: TA.TT.hands,
    phases: TA.TT.phases.length, arenaR: TA.TT.arenaR, fightMaxS: TA.TT.fightMaxS, targetS: [TA.TT.targetMinS, TA.TT.targetMaxS], reviveS: TA.TT.reviveS, lootWindowS: TA.TT.lootWindowS,
    sealFrac: TA.TT.seal.frac, premiumShare: TA.TT.premiumShare, expByLevel: TA.REWARD.expByLevel, drachma: TA.REWARD.drachma, gearLvl: TA.REWARD.loot.gear.lvl,
    sites: TA.SITES.map((s) => ({ id: s.id, name: s.name, x: s.x, z: s.z })) },
  goose: { daily: GOOSE.daily, leadS: GOOSE.lead, chaseS: GOOSE.cfg.chase_ms / 1000, speed: GOOSE.cfg.speed, nearR: GOOSE.cfg.near_r, minS: GOOSE.cfg.min_ms / 1000, catchR: GOOSE.cfg.catch_r,
    killsPart: GOOSE.cfg.kills_part, killsCatch: GOOSE.cfg.kills_catch, coin: GC },
};

// ------------------------------------------------------------------ the page: what only the running game knows
const common = await import(pathToFileURL(path.join(GAME, 'tools/site/common.mjs')).href);
const srv = await common.gameServer(PORT), b = await common.browser();
let camp, onl;
try {
  const ids = (D.monsters || []).map((m) => ({ id: m.id, story: !!m.story }));
  const c = await common.newPage(b, 960, 540, { vclock: true });
  await common.openGame(c.page, PORT, 'play=1&nohow=1&nosave=1&gfx=low&god=1&lang=en&story=ch1&done=c1_card&place=athenai&hour=12');
  c.page.setDefaultTimeout(0);
  console.log(`campaign page in ${((Date.now() - t0) / 1000) | 0}s`);
  camp = await c.page.evaluate(pageCampaign, { ids });
  await c.page.close();
  const o = await common.newPage(b, 960, 540, { vclock: true });
  await common.openGame(o.page, PORT, 'play=1&nohow=1&nosave=1&gfx=low&god=1&lang=en&mode=online&lvl=40&story=ch2&place=elaia&hour=11');
  o.page.setDefaultTimeout(0);
  await o.page.waitForFunction(() => !!window.__g?.weapons200, null, { timeout: 120000, polling: 500 });
  console.log(`online page in ${((Date.now() - t0) / 1000) | 0}s`);
  onl = await o.page.evaluate(pageOnline, { named: (D.online?.weapons || []).map((w) => w.id) });
} finally { await b.close(); srv?.close(); }

// ------------------------------------------------------------------ into the data
const safe = (k) => k.replace(/[^A-Za-z0-9_.-]+/g, '_');
let pics = 0, bytes = 0;
for (const [k, url] of Object.entries(onl.images)) {
  const m = /^data:image\/png;base64,(.*)$/.exec(url || ''); if (!m) continue;
  const buf = Buffer.from(m[1], 'base64'); fs.writeFileSync(path.join(IMG, safe(k) + '.png'), buf); pics++; bytes += buf.length;
}
for (const w of onl.w200) if (w.img) w.img = safe(w.img) + '.png';
// the Fate Threads' and catalysts' pictures are WebP (js/fateforge_icons.js), which the game's generator (PNG only) leaves out
const { FF_ICONS } = await imp('js/fateforge_icons.js');
for (const x of [...(D.items || []), ...(D.online?.items || [])]) {
  const m = /^data:image\/webp;base64,(.*)$/.exec(FF_ICONS[x.id] || ''); if (!m) continue;
  const f = safe((D.online?.items || []).includes(x) ? 'oitems-' + x.id : 'items-' + x.id) + '.webp', buf = Buffer.from(m[1], 'base64');
  fs.writeFileSync(path.join(IMG, f), buf); x.img = f; pics++; bytes += buf.length;
}
FF.catNames = onl.catNames;
D.fateforge = FF;
D.events = EV;
D.shopStock = { ...camp.stock, towns: camp.stockTowns, onlineTowns: onl.stockTowns, w200: onl.w200places };
D.caveRules = { minOnline: camp.cavesMin, leader: camp.leader, skippedOnline: onl.cavesSkipped, onlineCaves: onl.caves, bossMiniGap: 6 };
D.attackPatterns = camp.patterns;
for (const m of D.monsters || []) if (camp.attacks[m.id]) m.attacks = camp.attacks[m.id];
for (const m of D.onlineMonsters || []) if (onl.attacks[m.id]) m.attacks = onl.attacks[m.id];
if (D.online) {
  D.online.w200 = onl.w200; D.online.w200cats = onl.w200cats; D.online.offJob = onl.offJob; D.online.w200text = onl.w200text;
  const ret = new Set(onl.retired); for (const w of D.online.weapons || []) if (ret.has(w.id)) w.retired = true; else delete w.retired;
  D.online.counts = { ...(D.online.counts || {}), w200: onl.w200.length };
}
D.counts = { ...(D.counts || {}), fateThreads: FF.threads.length, attackPatterns: Object.keys(camp.patterns.patterns).length, w200: onl.w200.length };
D.extraGenerated = new Date().toISOString();
fs.writeFileSync(DATA, JSON.stringify(D));
console.log(`wiki-extra: ${onl.w200.length} Weapons 200 items, ${pics} icons (${(bytes / 1024) | 0} KB), ${Object.keys(camp.attacks).length} campaign + ${Object.keys(onl.attacks).length} online monsters with patterns, ${onl.retired.length} retired job pieces; ${((Date.now() - t0) / 60000).toFixed(1)} min`);

// ================================================================== page side (serialized into the game's page)
async function pageCampaign({ ids }) {
  const nm = (x) => (x == null ? null : typeof x === 'string' ? { he: x, en: x } : x);
  const P = await import('/js/species/patterns.js'), DB = await import('/js/monsterdb.js'), ENT = await import('/js/entities.js');
  const SS = await import('/js/shopstock.js'), POI = await import('/js/poi.js'), ML = await import('/js/mlevels.js');
  const patterns = {}; for (const [k, v] of Object.entries(P.PATTERNS)) patterns[k] = { tier: v.tier, mul: v.mul, wind: v.wind, cd: v.cd, min: v.min, max: v.max, moves: !!v.moves, slow: v.slow || null, lock: !!v.lock };
  const buffs = {}; for (const [k, v] of Object.entries(P.BUFFS)) buffs[k] = { dur: v.dur, cd: v.cd, dmg: v.dmg ?? null, spd: v.spd ?? null, k: v.k ?? null, heal: v.heal ?? null, color: v.color, word: nm(v.word) };
  // per kind: the rule's outcome (monsterdb.initEnemy -> patterns.extraMoves), read by its own functions
  const attacks = {};
  for (const { id, story } of ids) {
    const M = DB.META[id], T = ENT.ETYPES[id]; if (!M || !T || T.boss || T.bossScale || T.mimic || story) continue;
    const special = P.hasSpecial(T), basic = special ? P.patternsOf(id, M, T, { fancy: false }) : [];
    const fancy = (special ? P.patternsOf(id, M, T, { fancy: true }) : P.patternsOf(id, M, T, { only: 'fancy' })).filter((p) => !basic.includes(p));
    attacks[id] = { special, basic, fancy, buff: P.buffOf(id, M) };
  }
  const stockTowns = (__g.poiTowns || []).map((S) => { const lv = SS.townLevel(S); return { id: S.id, level: lv, band: SS.bandOf(lv), village: !(S.big >= 2) }; });
  return { patterns: { patterns, buffs, plainLv: P.PLAIN_LV, buffLv: P.BUFF_LV }, attacks, stock: { ...SS.STOCK, hours: SS.STOCK.ms / 3600000 }, stockTowns, cavesMin: POI.CAVES_MIN,
    leader: { hp: ML.LEADER.hp, dmg: ML.LEADER.dmg, exp: ML.LEADER.exp, lvl: ML.LEADER.lvl, chance: ML.LEADER.chance, minLevel: ML.LEADER.minLevel } };
}
async function pageOnline({ named }) {
  const g = window.__g, images = {};
  const P = await import('/js/species/patterns.js'), DB = await import('/js/monsterdb.js'), ENT = await import('/js/entities.js'), OB = await import('/js/online/bestiary.js');
  const SS = await import('/js/shopstock.js'), CAT = await import('/js/catalog.js'), WPN = await import('/js/weapons.js'), JB = await import('/js/online/jobs.js');
  const RP = await import('/js/weapons200/replace.js'), RU = await import('/js/weapons200/rules.js'), PL = await import('/js/weapons200/places.js'), HA = await import('/js/weapons200/hands.js');
  const ML = await import('/js/mlevels.js');
  const r1 = (v) => (v == null || !isFinite(v) ? null : Math.round(v * 10) / 10), r3 = (v) => (v == null || !isFinite(v) ? null : Math.round(v * 1000) / 1000);
  const nm = (x) => (x == null ? null : typeof x === 'string' ? { he: x, en: x } : x);
  // the online monsters' moves at their one level (and as a pack leader where one can lead)
  const attacks = {};
  for (const Rw of OB.ROWS) {
    const M = DB.META[Rw.id] || DB.META[Rw.b], T = ENT.ETYPES[Rw.id] || ENT.ETYPES[Rw.b]; if (!M || !T) continue;
    const e = { type: Rw.id, level: Rw.lv, elite: !!Rw.elite };
    const mv = P.extraMoves(e, M, T), lead = !Rw.elite && Rw.lv >= ML.LEADER.minLevel ? P.extraMoves({ ...e, leader: true, level: ML.leaderLevel(Rw.lv) }, M, T) : [];
    const pat = (l) => l.filter((x) => x.startsWith('p_')).map((x) => x.slice(2)), buf = (l) => l.find((x) => x.startsWith('b_'))?.slice(2) || null;
    attacks[Rw.id] = { patterns: pat(mv), buff: buf(mv), leader: lead.length ? { patterns: pat(lead).filter((p) => !pat(mv).includes(p)), buff: buf(lead) } : null };
  }
  // Weapons 200: every catalog base of the 200 as the online catalog makes it
  const statsAt = (base, lvl, gi) => { const id = CAT.makeId(base, lvl, gi), I = id && CAT.itemInfo(id); if (!I) return null; const s = I.stats || {};
    return { id, lvl: I.reqLevel, power: I.powerKind === 'percent' ? r3(s.power) : r1(s.power), atkSpeed: r3(s.atkSpeed), crit: r3(s.crit), defense: r3(s.defense), hp: r1(s.hp), move: r3(s.move), block: r3(I.block), dps: r1(I.loadout?.dps) }; };
  const asData = async (u) => { if (typeof u !== 'string' || !u.startsWith('blob:')) return u; const bl = await (await fetch(u)).blob(); return await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(bl); }); };
  const W = g.weapons200, w200 = [];
  for (const row of W.rows) {
    const B = CAT.BASES[row.base]; if (!B) continue;
    const I = CAT.itemInfo(CAT.makeId(row.base, B.lvl, 0)) || {};
    const p = { id: row.base, wpn: row.id, n: row.n, cls: row.cls, job: RU.CLASS_JOB[row.cls] || null, cat: B.cat, hands: row.hands, name: nm(B.name), desc: nm(B.desc), lvl: B.lvl, max: B.max, slot: I.slot || null,
      needs: (row.needs || []).map(([k, v]) => [k, v]), path: row.path || null, stats: {} };
    for (const [gi, r] of CAT.RARITIES.entries()) p.stats[r] = [statsAt(row.base, B.lvl, gi), B.max !== B.lvl ? statsAt(row.base, B.max, gi) : null].filter(Boolean);
    try { const u = await asData(await WPN.iconFor(row.base)); if (u) { images['w200-' + row.base] = u; p.img = 'w200-' + row.base; } } catch (e) { /* no icon */ }
    w200.push(p); if (w200.length % 10 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  const cats = [...new Set(w200.map((x) => x.cat))];
  const w200cats = cats.map((c) => ({ id: c, name: nm(CAT.CATS[c]?.name || RU.NEW_CATS[c]?.name), job: RU.CLASS_JOB[w200.find((x) => x.cat === c).cls], n: w200.filter((x) => x.cat === c).length, unlock: CAT.UNLOCK?.[c] ?? null }));
  // the older named job pieces Weapons 200 replaced (sources.js sweep: a replaced kind, not one of the three starting weapons)
  const retired = named.filter((id) => { const B = CAT.BASES[id]; return B && !B.w200 && RP.KINDS[B.cat] && B.cat !== 'arrows' && !RP.isKept(id); });
  const catNames = {}; for (const c of Object.keys((await import('/js/fateforge_rules.js')).CAT_FAMILY)) catNames[c] = nm(CAT.CATS[c]?.name || RU.NEW_CATS[c]?.name) || { he: c, en: c };
  const stockTowns = (g.poiTowns || []).map((S) => { const lv = SS.townLevel(S); return { id: S.id, level: lv, band: SS.bandOf(lv), village: !(S.big >= 2) }; });
  const caves = (g.caves || []).filter((c) => !c.den).map((c) => { let lv = null; try { lv = g.mdb?.caveConfig?.(c, g.stage)?.recommendedLevel ?? null; } catch (e) { /* */ } return { id: c.id, name: nm(c.name), x: Math.round(c.x), z: Math.round(c.z), level: lv }; });
  return { attacks, w200, w200cats, retired, catNames, offJob: { ...JB.OFF_JOB }, w200text: HA.W200_TEXT, images, stockTowns,
    w200places: { villageMax: PL.VILLAGE_MAX, cityMin: PL.CITY_MIN, cityMax: PL.CITY_MAX },
    cavesSkipped: (g.cavesSkipped || []).map((c) => ({ id: c.id, level: c.level ?? null })), caves };
}
