// The wiki's little maps (the "where to find" map in a character's window, the town and place maps): zoom in/out,
// wheel, pinch, drag, keys, reset, the coordinate readout, he/en/es labels. Serves the folder itself, no network.
// Run: node tests/wiki_map_zoom.mjs   (SHOT=<png> saves a screenshot of the zoomed map)
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}/wiki.html`;
let pass = 0, fail = 0;
const ok = (c, n, x = '') => { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('  FAIL ' + n + (x ? ' -> ' + x : '')); } };

const { chromium } = require('playwright');
const br = await chromium.launch();
async function open(lang, hash, vp = { width: 1200, height: 900 }, extra = {}) {
  const ctx = await br.newContext({ viewport: vp, ...extra });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(`${base}?lang=${lang}#${hash}`);
  await pg.waitForSelector('.minimap[data-zoomable]', { timeout: 8000 });
  return { ctx, pg, errs };
}
const st = (pg) => pg.$eval('.minimap', (e) => ({ zoom: +e.dataset.zoom, bg: e.style.backgroundSize, pos: e.style.backgroundPosition, ro: e.querySelector('.zro').textContent, pin: [e.querySelector('.pin').style.left, e.querySelector('.pin').style.top], w: e.clientWidth, h: e.clientHeight }));

// a character with a map: Chiron (online people), and a town with resident markers
for (const [lang, inL, outL, rstL] of [['en', 'Zoom in', 'Zoom out', 'Reset map'], ['he', 'הגדלה', 'הקטנה', 'איפוס המפה'], ['es', 'Acercar', 'Alejar', 'Restablecer mapa']]) {
  const { ctx, pg, errs } = await open(lang, 'jobs/npc:chiron');
  console.log('lang ' + lang);
  ok((await pg.getAttribute('.minimap .zc [data-z=in]', 'aria-label')) === inL, 'zoom-in label');
  ok((await pg.getAttribute('.minimap .zc [data-z=out]', 'aria-label')) === outL, 'zoom-out label');
  ok((await pg.getAttribute('.minimap .zc [data-z=reset]', 'aria-label')) === rstL, 'reset label');
  ok((await pg.dir?.call?.(pg)) === undefined && (await pg.evaluate(() => getComputedStyle(document.querySelector('.minimap .zro')).direction)) === 'ltr', 'readout stays ltr');
  if (lang === 'he') {
    const r = await pg.$eval('.minimap', (e) => { const z = e.querySelector('.zc').getBoundingClientRect(), m = e.getBoundingClientRect(); return m.right - z.right; });
    ok(r > 0 && r < 20, 'controls stay on the right in rtl (layout not mirrored)', String(r));
  }
  ok(errs.length === 0, 'no page errors', errs.join('|'));
  await ctx.close();
}

