// A stand-in for the Supabase project, for the browser tests (tests/forum_browser.mjs): Playwright catches every call
// the pages make to SITE.SUPABASE_URL and answers from a small world kept in memory (accounts, forum topics and posts,
// characters). It answers in Supabase's own shapes (GoTrue sessions and errors, PostgREST rpc results and P0001
// errors) and follows the server's rules where the pages depend on them (game repo
// server/supabase/migrations/20261111120000_forum.sql: ranks, lengths, the word filter, owners, admins, pages).
// Nothing here reaches the real project.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Filter = require(path.join(HERE, '../forum-filter.js'));
export const FX = JSON.parse(readFileSync(path.join(HERE, 'fixtures/forum-db.json'), 'utf8'));
export const SUPABASE = 'https://exyixhjorhrzunnrxqjs.supabase.co';

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub) => `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })}.c2ln`;

export function makeWorld() {
  const W = { users: [], topics: [], posts: [], chars: {}, admins: new Set(), seq: 1000, log: [], serverOnlyWords: ['grumblefrog'], codes: {} };
  const serverWords = Filter.compile([...FX.words, ...W.serverOnlyWords.map((w) => ({ w, k: 'w' }))]);
  W.cats = FX.categories;
  W.addUser = (o) => {
    const u = { id: `00000000-0000-4000-8000-${String(++W.seq).padStart(12, '0')}`, email: o.email || `${o.username.toLowerCase()}@example.com`, password: o.password || 'Secret-pass-1',
      username: o.username, created_at: o.created_at || '2026-10-20T10:00:00Z', ready: o.ready !== false, confirmed: o.confirmed !== false, banned: !!o.banned, has_profile: o.has_profile !== false };
    W.users.push(u); if (o.admin) W.admins.add(u.id);
    return u;
  };
  W.addTopic = (o) => {
    const at = o.at || '2026-10-28T09:00:00Z';
    const tp = { id: ++W.seq, category_id: o.cat, author_id: o.author.id, title: o.title, pinned: !!o.pinned, locked: !!o.locked, created_at: at, deleted: false };
    W.topics.push(tp);
    W.posts.push({ id: ++W.seq, topic_id: tp.id, author_id: o.author.id, is_op: true, body: o.body, created_at: at, edited_at: null, deleted: false });
    for (const [i, r] of (o.replies || []).entries()) W.posts.push({ id: ++W.seq, topic_id: tp.id, author_id: r.author.id, is_op: false, body: r.body, created_at: r.at || new Date(Date.parse(at) + (i + 1) * 3600e3).toISOString(), edited_at: r.edited || null, deleted: false });
    return tp;
  };
  // ---- the server's rules
  const vis = (p) => !p.deleted && !W.topics.find((t) => t.id === p.topic_id).deleted;
  const rankOf = (pts) => { const r = [...FX.ranks.ranks].reverse().find((x) => x.min <= pts); const n = FX.ranks.ranks.find((x) => x.lv === r.lv + 1); return { ...r, next: n ? n.min : null }; };
  W.card = (uid) => {
    const u = W.users.find((x) => x.id === uid); if (!u || !u.has_profile) return null;
    const mine = W.posts.filter((p) => p.author_id === uid && vis(p)), topics = mine.filter((p) => p.is_op).length, replies = mine.length - topics, pts = topics * 3 + replies;
    return { u: u.username, joined: u.created_at, topics, replies, posts: topics + replies, points: pts + (u.bonus || 0), rank: rankOf(pts + (u.bonus || 0)), admin: W.admins.has(uid) };
  };
  const err = (m) => { const e = new Error(m); e.pg = m; throw e; };
  const tpost = (t) => W.posts.filter((p) => p.topic_id === t.id && !p.deleted);
  const lastPost = (t) => tpost(t).slice(-1)[0];
  const catJson = (c) => ({ id: c.id, section: c.section, sort: c.sort, icon: c.icon, admin_only: c.admin_only, name: c.name, blurb: c.blurb });
  const poster = (u) => { if (!u) err('NOT_SIGNED_IN'); if (!u.has_profile) err('NO_PROFILE'); if (!u.ready) err('PROFILE_INCOMPLETE'); if (u.banned && !W.admins.has(u.id)) err('BANNED'); return u; };
  const checkText = (title, body) => {
    if (title != null) { const n = [...title.trim()].length; if (n < 3 || n > 120) err('TITLE_LENGTH'); if (Filter.problem(title, serverWords)) err('PROFANITY'); }
    const b = [...body.trim()].length; if (b < 2 || b > 10000) err('BODY_LENGTH'); if (Filter.problem(body, serverWords)) err('PROFANITY');
  };
  const canPost = (u) => { try { poster(u); return true; } catch (e) { return false; } };
  const nowIso = () => new Date().toISOString();
  W.rpc = {
    legal_info: () => ({ terms_version: '2026-10-30', min_age: 13 }),
    username_status: (a) => (/^[A-Za-zא-ת][A-Za-z0-9_א-ת]{2,15}$/.test(a.p_username) ? (W.users.some((u) => u.username.toLowerCase() === a.p_username.toLowerCase()) ? 'TAKEN' : 'AVAILABLE') : 'INVALID:CHARS'),
    login_email: (a) => { const u = W.users.find((x) => x.username.toLowerCase() === String(a.p_username).toLowerCase()); return u && u.password === a.p_password ? u.email : null; },
    account_status: (a, u) => (u.has_profile ? { has_profile: true, username: u.username, ready: u.ready, problem: u.ready ? null : 'BIRTH_DATE_INVALID', birth_date: u.ready ? '2000-01-01' : null, gender: u.ready ? 'other' : null, terms_current: '2026-10-30', min_age: 13 }
      : { has_profile: false, ready: false, problem: 'NO_PROFILE', terms_current: '2026-10-30', min_age: 13 }),
    complete_profile: (a, u) => { if (!u.has_profile) { u.username = a.p_username; u.has_profile = true; } u.ready = true; return W.rpc.account_status(a, u); },
    forum_filter_words: () => FX.words,
    forum_ranks: () => FX.ranks,
    forum_me: (a, u) => (!u ? { signed_in: false } : !u.has_profile ? { signed_in: true, has_profile: false, ready: false, problem: 'NO_PROFILE' }
      : { signed_in: true, has_profile: true, username: u.username, ready: u.ready, banned: u.banned, admin: W.admins.has(u.id), card: W.card(u.id) }),
    forum_home: () => ({
      categories: W.cats.map((c) => {
        const ts = W.topics.filter((t) => t.category_id === c.id && !t.deleted).sort((x, y) => Date.parse(lastPost(y).created_at) - Date.parse(lastPost(x).created_at));
        const lt = ts[0];
        return { ...catJson(c), topics: ts.length, posts: ts.reduce((n, t) => n + tpost(t).length, 0),
          last: lt ? { topic: lt.id, title: lt.title, at: lastPost(lt).created_at, by: W.users.find((u) => u.id === lastPost(lt).author_id)?.username } : null };
      }),
      stats: { topics: W.topics.filter((t) => !t.deleted).length, posts: W.posts.filter(vis).length, members: W.users.length, newest: [...W.users].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.username },
    }),
    forum_topics: (a, u) => {
      const c = W.cats.find((x) => x.id === a.p_category); if (!c) err('NOT_FOUND');
      const all = W.topics.filter((t) => t.category_id === c.id && !t.deleted)
        .sort((x, y) => (y.pinned - x.pinned) || Date.parse(lastPost(y).created_at) - Date.parse(lastPost(x).created_at));
      const pages = Math.max(1, Math.ceil(all.length / 25)), pg = Math.min(Math.max(1, a.p_page || 1), pages);
      return { category: catJson(c), total: all.length, page: pg, pages, per_page: 25, can_post: canPost(u) && (!c.admin_only || W.admins.has(u.id)), admin: !!u && W.admins.has(u.id),
        topics: all.slice((pg - 1) * 25, pg * 25).map((t) => ({ id: t.id, title: t.title, pinned: t.pinned, locked: t.locked, created_at: t.created_at, last_post_at: lastPost(t).created_at,
          replies: tpost(t).length - 1, author: W.card(t.author_id), last_by: W.users.find((x) => x.id === lastPost(t).author_id)?.username })) };
    },
    forum_topic: (a, u) => {
      const t = W.topics.find((x) => x.id === +a.p_topic && !x.deleted); if (!t) err('NOT_FOUND');
      const ps = tpost(t), pages = Math.max(1, Math.ceil(ps.length / 20)), pg = (a.p_page || 1) < 1 ? pages : Math.min(a.p_page, pages);
      const adm = !!u && W.admins.has(u.id);
      return { topic: { id: t.id, title: t.title, pinned: t.pinned, locked: t.locked, created_at: t.created_at, replies: ps.length - 1, author: W.users.find((x) => x.id === t.author_id)?.username, mine: !!u && t.author_id === u.id },
        category: catJson(W.cats.find((c) => c.id === t.category_id)), total: ps.length, page: pg, pages, per_page: 20, can_reply: canPost(u) && (!t.locked || adm), admin: adm,
        posts: ps.slice((pg - 1) * 20, pg * 20).map((p) => ({ id: p.id, body: p.body, op: p.is_op, created_at: p.created_at, edited_at: p.edited_at, mine: !!u && p.author_id === u.id, author: W.card(p.author_id) })) };
    },
    forum_user: (a, u) => {
      const x = W.users.find((y) => y.has_profile && y.username.toLowerCase() === String(a.p_username).toLowerCase()); if (!x) err('NOT_FOUND');
      return { ...W.card(x.id), username: x.username, me: !!u && u.id === x.id,
        recent: W.topics.filter((t) => t.author_id === x.id && !t.deleted).sort((p, q) => q.created_at.localeCompare(p.created_at)).slice(0, 10)
          .map((t) => ({ id: t.id, title: t.title, created_at: t.created_at, replies: tpost(t).length - 1, category: { id: t.category_id, name: W.cats.find((c) => c.id === t.category_id).name } })) };
    },
    forum_new_topic: (a, u) => {
      poster(u); const c = W.cats.find((x) => x.id === a.p_category); if (!c) err('CATEGORY_INVALID'); if (c.admin_only && !W.admins.has(u.id)) err('ADMIN_ONLY');
      checkText(a.p_title, a.p_body); W.log.push(['new_topic', a]);
      const t = W.addTopic({ cat: c.id, author: u, title: a.p_title.trim(), body: a.p_body.trim(), at: nowIso() }); return { id: t.id };
    },
    forum_reply: (a, u) => {
      poster(u); const t = W.topics.find((x) => x.id === +a.p_topic && !x.deleted); if (!t) err('NOT_FOUND'); if (t.locked && !W.admins.has(u.id)) err('TOPIC_LOCKED');
      checkText(null, a.p_body); W.log.push(['reply', a]);
      const p = { id: ++W.seq, topic_id: t.id, author_id: u.id, is_op: false, body: a.p_body.trim(), created_at: nowIso(), edited_at: null, deleted: false }; W.posts.push(p);
      return { id: p.id, topic: t.id, page: Math.max(1, Math.ceil(tpost(t).length / 20)) };
    },
    forum_edit: (a, u) => {
      poster(u); const p = W.posts.find((x) => x.id === +a.p_post && !x.deleted); if (!p) err('NOT_FOUND'); if (p.author_id !== u.id) err('NOT_OWNER');
      checkText(p.is_op && a.p_title != null ? a.p_title : null, a.p_body); p.body = a.p_body.trim(); p.edited_at = nowIso();
      if (p.is_op && a.p_title) W.topics.find((t) => t.id === p.topic_id).title = a.p_title.trim();
      return { ok: true };
    },
    forum_delete: (a, u) => {
      if (!u) err('NOT_SIGNED_IN'); const adm = W.admins.has(u.id); const p = W.posts.find((x) => x.id === +a.p_post && !x.deleted); if (!p) err('NOT_FOUND');
      if (!adm && p.author_id !== u.id) err('NOT_OWNER');
      if (p.is_op) { W.topics.find((t) => t.id === p.topic_id).deleted = true; return { ok: true, topic_deleted: true }; }
      p.deleted = true; return { ok: true, topic_deleted: false };
    },
    forum_mod: (a, u) => {
      if (!u || !W.admins.has(u.id)) err('NOT_FORUM_ADMIN'); const t = W.topics.find((x) => x.id === +a.p_topic); if (!t) err('NOT_FOUND');
      if (a.p_action === 'pin' || a.p_action === 'unpin') t.pinned = a.p_action === 'pin';
      else if (a.p_action === 'lock' || a.p_action === 'unlock') t.locked = a.p_action === 'lock';
      else if (a.p_action === 'move') t.category_id = a.p_category; else if (a.p_action === 'delete') t.deleted = true;
      return { ok: true };
    },
  };
  return W;
}

