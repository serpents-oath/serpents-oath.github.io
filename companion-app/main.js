// The Companion v2: sign in with the game's account, pick a character, walk the pixel village, take a task from a villager
// (fishing, woodcutting, ship repair: each on its own side-view screen), trade the goods at Melitta's, deposit game items and
// drachmas at Chrysa's bank. Everything that counts (time, rolls, drachmas, the bank, the character lock) is the server's.
import { rpc, signIn, signOut, signedIn } from './api.js';
import { T, itemName, RARITY, pickLang, fmt } from './i18n.js';
import { createVillage } from './village.js';
import { createScene } from './scenes.js';
import { icon } from './icons.js';
import { heroLook, NPC_LOOKS, portrait } from './chars.js';
import { dataUrl } from './px.js';

let L = pickLang(); const t = (k, v) => fmt((T[L] || T.en)[k] ?? T.en[k] ?? k, v);
const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c))); return e; };
const img = (canvasEl, k = 3, attrs = {}) => el('img', { src: dataUrl(canvasEl, k), alt: '', ...attrs });
const SESSION = (() => { let s = ''; try { s = sessionStorage.getItem('so-companion-sid') || ''; } catch { /* */ } if (!s) { const b = crypto.getRandomValues(new Uint8Array(12)); s = [...b].map((x) => x.toString(36).padStart(2, '0')).join('').slice(0, 24); try { sessionStorage.setItem('so-companion-sid', s); } catch { /* */ } } return s; })();
const uuid = () => crypto.randomUUID();
const TASK_OF = { fisher: 'fishing', woodcutter: 'woodcutting', shipwright: 'shipwright', guard: 'guard' };
const NPC_OF = { fishing: 'fisher', woodcutting: 'woodcutter', shipwright: 'shipwright', guard: 'guard' };
const TOOL = { fishing: 'rod', woodcutting: 'axe', shipwright: 'hammer', guard: 'lantern' };

let village = null, scene = null, me = null, look = null, st = null, bank = null, hb = 0, tick = 0, chars = [], fetchedAt = 0, view = 'none', sheetView = null, pollT = 0;
const items = () => st?.items || [];
const meta = (id) => items().find((x) => x.id === id) || { id, cat: 'game', rarity: 'common', price: 0 };
const sortIds = (ids) => ids.slice().sort((a, b) => items().findIndex((x) => x.id === a) - items().findIndex((x) => x.id === b));
const errText = (e) => { const c = (e?.code || '').toLowerCase(); return (T[L] || T.en)[c + '_err'] || (T[L] || T.en)[c] || t('unexpected'); };
const hms = (s) => { s = Math.max(0, Math.floor(s)); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((v) => String(v).padStart(2, '0')).join(':'); };
const ms = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const human = (s) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return L === 'he' ? (h ? `${h} ש' ${m} דק'` : `${m} דק'`) : (h ? `${h}h ${m}m` : `${m}m`); };

function applyLang() {
  document.documentElement.lang = L; try { localStorage.setItem('so-lang', L); } catch { /* */ }
  for (const n of document.querySelectorAll('[data-t]')) n.textContent = t(n.dataset.t);
  for (const b of document.querySelectorAll('.seg.lang button')) b.setAttribute('aria-pressed', String(b.dataset.lang === L));
  if (st) { renderHud(); if (view === 'task') renderTask(true); }
}
for (const b of document.querySelectorAll('.seg.lang button')) b.addEventListener('click', () => { L = b.dataset.lang; applyLang(); });
const SCREENS = ['s-login', 's-chars', 's-blocked', 's-load', 's-village', 's-task'];
const show = (id) => { for (const s of SCREENS) $(s).hidden = s !== id; $('cv-village').hidden = id !== 's-village' && id !== 's-load'; $('cv-task').hidden = id !== 's-task'; };
function toast(msg, ms2 = 2800) { const x = $('toast'); x.textContent = msg; x.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { x.hidden = true; }, ms2); }

