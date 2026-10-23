#!/usr/bin/env node
// The Serpent's Oath - release tool for the launcher's game-content updates. Node built-ins only (runs on a GitHub
// Actions runner with no npm install). The same file is used locally (build + test) and by the site repo's
// "Publish game release" workflow (.github/release/release.mjs there is a byte-for-byte copy; a test checks it).
//
//   node release.mjs keygen --out DIR                  Ed25519 key pair for LOCAL TESTS ONLY (private key never committed)
//   node release.mjs pubkey (--key FILE | --key-env VAR) print the public key (PEM) that belongs to a private key
//   node release.mjs pack --content DIR --out DIR --tag v30 --round 30 --launcher-latest 1.0.0 --launcher-min 1.0.0
//                         [--platforms win32-x64,...] [--asset-base URL] [--date YYYY-MM-DD] [--delete a,b]
//        gzips every file of the content folder to OUT/content-<name>.gz and writes OUT/game-manifest.json (unsigned)
//   node release.mjs finalize --dir DIR (--key FILE | --key-env VAR) [--serial N] [--asset-base URL] [--platforms ...]
//        CI step: recompute every size/SHA-256 from the actual asset bytes in DIR (never trusting the uploaded
//        manifest's numbers), check each unpacks to the exact file, set a fresh serial, write + sign the manifest
//   node release.mjs verify --dir DIR --pub FILE        check the signature and every referenced asset in DIR
//   node release.mjs verify-remote --url MANIFEST_URL --pub FILE [--tries N]
//        download the published manifest + .sig + every asset over HTTPS and check them all
//   node release.mjs launcher-key --zip FILE [--pub FILE] print (or check) the public key baked into a launcher ZIP
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const REPO = 'serpents-oath/serpents-oath.github.io';
const DEFAULT_BASE = `https://github.com/${REPO}/releases/download/`;
const SEG = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

