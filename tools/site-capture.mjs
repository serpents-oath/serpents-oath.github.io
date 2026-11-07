// Re-captures the site's pictures and clips from the real game, so the gallery never drifts from the build.
//
//   node tools/site-capture.mjs --game /path/to/game [--site <this repo>] [--port 8976] [shots] [clips] [--only 1,2,5]
//                               [--draft]   (shots: a quick look into --out, nothing written to assets/)
//                               [--out <dir>] (shots: where to write; default assets/)
//
// What it makes:
//   clips  the banner (assets/hero.webm/.mp4/.jpg) and the four "About the game" loops (clip-ride, clip-fight, clip-story,
//          clip-inventory): it runs the game's own recorder, <game>/tools/site/record.mjs (seamless loops, VP9 + H.264 + poster,
//          sizes capped per clip), which keeps the scene directors beside the game code they drive. Clip names after `clips`
//          pick some: node tools/site-capture.mjs --game ../game clips banner fight
//   shots  the eight gallery pictures assets/shot-1..8.jpg (1280x720, what home.js shows under "From the game"), each a scene set
//          up in the page (SHOTS below): the market in Elaia, a fight in the fields, Charon's crossing, the road to Athens, the
//          character creator (BETA ONLINE), the archer's skill tree (BETA ONLINE), trading with a player, the Seraph set in combat.
//          shot-7 (the trade) needs two live game pages over a realtime stand-in: it is taken by the game's own
//          tests/online_trade.mjs (SHOTS=<dir>); this script copies its trade picture when --trade <dir> points at that folder,
//          and otherwise keeps the one in assets/ and says so.
//
// Needs: node 22, playwright-core (PLAYWRIGHT_CORE=/path/to/playwright-core/index.mjs, or one of the places tried below),
// Chromium at CHROMIUM (default /opt/pw-browsers/chromium) and ffmpeg (FFMPEG, default /usr/bin/ffmpeg) for the clips and the
// jpeg sizing. The game runs headless on SwiftShader with the virtual clock of <game>/tools/site/vclock.js: every frame is one
// step of the game loop, so the result does not depend on the machine's speed, and Math.random is seeded so a run repeats.
// Nothing in the game repo is written; the game folder is only served (python3 -m http.server on --port also works).
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_DEFAULT = path.resolve(HERE, '..');

// ---------------------------------------------------------------- arguments
const argv = process.argv.slice(2), A = { _: [] };
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const v = argv[i + 1]; if (v == null || v.startsWith('--')) A[a.slice(2)] = true; else { A[a.slice(2)] = v; i++; } } else A._.push(a); }
if (!A.game) { console.error('usage: node tools/site-capture.mjs --game <game repo> [--site <site repo>] [--port 8976] [shots] [clips] [--only 1,2]'); process.exit(1); }
const GAME = path.resolve(A.game), SITE = path.resolve(A.site || SITE_DEFAULT), PORT = +(A.port || 8976);
const what = A._.filter((w) => w === 'shots' || w === 'clips'); if (!what.length) what.push('shots', 'clips');
const clipNames = A._.filter((w) => !['shots', 'clips'].includes(w));
const ONLY = A.only ? String(A.only).split(',').map((s) => +s) : null;
if (!fs.existsSync(path.join(GAME, 'tools/site/common.mjs'))) { console.error(`no tools/site/common.mjs under ${GAME}: is --game the game repo?`); process.exit(1); }

// playwright-core: the env, the game's own guess list, or the system node-tools
const PW = [process.env.PLAYWRIGHT_CORE, '/opt/node-tools/node_modules/playwright-core/index.mjs', path.join(GAME, 'node_modules/playwright-core/index.mjs')].filter(Boolean).find((p) => fs.existsSync(p));
if (PW) process.env.PLAYWRIGHT_CORE = PW;