// ---- the sheet
const sheet = {
  open(node, name = '') { $('sheet-body').replaceChildren(node); $('sheet').hidden = false; sheetView = name; $('sheet').dataset.view = name; },
  close() { $('sheet').hidden = true; $('sheet-body').replaceChildren(); sheetView = null; $('sheet').dataset.view = ''; },
  get isOpen() { return !$('sheet').hidden; },
};
$('sheet-x').addEventListener('click', () => sheet.close());
$('sheet').addEventListener('pointerdown', (e) => { if (e.target === $('sheet')) sheet.close(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet.isOpen) sheet.close(); });

// ---- server calls (each change keyed, so a retry never doubles it)
async function act(name, body, { keyed = false, quiet = false } = {}) {
  const b = keyed ? { ...body, p_key: uuid() } : body;
  try { return await rpc(name, b); }
  catch (e) {
    if (e.code === 'NO_LEASE') { try { await enter(); return await rpc(name, b); } catch { /* fall through */ } }
    if (e.code === 'SESSION_EXPIRED' || e.code === 'SIGNED_OUT') { await toLogin(t('session_expired')); throw e; }
    if (e.code === 'CHARACTER_IN_GAME' || e.code === 'CHARACTER_IN_USE') { blocked(e.code); throw e; }
    if (!quiet) toast(errText(e)); throw e;
  }
}
function setState(s) {
  const before = st?.task?.bag || {}, beforeKind = st?.task?.kind;
  st = s; fetchedAt = Date.now();
  // what the server has rolled since the last look: each new thing plays its catch
  if (scene && st.task && st.task.kind === beforeKind) for (const [id, n] of Object.entries(st.task.bag || {})) for (let i = 0; i < Math.min(3, n - (before[id] || 0)); i++) { scene.event(id); newLoot.add(id); }
  renderHud(); if (view === 'task') renderTask(); if (sheetView && sheetRefresh[sheetView]) sheetRefresh[sheetView]();
}
const newLoot = new Set();
const sheetRefresh = {};
async function enter() { setState(await rpc('companion_enter', { p_char: me.id, p_session: SESSION })); }

// ---- sign in, characters, the lock
async function toLogin(msg = '') { stopBeat(); village?.stop(); scene?.stop(); sheet.close(); view = 'none'; show('s-login'); $('login-err').textContent = msg; }
$('f-login').addEventListener('submit', async (e) => {
  e.preventDefault(); const b = e.submitter || $('f-login').querySelector('button'); b.disabled = true; $('login-err').textContent = '';
  try { await signIn($('in-user').value, $('in-pass').value); $('in-pass').value = ''; await toChars(); }
  catch (err) { $('login-err').textContent = errText(err); } finally { b.disabled = false; }
});
$('b-out').addEventListener('click', async () => { await signOut(); toLogin(); });
async function toChars() {
  stopBeat(); village?.stop(); scene?.stop(); sheet.close(); view = 'none'; show('s-chars'); $('chars-err').textContent = '';
  try { chars = await rpc('companion_characters'); }
  catch (e) { if (e.code === 'SESSION_EXPIRED' || e.code === 'SIGNED_OUT') return toLogin(t('session_expired')); $('chars-err').textContent = errText(e); chars = []; }
  const ul = $('chars'); ul.replaceChildren(); $('chars-empty').hidden = chars.length > 0;
  for (const c of chars) ul.append(el('li', {}, el('button', { type: 'button', onclick: () => pick(c) },
    img(portrait(heroLook(c.appearance || {})), 3),
    el('b', {}, c.name, el('small', {}, `${t('level', { n: c.level })} · ${c.job || t('job_none')}`)),
    c.in_game ? el('span', { class: 'badge warn' }, t('in_game')) : c.task ? el('span', { class: 'badge' }, t('task_' + c.task)) : null)));
}
function blocked(code) { stopBeat(); village?.stop(); scene?.stop(); sheet.close(); view = 'none'; $('blk-name').textContent = me?.name || ''; $('blk-msg').textContent = code === 'CHARACTER_IN_GAME' ? t('blocked_game') : t('blocked_use'); show('s-blocked'); }
async function pick(c) {
  me = c; show('s-load');
  try { await enter(); }
  catch (e) {
    if (e.code === 'CHARACTER_IN_GAME' || e.code === 'CHARACTER_IN_USE') return blocked(e.code);
    if (e.code === 'SESSION_EXPIRED') return toLogin(t('session_expired'));
    show('s-chars'); $('chars-err').textContent = errText(e); return;
  }
  look = heroLook(c.appearance || {});
  if (!village) village = createVillage($('cv-village'), { onArrive: (id) => talk(id), onTapEmpty: () => { if (sheet.isOpen) sheet.close(); } });
  village.setHero(look, 'hero-' + c.id);
  $('h-face').src = dataUrl(portrait(look), 2); $('h-coin-ic').src = dataUrl(icon('drachma'), 2); $('b-bag-ic').src = dataUrl(icon('bag'), 2);
  startBeat();
  if (st.task) openTask(); else toVillage();
}
$('blk-retry').addEventListener('click', () => pick(me)); $('blk-back').addEventListener('click', toChars);