const args = process.argv.slice(2);
const cmd = args.shift();
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const die = (msg) => { console.error('ERROR: ' + msg); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

function privateKey() {
  const file = opt('key'), env = opt('key-env');
  let pem = file ? fs.readFileSync(file, 'utf8') : env ? process.env[env] : null;
  if (!pem || !pem.trim()) die('no private key: pass --key FILE or --key-env VAR (the GitHub secret)');
  pem = pem.trim().replace(/\\n/g, '\n');
  if (!pem.includes('BEGIN')) pem = `-----BEGIN PRIVATE KEY-----\n${pem.replace(/\s+/g, '').match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;
  const k = crypto.createPrivateKey(pem);
  if (k.asymmetricKeyType !== 'ed25519') die('the private key is not an Ed25519 key');
  return k;
}
const pubPem = (k) => crypto.createPublicKey(k).export({ type: 'spki', format: 'pem' }).toString();

function checkRel(p) {
  const segs = String(p).split('/');
  if (!p || p.includes('\\') || p.startsWith('/') || segs.some((s) => !SEG.test(s) || /[. ]$/.test(s))) die(`unsafe content path: ${p}`);
  return p;
}

async function listFiles(dir, base = dir) {
  const out = [];
  for (const e of await fsp.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) die(`symlink in content: ${p}`);
    if (e.isDirectory()) out.push(...(await listFiles(p, base)));
    else if (e.isFile()) out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out.sort();
}
const assetName = (rel) => 'content-' + rel.replace(/\//g, '__') + '.gz';

async function cmdPack() {
  const content = opt('content'), out = opt('out'), tag = opt('tag'), round = Number(opt('round'));
  if (!content || !out || !tag || !round) die('pack needs --content --out --tag --round');
  const base = opt('asset-base', DEFAULT_BASE);
  await fsp.mkdir(out, { recursive: true });
  const files = [];
  for (const rel of await listFiles(content)) {
    checkRel(rel);
    const raw = await fsp.readFile(path.join(content, rel));
    const gz = zlib.gzipSync(raw, { level: 9 });
    const name = assetName(rel);
    await fsp.writeFile(path.join(out, name), gz);
    files.push({ path: rel, size: raw.length, sha256: sha(raw), encoding: 'gzip', dlSize: gz.length, dlSha256: sha(gz), url: base + tag + '/' + name });
  }
  if (!files.some((f) => f.path === 'index.html')) die('content has no index.html');
  const m = {
    schema: 1, product: 'serpents-oath', channel: 'stable', serial: Number(opt('serial', Math.floor(Date.now() / 1000))),
    game: { round, version: String(opt('version', round)), tag, date: opt('date', new Date().toISOString().slice(0, 10)) },
    launcher: { latest: opt('launcher-latest', '1.0.0'), minimum: opt('launcher-min', '1.0.0') },
    platforms: opt('platforms', 'win32-x64').split(',').map((s) => s.trim()).filter(Boolean),
    entry: 'index.html', files, delete: (opt('delete', '') || '').split(',').filter(Boolean).map(checkRel),
    created: new Date().toISOString(),
  };
  await fsp.writeFile(path.join(out, 'game-manifest.json'), JSON.stringify(m, null, 1) + '\n');
  console.log(`packed ${files.length} files (${files.reduce((s, f) => s + f.size, 0)} bytes, ${files.reduce((s, f) => s + f.dlSize, 0)} to download) -> ${out}`);
}

async function cmdFinalize() {
  const dir = opt('dir');
  if (!dir) die('finalize needs --dir');
  const key = privateKey();
  const mPath = path.join(dir, 'game-manifest.json');
  const m = JSON.parse(await fsp.readFile(mPath, 'utf8'));
  const base = opt('asset-base', DEFAULT_BASE);
  if (m.schema !== 1 || m.product !== 'serpents-oath') die('not a Serpent\'s Oath manifest');
  const tag = opt('tag', m.game.tag);
  if (!/^v?[0-9][A-Za-z0-9._-]{0,30}$/.test(tag)) die('bad tag');
  m.game.tag = tag;
  if (opt('platforms')) m.platforms = opt('platforms').split(',').map((s) => s.trim()).filter(Boolean);
  for (const f of m.files) {
    checkRel(f.path);
    const name = decodeURIComponent(new URL(f.url).pathname.split('/').pop());
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/.test(name)) die(`bad asset name ${name}`);
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) die(`asset missing from the release: ${name}`);
    const dl = await fsp.readFile(file);
    const raw = f.encoding === 'gzip' ? zlib.gunzipSync(dl) : dl;
    Object.assign(f, { size: raw.length, sha256: sha(raw), dlSize: dl.length, dlSha256: sha(dl), url: base + tag + '/' + name });
  }
  m.serial = Number(opt('serial', Math.floor(Date.now() / 1000)));
  m.created = new Date().toISOString();
  const bytes = Buffer.from(JSON.stringify(m, null, 1) + '\n');
  await fsp.writeFile(mPath, bytes);
  await fsp.writeFile(mPath + '.sig', crypto.sign(null, bytes, key).toString('base64') + '\n');
  console.log(`finalized ${m.files.length} files, serial ${m.serial}, tag ${tag}; signed with key\n${pubPem(key)}`);
}

function verifyBytes(bytes, sig, pub) {
  const key = crypto.createPublicKey(pub);
  if (!crypto.verify(null, bytes, key, Buffer.from(String(sig).trim(), 'base64'))) die('SIGNATURE DOES NOT MATCH');
}
function checkAsset(f, dl) {
  if (dl.length !== f.dlSize || sha(dl) !== f.dlSha256) die(`asset bytes do not match the manifest: ${f.path}`);
  const raw = f.encoding === 'gzip' ? zlib.gunzipSync(dl) : dl;
  if (raw.length !== f.size || sha(raw) !== f.sha256) die(`unpacked file does not match the manifest: ${f.path}`);
}

async function cmdVerify() {
  const dir = opt('dir'), pub = fs.readFileSync(opt('pub'), 'utf8');
  const bytes = await fsp.readFile(path.join(dir, 'game-manifest.json'));
  verifyBytes(bytes, await fsp.readFile(path.join(dir, 'game-manifest.json.sig'), 'utf8'), pub);
  const m = JSON.parse(bytes);
  for (const f of m.files) checkAsset(f, await fsp.readFile(path.join(dir, decodeURIComponent(new URL(f.url).pathname.split('/').pop()))));
  console.log(`OK: signature valid, ${m.files.length} assets match (tag ${m.game.tag}, serial ${m.serial})`);
}

async function get(url) {
  const r = await fetch(url, { redirect: 'follow', cache: 'no-store' });
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  return Buffer.from(await r.arrayBuffer());
}
async function cmdVerifyRemote() {
  const url = opt('url'), pub = fs.readFileSync(opt('pub'), 'utf8'), tries = Number(opt('tries', 6));
  for (let k = 1; ; k++) {
    try {
      const bytes = await get(url), sig = await get(url + '.sig');
      verifyBytes(bytes, sig.toString('utf8'), pub);
      const m = JSON.parse(bytes);
      if (opt('tag') && m.game.tag !== opt('tag')) throw new Error(`published manifest is for ${m.game.tag}, not ${opt('tag')}`);
      for (const f of m.files) checkAsset(f, await get(f.url));
      console.log(`OK (remote): ${url} signature valid, ${m.files.length} assets downloaded and verified (tag ${m.game.tag})`);
      return;
    } catch (e) {
      if (k >= tries) die(e.message);
      console.log(`not ready yet (${e.message}); retrying in ${5 * k}s`);
      await new Promise((r) => setTimeout(r, 5000 * k));
    }
  }
}

function cmdLauncherKey() {
  const zip = opt('zip');
  const names = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8', maxBuffer: 64 << 20 }).split('\n');
  const trust = names.find((n) => /(^|\/)(resources|Resources)\/app\/trust\.json$/.test(n));
  if (!trust) die('no trust.json in the launcher zip');
  const t = JSON.parse(execFileSync('unzip', ['-p', zip, trust], { encoding: 'utf8' }));
  if (!opt('pub')) { console.log(t.manifestPublicKey); return; }
  const want = crypto.createPublicKey(fs.readFileSync(opt('pub'), 'utf8')).export({ type: 'spki', format: 'der' }).toString('base64');
  let have = null;
  try { have = crypto.createPublicKey(t.manifestPublicKey).export({ type: 'spki', format: 'der' }).toString('base64'); } catch {}
  if (have !== want) die(`the launcher in ${path.basename(zip)} trusts a different key than the signing secret (rebuild the launcher with the release public key)`);
  console.log(`OK: ${path.basename(zip)} trusts the signing key`);
}

async function cmdKeygen() {
  const out = opt('out');
  if (!out) die('keygen needs --out DIR');
  const { publicKey, privateKey: pk } = crypto.generateKeyPairSync('ed25519');
  await fsp.mkdir(out, { recursive: true });
  await fsp.writeFile(path.join(out, 'private.pem'), pk.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  await fsp.writeFile(path.join(out, 'public.pem'), publicKey.export({ type: 'spki', format: 'pem' }));
  console.log(`wrote ${out}/private.pem (KEEP SECRET, never commit) and ${out}/public.pem`);
}

const cmds = { pack: cmdPack, finalize: cmdFinalize, verify: cmdVerify, 'verify-remote': cmdVerifyRemote, 'launcher-key': cmdLauncherKey, keygen: cmdKeygen, pubkey: () => console.log(pubPem(privateKey()).trim()) };
if (!cmds[cmd]) die(`unknown command ${cmd || ''}; see the header of this file`);
await cmds[cmd]();