// ---------------------------------------------------------------- clips: the game's recorder
if (what.includes('clips')) {
  console.log(`== clips (${GAME}/tools/site/record.mjs -> ${SITE}/assets)`);
  const r = spawnSync(process.execPath, [path.join(GAME, 'tools/site/record.mjs'), '--site', SITE, '--port', String(PORT), ...(A.frames ? ['--frames', A.frames] : []), ...clipNames], { stdio: 'inherit', env: process.env });
  if (r.status) { console.error(`record.mjs exited ${r.status}`); if (!what.includes('shots')) process.exit(r.status); }
}

if (!what.includes('shots')) process.exit(0);

// ---------------------------------------------------------------- shots
const C = await import(pathToFileURL(path.join(GAME, 'tools/site/common.mjs')).href);
const BASE = 'play=1&nohow=1&nosave=1&gfx=high&god=1&lang=en';
const OUT = path.resolve(A.out || (A.draft ? path.join(SITE, 'tools', 'draft') : path.join(SITE, 'assets')));
fs.mkdirSync(OUT, { recursive: true });
const W = 1280, H = 720, FPS = 30;

// in-page helpers (strings evaluated in the game page; `window.__g` is the game, `window.__vclock` the clock)
const PREP = `
  const G = window.__g; G.noSave = true; G.flags.mountHelp = 1; if (G.vehicles) G.vehicles.helpDue = false;
  if (G.ui) { G.ui.tip = () => {}; G.ui.tipSeen = () => true; }
  for (const o of document.querySelectorAll('.overlay')) { try { G.ui.closeOverlay(o.id); } catch (e) { o.remove(); } }
  G.paused = false;`;
const step = (page, n) => page.evaluate(async (n) => { for (let i = 0; i < n; i++) await window.__vclock.step(1 / 30); }, n);
// a road point as record.mjs gives the fight and inventory directors (o.x / o.z)
const ROADPT = `
  const T = await import('/js/terrain.js');
  if (o.road != null && o.x == null) { const P = T.roads?.[o.road]?.pts; if (P) { const i = Math.min(P.length - 2, o.at || 0), a = Math.atan2(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]) + Math.PI / 2; o.x = P[i][0] + Math.sin(a) * (o.off || 0); o.z = P[i][1] + Math.cos(a) * (o.off || 0); } }`;
// run a clip director (tools/site/directors.js) for `frames` frames and leave the page on the frame to shoot
async function director(page, name, o, frames) {
  await page.evaluate(() => window.__vclock.start());
  await page.evaluate(async ([name, o, ROADPT]) => {
    await (new Function('o', 'return (async () => {' + ROADPT + '})()'))(o);
    const D = await import('/tools/site/directors.js');
    window.__tick = await D.CLIPS[name](o);
  }, [name, o, ROADPT]);
  for (let i = 0; i < frames; i++) {
    const act = await page.evaluate(async ([i, n]) => (await window.__tick?.(i, n)) || null, [i, o.frames]);
    if (act?.mouse) { await page.mouse.move(act.mouse.x, act.mouse.y); if (act.mouse.click) await page.mouse.click(act.mouse.x, act.mouse.y); if (act.mouse.dbl) { await page.mouse.click(act.mouse.x, act.mouse.y); await page.mouse.click(act.mouse.x, act.mouse.y); } }
    await page.evaluate((dt) => window.__vclock.step(dt), 1 / (o.fps || FPS));
  }
}
const CH3 = 'c3_crossed,c3_souls,c3_fight,c3_hound,c3_gate,c3_hades,c3_descent,c3_ambush,c3_bridge,c3_chains';
const FOES = ['satyr', 'wolf', 'wolf', 'centaur', 'satyr', 'boar'];