// the lock is kept with a heartbeat (it also brings the task's new rolls); leaving tells the server, a crash lets it run out
function startBeat() { stopBeat(); hb = setInterval(beat, 30000); tick = setInterval(() => { if (view === 'task') renderClock(); else renderHud(); }, 1000); }
function stopBeat() { clearInterval(hb); clearInterval(tick); clearTimeout(pollT); }
async function beat() { if (!me) return; try { setState(await rpc('companion_enter', { p_char: me.id, p_session: SESSION })); } catch (e) { if (e.code === 'CHARACTER_IN_GAME' || e.code === 'CHARACTER_IN_USE') blocked(e.code); } }
function leave() { if (me && signedIn()) rpc('companion_leave', { p_char: me.id, p_session: SESSION }, { keepalive: true }).catch(() => {}); }
addEventListener('pagehide', leave);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { village?.stop(); scene?.stop(); return; }
  if (view === 'village') village?.start(); else if (view === 'task') scene?.start();
  if (me && view !== 'none') beat();
});

// ---- the village
function toVillage(nearNpc = null) {
  scene?.stop(); view = 'village'; show('s-village');
  if (nearNpc) village.placeNear(nearNpc);
  village.start(); renderHud();
  $('hint').style.opacity = 1; clearTimeout(toVillage.h); toVillage.h = setTimeout(() => { $('hint').style.opacity = 0; }, 5000);
}
function renderHud() {
  if (!me || !st) return;
  $('h-name').textContent = me.name; $('h-lv').textContent = t('level', { n: st.level ?? me.level }); $('h-coin-n').textContent = (st.coins || 0).toLocaleString('en');
  const k = st.task, chip = $('h-task'); chip.hidden = !k || view !== 'village';
  if (k) { $('h-task-ic').src = dataUrl(icon(TOOL[k.kind]), 2); $('h-task-t').textContent = `${t('task_' + k.kind)} · ${hms(workedNow())}`; }
}
$('h-task').addEventListener('click', () => openTask());
$('b-bag').addEventListener('click', () => openBag());
$('b-set').addEventListener('click', () => openSettings());
// the time worked, as the server counts it (its 'worked_s' plus the seconds since that answer, while it runs)
function workedNow() { const k = st?.task; if (!k) return 0; const run = !k.paused && !k.full; return Math.min(k.cap_s, k.worked_s + (run ? (Date.now() - fetchedAt) / 1000 : 0)); }

