// The browser tests' harness: a static server for the site's folder, Chromium (Playwright), the Supabase stand-in
// (fake-supabase.mjs), and local copies of what the pages load from elsewhere: supabase-js (the same version the pages
// pin on jsDelivr; SUPABASE_JS points at its dist/umd/supabase.js) and the fonts (FONTS_DIR: the game's bundled
// woff2 files, launcher/app/ui/fonts). Nothing goes to the network.
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { makeWorld, install } from './fake-supabase.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SBJS = process.env.SUPABASE_JS || '/tmp/claude-0/-home-claude/74703188-d8f3-55f1-abdd-58bc3f840e0b/scratchpad/forum/sbx/package/dist/umd/supabase.js';
const FONTS = process.env.FONTS_DIR || '/home/claude/game/launcher/app/ui/fonts';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2' };

export async function startServer() {
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = path.join(ROOT, u === '/' ? 'index.html' : u);
    if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end('no'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${srv.address().port}/`, close: () => srv.close() };
}

export async function launch() {
  const { chromium } = require('playwright');
  return chromium.launch();
}

// a context with the stand-in wired in; W: the world (makeWorld()), a fresh one when not given
export async function newContext(browser, W, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, ...opts });
  await ctx.route('https://cdn.jsdelivr.net/**', (r) => (r.request().url().includes('supabase-js@2.117.3/dist/umd/supabase.js')
    ? r.fulfill({ status: 200, headers: { 'content-type': 'text/javascript', 'access-control-allow-origin': '*' }, body: readFileSync(SBJS) }) : r.abort()));
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, headers: { 'content-type': 'text/css' }, body: readFileSync(path.join(FONTS, 'fonts.css'), 'utf8').replace(/url\(([^)]+)\)/g, 'url(https://fonts.gstatic.com/x/$1)') }));
  await ctx.route('https://fonts.gstatic.com/**', (r) => { const f = path.join(FONTS, path.basename(new URL(r.request().url()).pathname)); return existsSync(f) ? r.fulfill({ status: 200, headers: { 'content-type': 'font/woff2', 'access-control-allow-origin': '*' }, body: readFileSync(f) }) : r.abort(); });
  await install(ctx, W || makeWorld());
  return ctx;
}
export { makeWorld };