// each: q (the game's dev URL), run(page) sets the scene and returns when the frame to shoot is on screen; vclock: false for pages
// that are not the game loop (the sanctuary)
export const SHOTS = {
  // 1. the market in Elaia: the square at eleven, V among the townsfolk, the HUD as a player sees it
  1: { q: `${BASE}&lvl=12&story=ch1&done=c1_card&place=elaia&hour=11`, run: async (page) => {
    await page.evaluate(() => window.__vclock.start());
    await page.evaluate(`(async () => { ${PREP} const S = (G.poiTowns || []).find((q) => q.id === 'elaia'); const pl = S?.spots?.plaza?.[0] || S?.spots?.market?.[0];
      if (pl) await G.teleport(pl.x + 2, pl.z + 3); G.cam.zoom = .78; })()`);
    await step(page, 90);
  } },
  // 2. a fight in the fields: the fight director (clip-fight's scene), shot on a cast
  2: { q: `${BASE}&lvl=60&story=ch1&done=c1_card&place=athenai&hour=15.5`, run: async (page) => {
    await director(page, 'fight', { road: 1, at: 45, off: 16, set: 'sparta', rarity: 'l', weapon: 'sword1', zoom: .6, foes: FOES, casts: 2, tough: 6, frames: 120, fps: FPS }, 38);
  } },
  // 3. crossing the river of the dead: chapter 3 opens on the bank of the Acheron; Charon takes her over (the cutscene)
  3: { q: `${BASE}&lvl=30&story=ch3`, run: async (page) => {
    await page.evaluate(() => window.__vclock.start());
    await page.evaluate(`(async () => { ${PREP} const ST = (await import('/js/story.js')).storySites(); if (ST?.bank) await G.teleport(ST.bank.x + 1, ST.bank.z + 1); })()`);
    await step(page, 30);
    // use the first story spot (Charon), then step until the crossing is well under way
    const t = await page.evaluate(async () => {
      const G = window.__g; let used = false, f = 0;
      for (; f < 2400; f++) {
        await window.__vclock.step(1 / 30);
        if (!used && !G.cutscene) { const it = G.interactables.find((q) => q.kind === 'story' && (!q.cond || q.cond())); if (it) { await G.teleport(it.pos.x + .3, it.pos.z + .3); it.onUse(); used = true; continue; } }
        if (used && G.cutscene && f > 60) { if (document.querySelector('#dialog:not(.hidden)') && G.ui._adv) G.ui._adv(); }
        if (used && G.world?.realm) break;
      }
      return { used, f, realm: !!G.world?.realm };
    });
    console.log('   crossing:', JSON.stringify(t));
    await step(page, 150); // on the water
  } },
  // 4. the road to Athens: the ride director (clip-ride's scene), on the horse
  4: { q: `${BASE}&lvl=30&story=ch1&done=c1_card&place=athenai&hour=16.8`, run: async (page) => {
    await director(page, 'ride', { road: 2, at: 2, zoom: .6, drift: 0, frames: 60, fps: FPS, warm: 150 }, 24);
  } },
  // 5. creating a character (BETA ONLINE): the sanctuary with a stand-in client, as tests/creator_looks.mjs opens it
  5: { q: `mode=online&lang=en&hour=10`, vclock: false, run: async (page) => {
    await page.waitForFunction(() => document.querySelector('#title'), null, { timeout: 300000 });
    await page.evaluate(async () => {
      const S = await import('/js/online/sanctuary.js'), ui = document.getElementById('ui');
      for (const t of [...document.querySelectorAll('#title')]) t.remove();
      const rpc = async (fn, a) => (fn === 'create_character' ? { id: 'c-new', slot: 0, name: a.p_name, appearance: a.p_appearance, level: 1 } : 'AVAILABLE');
      window.__san = S.openSanctuary(ui, { client: { user: { id: 'u-site', username: 'Val' }, select: async () => [], rpc, signOut: async () => {} }, hour: 10 });
    });
    await page.waitForSelector('#title.sanct .splace[data-slot="0"]', { timeout: 120000 });
    for (let i = 0; i < 3 && !(await page.$('#title .cpanel')); i++) { await page.click('#title .splace[data-slot="0"]'); await page.waitForTimeout(400); }
    await page.waitForSelector('#title .cpanel', { timeout: 30000 });
    await page.waitForTimeout(2500);
  } },
  // 6. the archer's skill tree (BETA ONLINE): the dev start at 40 swears the archer's oath and opens the skills window (K)
  6: { q: `${BASE}&mode=online&lvl=40&story=ch2&place=elaia&hour=11`, run: async (page) => {
    await page.evaluate(() => window.__vclock.start());
    await page.evaluate(`(async () => { ${PREP} })()`);
    await step(page, 20);
    const r = await page.evaluate(async () => { const G = window.__g; const r = await G.jobs?.advance?.('archer'); return r && (r.ok ?? r); });
    console.log('   archer oath:', JSON.stringify(r));
    await step(page, 20);
    await page.evaluate(async () => { const { input } = await import('/js/input.js'); input.edges.add('skills'); });
    await step(page, 20);
  } },
  // 7. trading with a player: two live pages are needed (the game's tests/online_trade.mjs, SHOTS=<dir>); see --trade
  7: { external: true },
  // 8. the Seraph set in combat: the staff hero's set (js/online/staffitems.js) on the fight director's scene
  8: { q: `${BASE}&mode=online&lvl=60&story=ch2&place=elaia&hour=15.5`, run: async (page) => {
    await page.evaluate(() => window.__vclock.start());
    await page.evaluate(`(async () => { ${PREP} })()`);
    const worn = await page.evaluate(async () => {
      const G = window.__g, H = G.hero; try {
        const SI = await import('/js/online/staffitems.js'); SI.registerStaffItems?.();
        const ids = (SI.STAFF_IDS || []).map((b) => SI.staffGiveId(b)), got = [];
        for (const id of ids) { if (H.addGear(id) !== false) { try { H.wear(id); got.push(id); } catch (e) { try { H.addWeapon(id); G.player.equip(id); got.push(id); } catch (e2) {} } } }
        G.player.wearGear?.(); return got;
      } catch (e) { return 'no staff set: ' + e.message; } });
    console.log('   seraph:', JSON.stringify(worn));
    await director(page, 'fight', { road: 1, at: 30, off: 12, zoom: .62, foes: FOES, casts: 2, tough: 6, frames: 120, fps: FPS }, 42);
  } },
};