// ---- the villagers
function npcHead(id) {
  return el('div', { class: 'talk' }, img(portrait(NPC_LOOKS[id]), 2, { class: 'face' }),
    el('div', {}, el('h2', {}, t(id)), el('span', { class: 'role' }, t(id + '_role')), el('p', { class: 'say' }, t(id + '_hi'))));
}
function talk(id) {
  if (view !== 'village') return;
  const body = el('div', {}, npcHead(id));
  const task = TASK_OF[id];
  if (task) {
    const loot = sortIds(items().filter((x) => x.activity === task).map((x) => x.id));
    const iv = st.rules?.[task] || 300;
    body.append(el('div', { class: 'box' }, el('h3', {}, t('you_get')), el('div', { class: 'icons' }, loot.map((x) => img(icon(x), 2, { title: itemName(x, L), style: `box-shadow: inset 0 0 0 1px ${RARITY[meta(x).rarity] || '#888'}` })), task === 'shipwright' ? img(icon('coins'), 2, { title: t('wage', { n: st.rules?.ship_wage ?? 3 }) }) : null),
      el('p', { class: 'note', style: 'text-align:start;margin:6px 0 0' }, t('every', { m: Math.round(iv / 60), h: Math.round((st.rules?.cap_s || 28800) / 3600) }) + (task === 'shipwright' ? ' ' + t('wage', { n: st.rules?.ship_wage ?? 3 }) + '.' : ''))));
    const cur = st.task?.kind;
    if (cur && cur !== task) body.append(el('p', { class: 'note', style: 'color:#ffb340;margin:6px 0' }, t('busy_other', { task: t('task_' + cur) })), el('div', { class: 'acts' }, el('button', { class: 'btn', type: 'button', onclick: () => sheet.close() }, t('not_now')), el('button', { class: 'btn gold', type: 'button', onclick: () => { sheet.close(); openTask(); } }, t('go_task', { task: t('task_' + cur) }))));
    else if (cur === task) body.append(el('div', { class: 'acts' }, el('button', { class: 'btn', type: 'button', onclick: () => sheet.close() }, t('not_now')), el('button', { class: 'btn gold', type: 'button', onclick: () => { sheet.close(); openTask(); } }, t('back_to_work'))));
    else body.append(el('div', { class: 'acts' }, el('button', { class: 'btn', type: 'button', onclick: () => sheet.close() }, t('not_now')), el('button', { class: 'btn gold', type: 'button', id: 'b-accept', onclick: async (e) => { e.currentTarget.disabled = true; try { setState(await act('companion_task_start', { p_char: me.id, p_kind: task })); sheet.close(); openTask(); } catch { e.currentTarget && (e.currentTarget.disabled = false); } } }, t('accept'))));
  } else if (id === 'trader') body.append(el('div', { class: 'acts' }, el('button', { class: 'btn', type: 'button', onclick: () => sheet.close() }, t('not_now')), el('button', { class: 'btn gold', type: 'button', onclick: () => openTrader() }, t('open_trade'))));
  else if (id === 'banker') body.append(el('div', { class: 'acts' }, el('button', { class: 'btn', type: 'button', onclick: () => sheet.close() }, t('not_now')), el('button', { class: 'btn gold', type: 'button', onclick: () => openBank() }, t('open_bank'))));
  sheet.open(body, 'talk-' + id);
}