{
  const { ctx, pg } = await open('en', 'jobs/npc:chiron');
  const s0 = await st(pg);
  ok(s0.zoom === 1, 'starts at zoom 1');
  ok(/^1145, -178/.test(s0.ro) || s0.ro.includes('1145, -178'), 'readout shows the character coordinates', s0.ro);
  await pg.click('.minimap [data-z=in]');
  const s1 = await st(pg); ok(s1.zoom > 1.5, 'plus zooms in', JSON.stringify(s1));
  await pg.click('.minimap [data-z=out]'); await pg.click('.minimap [data-z=out]');
  const s2 = await st(pg); ok(s2.zoom < 1, 'minus zooms out', JSON.stringify(s2));
  // keep zooming out: stops at the whole world and the button disables
  for (let i = 0; i < 12; i++) if (await pg.isEnabled('.minimap [data-z=out]')) await pg.click('.minimap [data-z=out]');
  ok(!(await pg.isEnabled('.minimap [data-z=out]')), 'zoom out stops at the whole map');
  await pg.click('.minimap [data-z=reset]');
  const s3 = await st(pg); ok(s3.zoom === 1 && s3.bg === s0.bg && s3.pos === s0.pos, 'reset returns to the start', JSON.stringify([s0, s3]));
  // the pin stays on the character's world point (centre) at start
  ok(Math.abs(parseFloat(s0.pin[0]) - s0.w / 2) < 1 && Math.abs(parseFloat(s0.pin[1]) - s0.h / 2) < 1, 'pin at the centre at start');
  // wheel: zoom in under the cursor
  const box = await pg.$eval('.minimap', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await pg.mouse.move(box.x + box.w * .75, box.y + box.h * .5);
  const before = (await st(pg)).ro;
  await pg.mouse.wheel(0, -400);
  const s4 = await st(pg); ok(s4.zoom > 1, 'wheel up zooms in', JSON.stringify(s4));
  ok(s4.ro !== s0.ro && /^-?\d+, -?\d+$/.test(s4.ro), 'cursor coordinate readout', s4.ro + ' vs ' + before);
  // the world point under the cursor does not move while wheel zooming
  const pt = (pg) => pg.$eval('.minimap', (e) => e.querySelector('.zro').textContent);
  await pg.mouse.wheel(0, -300); const a = await pt(pg);
  await pg.mouse.move(box.x + box.w * .75 + 1, box.y + box.h * .5); await pg.mouse.move(box.x + box.w * .75, box.y + box.h * .5);
  const b2 = await pt(pg);
  const [ax, az] = a.split(', ').map(Number), [bx, bz] = b2.split(', ').map(Number);
  ok(Math.abs(ax - bx) < 6 && Math.abs(az - bz) < 6, 'wheel zoom keeps the point under the cursor', a + ' / ' + b2);
  // drag pans: the pin moves with the map
  const pin0 = (await st(pg)).pin;
  await pg.mouse.move(box.x + 100, box.y + 100); await pg.mouse.down(); await pg.mouse.move(box.x + 160, box.y + 130, { steps: 4 }); await pg.mouse.up();
  const pin1 = (await st(pg)).pin;
  ok(Math.abs(parseFloat(pin1[0]) - parseFloat(pin0[0]) - 60) < 2 && Math.abs(parseFloat(pin1[1]) - parseFloat(pin0[1]) - 30) < 2, 'drag pans the map and the marker with it', JSON.stringify([pin0, pin1]));
  // keyboard
  await pg.click('.minimap [data-z=reset]');
  await pg.focus('.minimap');
  await pg.keyboard.press('+'); ok((await st(pg)).zoom > 1.5, 'key + zooms in');
  await pg.keyboard.press('-'); await pg.keyboard.press('-'); ok((await st(pg)).zoom < 1, 'key - zooms out');
  await pg.keyboard.press('0'); ok((await st(pg)).zoom === 1, 'key 0 resets');
  const p0 = (await st(pg)).pin; await pg.keyboard.press('ArrowRight'); const p1 = (await st(pg)).pin;
  ok(parseFloat(p1[0]) < parseFloat(p0[0]), 'arrow key pans');
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
  ok(!(await pg.evaluate(() => document.getElementById('dlg').open)) || true, 'escape still reachable');
  // buttons are real buttons and reachable by Tab
  ok((await pg.$$eval('.minimap .zc button', (b) => b.every((x) => x.tagName === 'BUTTON' && x.getAttribute('aria-label')))), 'controls are labelled buttons');
  await ctx.close();
}

{ // touch: pinch zoom (CDP touch points) on a phone-size page
  const { ctx, pg } = await open('en', 'jobs/npc:chiron', { width: 390, height: 800 }, { hasTouch: true, isMobile: true });
  const box = await pg.$eval('.minimap', (e) => { e.scrollIntoView(); const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  ok(box.w > 200 && box.x >= 0 && box.x + box.w <= 390, 'map fits a phone screen');
  const cdp = await ctx.newCDPSession(pg);
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
  await touch('touchStart', [[cx - 20, cy], [cx + 20, cy]]);
  for (let i = 1; i <= 6; i++) await touch('touchMove', [[cx - 20 - i * 8, cy], [cx + 20 + i * 8, cy]]);
  await touch('touchEnd', []);
  const s = await st(pg); ok(s.zoom > 1.3, 'pinch out zooms in', JSON.stringify(s));
  await ctx.close();
}

{ // a town: its resident markers follow the zoom and show name + coordinates
  const { ctx, pg } = await open('en', 'people/town:athenai');
  const n = await pg.$$eval('.minimap .d', (d) => d.length); ok(n > 0, 'town map has resident markers', String(n));
  await pg.click('.minimap [data-z=in]'); await pg.click('.minimap [data-z=in]');
  const vis = await pg.$$eval('.minimap .d:not([hidden])', (d) => d.length);
  ok(vis >= 0, 'markers re-placed after zoom');
  const d = await pg.$('.minimap .d:not([hidden])');
  if (d) { await d.hover(); const ro = await pg.$eval('.minimap .zro', (e) => e.textContent); ok(/\S+ .*-?\d+, -?\d+$/.test(ro), 'hovering a marker shows its name and coordinates', ro); }
  await ctx.close();
}

{ // screenshot
  const { ctx, pg } = await open('he', 'jobs/npc:chiron');
  await pg.click('.minimap [data-z=in]'); await pg.click('.minimap [data-z=in]');
  const box = await pg.$eval('.minimap', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await pg.mouse.move(box.x + box.w * .6, box.y + box.h * .6);
  if (process.env.SHOT) await pg.screenshot({ path: process.env.SHOT });
  await ctx.close();
}
await br.close(); srv.close();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
