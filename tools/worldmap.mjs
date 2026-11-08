// Regenerates the wiki's little-map picture from the real game: assets/worldmap.webp (the game's own world-map painter,
// js/maps.js paintRaster, at 2048 px instead of the game's 1024) and the map's pixel icons (the sprites the game's map uses,
// --pi-city, --pi-hut ... read from the running game's page), written into wiki.html's MAPICONS constant (no extra request).
//
//   node tools/worldmap.mjs --game /path/to/game [--n 2048] [--q 0.82] [--port 8977]
//
// The picture covers the world square -HALF..HALF on both axes (HALF 5018 m, js/terrain.js): world x -> pixel (x+HALF)/SIZE*N,
// world z -> pixel (z+HALF)/SIZE*N, north up, like the game's own map (ui.js toUV). The starting island is painted as sea,
// as on the game's mainland map. Nothing in the game folder is written (maps.js is served with three extra exports, in memory).
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), SITE = path.resolve(HERE, '..');
const A = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) A[process.argv[i].slice(2)] = process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] == null ? true : process.argv[++i];
if (!A.game) { console.error('usage: node tools/worldmap.mjs --game /path/to/game [--n 2048] [--q 0.82]'); process.exit(1); }
const GAME = path.resolve(A.game), N = +(A.n || 2048), Q = +(A.q || 0.82), PORT = +(A.port || 8977);
const C = await import(pathToFileURL(path.join(GAME, 'tools/site/common.mjs')).href);
const srv = await C.gameServer(PORT);
const b = await C.browser();
try {
  const { page } = await C.newPage(b, 1280, 720, { vclock: true });
  // maps.js with its painter exported (served from memory; the file on disk is untouched)
  await page.route('**/js/maps.js', async (r) => {
    const src = fs.readFileSync(path.join(GAME, 'js/maps.js'), 'utf8');
    await r.fulfill({ contentType: 'text/javascript', body: src + '\nexport { makeRaster, sampleRasterRow, paintRaster };\n' });
  });
  await C.openGame(page, PORT, 'play=1&nohow=1&nosave=1&gfx=high&god=1&lang=en&story=ch1&done=c1_card&place=athenai&hour=12');
  page.setDefaultTimeout(0);
  const out = await page.evaluate(async ({ n, q }) => {
    const T = await import('/js/terrain.js'), M = await import('/js/maps.js');
    const R = M.makeRaster(n, -T.HALF, -T.HALF, T.SIZE / n, true);
    for (let j = 0; j < n; j++) M.sampleRasterRow(R, j);
    const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d');
    M.paintRaster(R, x, (r) => !r.isle);
    const icons = {}, cs = getComputedStyle(document.documentElement);
    for (const k of ['city', 'village', 'hut', 'landmark', 'home', 'cave']) {
      const v = cs.getPropertyValue('--pi-' + k).trim(); const m = /url\(["']?(data:[^"')]+)["']?\)/.exec(v); if (m) icons[k] = m[1];
    }
    return { webp: c.toDataURL('image/webp', q), half: T.HALF, size: T.SIZE, icons };
  }, { n: N, q: Q });
  fs.mkdirSync(path.join(SITE, 'assets'), { recursive: true });
  const buf = Buffer.from(out.webp.split(',')[1], 'base64');
  fs.writeFileSync(path.join(SITE, 'assets/worldmap.webp'), buf);
  if (out.half !== 5018) console.log(`WARNING: the world is now ${out.half} m a half: update WORLDMAP.half in wiki.html`);
  const dim = (u) => { const b = Buffer.from(u.split(',')[1], 'base64'); return [b.readUInt32BE(16), b.readUInt32BE(20)]; }; // (a png's width and height)
  const icons = Object.fromEntries(Object.entries(out.icons).map(([k, u]) => [k, [...dim(u), u]]));
  const wk = path.join(SITE, 'wiki.html'), html = fs.readFileSync(wk, 'utf8');
  fs.writeFileSync(wk, html.replace(/\/\*MAPICONS\*\/[\s\S]*?\/\*END\*\//, () => `/*MAPICONS*/${JSON.stringify(icons)}/*END*/`));
  console.log(`assets/worldmap.webp ${N}x${N} ${(buf.length / 1024) | 0} KB; icons into wiki.html: ${Object.keys(out.icons).join(', ')}`);
} finally { await b.close(); srv?.close(); }