// ---- a task's own screen (side view): the timer, the loot so far, Finish
function openTask() {
  if (!st?.task) return toVillage();
  sheet.close(); village?.stop(); view = 'task'; show('s-task');
  const kind = st.task.kind;
  if (!scene || scene.kind !== kind) { scene?.stop(); scene = createScene($('cv-task'), kind, look, 'hero-' + me.id); scene.kind = kind; }
  scene.set(st.task); scene.start(); newLoot.clear();
  $('t-ic').src = dataUrl(icon(TOOL[kind]), 2);
  renderTask(true); schedulePoll();
  // a quick look now: the attempts due since the last heartbeat
  beat();
}
function renderTask(full = false) {
  const k = st?.task; if (!k) return;
  scene?.set(k);
  if (full) { $('t-title').textContent = t('task_' + k.kind); }
  const grid = $('t-loot'), ids = sortIds(Object.keys(k.bag || {}));
  const rows = ids.map((id) => slot(id, k.bag[id], { cls: newLoot.has(id) ? 'new' : '' }));
  if (k.coins > 0) rows.push(slot('coins', k.coins, { title: t('coins') }));
  grid.replaceChildren(...rows); newLoot.clear();
  $('t-empty').hidden = rows.length > 0;
  renderClock();
}
function renderClock() {
  const k = st?.task; if (!k) return;
  $('t-timer').textContent = hms(workedNow());
  const since = (Date.now() - fetchedAt) / 1000;
  $('t-sub').textContent = k.paused ? t('paused') : k.full ? t('full') : `${t('attempts', { n: k.attempts, m: k.max })} · ${t('next_in', { t: ms((k.next_s ?? 0) - since) })}`;
  $('t-bar').style.width = `${Math.min(100, (workedNow() / k.cap_s) * 100)}%`;
}
// when the next roll is due, ask the server a moment later (the heartbeat would bring it anyway, within 30 s)
function schedulePoll() {
  clearTimeout(pollT);
  if (view !== 'task' || !st?.task || st.task.full || st.task.paused) return;
  const wait = Math.max(2, (st.task.next_s ?? 30) + 1.5) * 1000;
  pollT = setTimeout(async () => { await beat(); schedulePoll(); }, Math.min(wait, 30000));
}
$('t-village').addEventListener('click', () => { clearTimeout(pollT); toVillage(NPC_OF[st?.task?.kind]); });
$('t-finish').addEventListener('click', async (e) => {
  const b = e.currentTarget; b.disabled = true;
  try {
    const kind = st.task.kind;
    const r = await act('companion_task_finish', { p_char: me.id }, { keyed: true });
    setState(r.state); clearTimeout(pollT);
    const ids = sortIds(Object.keys(r.got || {}));
    const body = el('div', { class: 'reveal' }, el('h2', {}, t('done_title')), el('p', { class: 'note' }, t('done_sub', { time: human(r.worked_s || 0), n: r.attempts })),
      ids.length || r.coins ? el('div', { class: 'grid', style: 'width:100%' }, ids.map((id) => slot(id, r.got[id])), r.coins ? slot('coins', r.coins) : null) : el('p', {}, t('done_none')),
      el('div', { class: 'acts one', style: 'width:100%' }, el('button', { class: 'btn gold', type: 'button', id: 'b-done', onclick: () => { sheet.close(); toVillage(NPC_OF[kind]); } }, t('collect_ok'))));
    sheet.open(body, 'done');
  } catch { /* shown */ } finally { b.disabled = false; }
});

// ---- an item slot
function slot(id, n, { cls = '', onclick, title, attrs = {} } = {}) {
  const m = meta(id), rc = RARITY[m.rarity] || 'rgba(246,214,122,.25)';
  return el('button', { type: 'button', class: `slot ${cls}`, style: `--rc:${rc}`, 'data-id': id, 'aria-label': `${title || itemName(id, L)} ${n ?? ''}`, title: title || itemName(id, L), onclick, ...attrs },
    img(icon(id), 2), n > 1 || id === 'coins' ? el('small', { dir: 'ltr' }, n >= 10000 ? Math.floor(n / 1000) + 'k' : n) : null);
}
const infoLine = (id) => { const m = meta(id); return [el('b', { style: `color:${RARITY[m.rarity] || '#fff'}` }, itemName(id, L)), ' · ', m.cat === 'loot' ? `${m.price} ${t('coins')} · ${t('sell_at')}` : t('bank_it')]; };

// ---- the bag
function openBag() {
  const render = () => {
    const inv = st.inv || {}, ids = sortIds(Object.keys(inv)), goods = ids.filter((i) => meta(i).cat === 'loot'), game = ids.filter((i) => meta(i).cat !== 'loot');
    const info = el('p', { class: 'info' }, ' ');
    const pickI = (id) => () => { info.replaceChildren(...infoLine(id)); for (const s of body.querySelectorAll('.slot')) s.classList.toggle('sel', s.dataset.id === id); };
    body.replaceChildren(el('h2', {}, t('bag')), el('div', { class: 'coinline' }, img(icon('coins'), 2), (st.coins || 0).toLocaleString('en'), el('span', { class: 'note' }, ' ' + t('coins'))));
    if (!ids.length) body.append(el('p', { class: 'note', style: 'margin:14px auto' }, t('bag_empty')));
    if (goods.length) body.append(el('div', { class: 'sec' }, el('h3', {}, t('goods'))), el('div', { class: 'grid' }, goods.map((id) => slot(id, inv[id], { onclick: pickI(id) }))));
    if (game.length) body.append(el('div', { class: 'sec' }, el('h3', {}, t('game_items'))), el('div', { class: 'grid' }, game.map((id) => slot(id, inv[id], { onclick: pickI(id) }))));
    if (ids.length) body.append(info);
  };
  const body = el('div', {}); sheetRefresh.bag = render; render(); sheet.open(body, 'bag');
}