const want = Object.keys(SHOTS).map(Number).filter((n) => !ONLY || ONLY.includes(n));
const srv = await C.gameServer(PORT);
const b = await C.browser();
const done = [];
try {
  for (const n of want) {
    const S = SHOTS[n], out = path.join(OUT, `shot-${n}.jpg`), t0 = Date.now();
    if (S.external) {
      const src = A.trade && fs.readdirSync(A.trade).find((f) => /trade/i.test(f) && /\.(png|jpg)$/.test(f));
      if (src) { toJpeg(path.join(A.trade, src), out); console.log(`shot-${n}: from ${src}`); done.push(n); }
      else console.log(`shot-${n}: kept (needs tests/online_trade.mjs with SHOTS=<dir>, then --trade <dir>)`);
      continue;
    }
    console.log(`\n== shot-${n}`);
    const { page, cdp, errors } = await C.newPage(b, W, H, { vclock: S.vclock !== false });
    try {
      if (S.vclock === false) await page.goto(`http://localhost:${PORT}/index.html?${S.q}`, { waitUntil: 'domcontentloaded', timeout: 0 });
      else await C.openGame(page, PORT, S.q);
      console.log(`   loaded in ${((Date.now() - t0) / 1000) | 0}s`);
      await S.run(page);
      const tmp = out + '.raw.jpg';
      await C.grab(cdp, tmp, 96);
      toJpeg(tmp, out); fs.unlinkSync(tmp);
      if (errors.length) console.log(`   page errors: ${errors.length}`);
      console.log(`   ${path.basename(out)}  ${C.kb(fs.statSync(out).size)}  (${((Date.now() - t0) / 1000) | 0}s)`);
      done.push(n);
    } catch (e) { console.log(`   FAILED: ${e.message.slice(0, 300)}`); }
    finally { await page.close().catch(() => {}); }
  }
} finally { await b.close(); srv?.close(); }
console.log(`\nshots written: ${done.join(', ') || 'none'} -> ${OUT}`);

// a jpeg at the gallery's size and weight (ffmpeg; the raw CDP capture is kept when ffmpeg is missing)
function toJpeg(src, out) {
  const r = spawnSync(C.FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-vf', `scale=${W}:${H}:flags=lanczos`, '-q:v', '3', out], { stdio: 'inherit' });
  if (r.status) fs.copyFileSync(src, out);
}