// wire the world to a browser context
export async function install(context, W) {
  const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
  const sessions = new Map(); // access token -> user id
  const session = (u) => {
    const at = jwt(u.id), rt = 'rt-' + (++W.seq);
    sessions.set(at, u.id); sessions.set(rt, u.id);
    return { access_token: at, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: rt, user: userJson(u) };
  };
  const userJson = (u) => ({ id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: u.confirmed ? '2026-10-20T10:00:00Z' : null, app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { username: u.username }, identities: [{ id: u.id, provider: 'email' }], created_at: u.created_at, updated_at: u.created_at });
  W.calls = [];
  await context.route(SUPABASE + '/**', async (route) => {
    const req = route.request(), url = new URL(req.url()), p = url.pathname;
    const send = (status, body) => route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: body === undefined ? '' : JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    let body = {}; try { body = req.postDataJSON() || {}; } catch (e) { /* none */ }
    const auth = (req.headers().authorization || '').replace(/^Bearer /, ''), me = W.users.find((u) => u.id === sessions.get(auth)) || null;
    W.calls.push(req.method() + ' ' + p + (p.includes('/rpc/') ? '' : url.search));
    if (p === '/auth/v1/settings') return send(200, { external: { email: true, google: true, facebook: false }, disable_signup: false, mailer_autoconfirm: false });
    if (p === '/auth/v1/token') {
      const gt = url.searchParams.get('grant_type');
      if (gt === 'password') {
        const u = W.users.find((x) => x.email === body.email);
        if (!u || u.password !== body.password) return send(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
        if (!u.confirmed) return send(400, { code: 400, error_code: 'email_not_confirmed', msg: 'Email not confirmed' });
        return send(200, session(u));
      }
      if (gt === 'refresh_token') { const u = W.users.find((x) => x.id === sessions.get(body.refresh_token)); return u ? send(200, session(u)) : send(400, { error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' }); }
      return send(400, { error_code: 'unsupported', msg: 'unsupported grant' });
    }
    if (p === '/auth/v1/signup') {
      const d = body.data || {};
      if (W.users.some((u) => u.email === body.email)) { const u = W.users.find((x) => x.email === body.email); return send(200, { ...userJson(u), identities: [] }); }
      if (W.users.some((u) => u.username.toLowerCase() === String(d.username).toLowerCase())) return send(500, { code: 500, error_code: 'unexpected_failure', msg: 'Database error saving new user' });
      const u = W.addUser({ username: d.username, email: body.email, password: body.password, confirmed: false, created_at: new Date().toISOString() });
      u.meta = d; W.codes[u.email] = '123456'; W.log.push(['signup', body]);
      return send(200, userJson(u));
    }
    if (p === '/auth/v1/verify') {
      const u = W.users.find((x) => x.email === body.email);
      if (!u || W.codes[u.email] !== body.token) return send(403, { code: 403, error_code: 'otp_expired', msg: 'Token has expired or is invalid' });
      u.confirmed = true; delete W.codes[u.email];
      return send(200, session(u));
    }
    if (p === '/auth/v1/resend' || p === '/auth/v1/recover') return send(200, {});
    if (p === '/auth/v1/logout') return route.fulfill({ status: 204, headers: CORS });
    if (p === '/auth/v1/user') return me ? send(200, userJson(me)) : send(401, { error_code: 'bad_jwt', msg: 'invalid JWT' });
    if (p.startsWith('/rest/v1/rpc/')) {
      const fn = p.slice('/rest/v1/rpc/'.length), f = W.rpc[fn];
      if (!f) return send(404, { code: 'PGRST202', message: 'Could not find the function ' + fn });
      try { return send(200, f(body, me)); }
      catch (e) { if (e.pg) return send(400, { code: 'P0001', message: e.pg, details: null, hint: null }); throw e; }
    }
    if (p === '/rest/v1/characters') return send(200, me && me.ready ? (W.chars[me.id] || []) : []);
    return send(404, { message: 'not in the stand-in: ' + p });
  });
}