// ---- the trader: put goods on the counter, see what they bring, trade
function openTrader() {
  let offer = {}, result = null;
  const body = el('div', {});
  const render = () => {
    const inv = st.inv || {}, goods = sortIds(Object.keys(inv).filter((i) => meta(i).cat === 'loot'));
    const value = Object.entries(offer).reduce((a, [id, n]) => a + meta(id).price * n, 0), rolls = Math.min(60, Math.floor(value / (st.rules?.trade_roll_value || 40)));
    body.replaceChildren(npcHead('trader'));
    if (result) {
      const ids = sortIds(Object.keys(result.got || {}));
      body.append(el('div', { class: 'reveal' }, el('h2', {}, t('trade_done')), el('div', { class: 'coinline' }, img(icon('coins'), 2), `+${result.coins}`),
        el('h3', {}, t('bonus')), ids.length ? el('div', { class: 'icons' }, ids.map((id) => slot(id, result.got[id], { onclick: () => { info.replaceChildren(...infoLine(id)); } }))) : el('p', { class: 'note' }, t('no_bonus'))));
      const info = el('p', { class: 'info' }, ids.length ? infoLine(ids[0]) : ' '); body.append(info);
      body.append(el('div', { class: 'acts' }, el('button', { class: 'btn', type: 'button', onclick: () => sheet.close() }, t('close')), el('button', { class: 'btn gold', type: 'button', onclick: () => { result = null; render(); } }, t('trade_title'))));
      return;
    }
    const left = goods.filter((id) => (inv[id] || 0) - (offer[id] || 0) > 0);
    body.append(el('div', { class: 'sec' }, el('h3', {}, t('goods')), el('span', {}, t('offer_hint'))));
    body.append(left.length ? el('div', { class: 'grid', id: 'tr-goods' }, left.map((id) => slot(id, inv[id] - (offer[id] || 0), { onclick: () => { offer[id] = inv[id]; render(); } }))) : el('p', { class: 'note', style: 'margin:6px auto' }, goods.length ? ' ' : t('no_goods')));
    const oids = sortIds(Object.keys(offer));
    body.append(el('div', { class: 'sec' }, el('h3', {}, t('offer')), el('span', { class: 'row' }, left.length ? el('button', { class: 'btn', type: 'button', style: 'min-height:34px;font-size:14px', onclick: () => { for (const id of goods) offer[id] = inv[id]; render(); } }, t('offer_all')) : null, oids.length ? el('button', { class: 'btn', type: 'button', style: 'min-height:34px;font-size:14px', onclick: () => { offer = {}; render(); } }, t('clear')) : null)));
    body.append(el('div', { class: 'grid bank10', id: 'tr-offer', style: 'min-height:64px' }, oids.map((id) => slot(id, offer[id], { onclick: () => { delete offer[id]; render(); } }))));
    body.append(el('p', { class: 'info' }, oids.length ? t('you_receive', { n: value, r: rolls }) : t('offer_hint')));
    body.append(el('div', { class: 'acts' }, el('button', { class: 'btn', type: 'button', onclick: () => sheet.close() }, t('close')), el('button', { class: 'btn gold', type: 'button', id: 'b-trade', disabled: !oids.length, onclick: async (e) => {
      e.currentTarget.disabled = true;
      try { const r = await act('companion_trade', { p_char: me.id, p_offer: offer }, { keyed: true }); offer = {}; result = r; setState(r.state); render(); } catch { render(); }
    } }, t('trade_go'))));
  };
  sheetRefresh.trader = () => { const inv = st.inv || {}; for (const id of Object.keys(offer)) if (!(inv[id] >= offer[id])) delete offer[id]; render(); };
  render(); sheet.open(body, 'trader');
}

// ---- the banker: the 10 slots (read-only here), the coin vault, and the bag: tap or drag a game item to deposit it
async function openBank() {
  try { bank = await act('companion_bank', {}); } catch { return; }
  let sel = null, qty = 1, coinQty = 0, note = '';
  const body = el('div', {});
  const render = () => {
    const inv = st.inv || {}, ids = sortIds(Object.keys(inv)), used = bank.items.length;
    body.replaceChildren(npcHead('banker'));
    // the bank
    body.append(el('div', { class: 'sec' }, el('h3', {}, t('bank_title')), el('span', { dir: 'ltr', id: 'bk-used' }, t('bank_slots', { n: used }))));
    const g = el('div', { class: 'grid bank10', id: 'bk-grid' });
    for (let i = 0; i < 10; i++) { const it = bank.items.find((x) => x.slot === i); g.append(it ? slot(it.kind === 'f' ? it.id : it.id, it.n, { cls: 'ro', onclick: () => { note = `${itemName(it.id, L)}: ${t('readonly')}`; render(); } }) : el('div', { class: 'slot empty', 'aria-hidden': 'true' })); }
    body.append(g);
    body.append(el('div', { class: 'line' }, el('span', { class: 'coinline' }, img(icon('drachma'), 2), el('span', { id: 'bk-vault' }, (bank.drachma || 0).toLocaleString('en'))), el('span', { class: 'note' }, t('vault'))));
    body.append(el('p', { class: 'note', style: 'text-align:start;margin:2px 0 8px' }, t('bank_rules')));
    // the bag
    body.append(el('div', { class: 'sec' }, el('h3', {}, t('bag')), el('span', {}, t('drag_hint'))));
    if (!ids.length) body.append(el('p', { class: 'note', style: 'margin:6px auto' }, t('bag_empty')));
    else body.append(el('div', { class: 'grid', id: 'bk-bag' }, ids.map((id) => { const ok = meta(id).cat !== 'loot'; return slot(id, inv[id], { cls: (ok ? '' : 'dim') + (sel === id ? ' sel' : ''), attrs: { 'data-bankable': ok ? '1' : '0' } }); })));
    if (sel && inv[sel]) {
      qty = Math.max(1, Math.min(inv[sel], qty));
      const inp = el('input', { type: 'number', inputmode: 'numeric', min: 1, max: inv[sel], value: qty, 'aria-label': t('amount'), oninput: (e) => { qty = Math.max(1, Math.min(inv[sel], parseInt(e.target.value || '1', 10) || 1)); } });
      body.append(el('p', { class: 'info' }, infoLine(sel)), el('div', { class: 'qty' }, el('button', { class: 'btn', type: 'button', onclick: () => { qty = Math.max(1, qty - 1); inp.value = qty; } }, '−'), inp, el('button', { class: 'btn', type: 'button', onclick: () => { qty = Math.min(inv[sel], qty + 1); inp.value = qty; } }, '+'), el('button', { class: 'btn', type: 'button', onclick: () => { qty = inv[sel]; inp.value = qty; } }, t('max'))),
        el('div', { class: 'acts one' }, el('button', { class: 'btn gold', type: 'button', id: 'b-deposit', onclick: () => deposit(sel, qty) }, `${t('deposit')} · ${itemName(sel, L)}`)));
    } else if (note) body.append(el('p', { class: 'info' }, note));
    // drachmas
    const purse = st.coins || 0; coinQty = Math.max(0, Math.min(purse, coinQty || purse));
    const cin = el('input', { type: 'number', inputmode: 'numeric', min: 0, max: purse, value: coinQty, id: 'bk-coins', 'aria-label': t('amount'), oninput: (e) => { coinQty = Math.max(0, Math.min(purse, parseInt(e.target.value || '0', 10) || 0)); } });
    body.append(el('div', { class: 'sec' }, el('h3', {}, t('deposit_coins')), el('span', { class: 'coinline', style: 'font-size:15px' }, img(icon('drachma'), 1), purse.toLocaleString('en'))),
      el('div', { class: 'qty' }, el('button', { class: 'btn', type: 'button', onclick: () => { coinQty = Math.max(0, coinQty - 10); cin.value = coinQty; } }, '−'), cin, el('button', { class: 'btn', type: 'button', onclick: () => { coinQty = Math.min(purse, coinQty + 10); cin.value = coinQty; } }, '+'), el('button', { class: 'btn gold', type: 'button', id: 'b-dep-coins', disabled: !purse, onclick: depositCoins }, t('deposit'))));
    bindDrag();
  };
  async function deposit(id, n) {
    if (meta(id).cat === 'loot') { note = t('not_bankable'); sel = null; render(); return; }
    try { const r = await act('companion_bank_deposit', { p_char: me.id, p_item: id, p_n: n }, { keyed: true }); bank = r.bank; sel = null; qty = 1; note = `${itemName(id, L)} ×${n}: ${t('deposited')}`; setState(r.state); flashBank(); }
    catch { /* shown */ }
  }
  async function depositCoins() {
    if (!(coinQty > 0)) return;
    try { const n = coinQty; const r = await act('companion_bank_deposit_coins', { p_char: me.id, p_n: n }, { keyed: true }); bank = r.bank; coinQty = 0; note = `${n} ${t('coins')}: ${t('deposited')}`; setState(r.state); }
    catch { /* shown */ }
  }
  const flashBank = () => { const g = $('bk-grid'); g?.classList.add('over'); setTimeout(() => g?.classList.remove('over'), 400); };
  // tap selects; dragging a bankable item onto the bank deposits the whole stack
  function bindDrag() {
    for (const s of body.querySelectorAll('#bk-bag .slot')) {
      let start = null, ghost = null;
      s.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY, id: e.pointerId }; s.setPointerCapture(e.pointerId); });
      s.addEventListener('pointermove', (e) => {
        if (!start || e.pointerId !== start.id) return;
        if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) { if (s.dataset.bankable !== '1') return; ghost = el('img', { class: 'ghost', src: dataUrl(icon(s.dataset.id), 3), alt: '' }); document.body.append(ghost); }
        if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; const g = $('bk-grid'), r = g.getBoundingClientRect(); g.classList.toggle('over', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom); }
      });
      const end = (e) => {
        if (!start || e.pointerId !== start.id) return;
        const id = s.dataset.id, was = ghost; start = null;
        if (was) { was.remove(); ghost = null; const g = $('bk-grid'), r = g.getBoundingClientRect(); g.classList.remove('over'); if (e.type === 'pointerup' && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) deposit(id, st.inv[id] || 0); return; }
        if (e.type !== 'pointerup') return;
        if (s.dataset.bankable !== '1') { note = `${itemName(id, L)}: ${t('not_bankable')}`; sel = null; render(); return; }
        sel = sel === id ? null : id; qty = st.inv[id] || 1; note = ''; render();
      };
      s.addEventListener('pointerup', end); s.addEventListener('pointercancel', end);
    }
  }
  sheetRefresh.bank = () => { if (sel && !st.inv?.[sel]) sel = null; render(); };
  render(); sheet.open(body, 'bank');
}

// ---- settings
function openSettings() {
  const body = el('div', {}, el('h2', {}, t('settings')), el('p', {}, t('language')),
    el('div', { class: 'seg', role: 'group', 'aria-label': t('language') }, ['he', 'en'].map((c) => el('button', { type: 'button', 'aria-pressed': String(c === L), onclick: () => { L = c; applyLang(); openSettings(); } }, { he: 'עברית', en: 'English' }[c]))),
    el('div', { class: 'acts' }, el('button', { class: 'btn', type: 'button', onclick: async () => { sheet.close(); await rpc('companion_leave', { p_char: me.id, p_session: SESSION }).catch(() => {}); me = null; toChars(); } }, t('switch')),
      el('button', { class: 'btn', type: 'button', onclick: async () => { sheet.close(); await rpc('companion_leave', { p_char: me.id, p_session: SESSION }).catch(() => {}); me = null; await signOut(); toLogin(); } }, t('sign_out'))));
  sheet.open(body, 'settings');
}

// ---- start
applyLang();
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !/[?&]nosw\b/.test(location.search)) navigator.serviceWorker.register('sw.js').catch(() => {});
(async () => { if (signedIn()) { try { await toChars(); } catch { toLogin(); } } else toLogin(); })();
window.__companion = { beat, get st() { return st; }, get me() { return me; }, get bank() { return bank; }, get view() { return view; }, village: () => village, scene: () => scene, talk, openTask, openBag, openTrader, openBank };
