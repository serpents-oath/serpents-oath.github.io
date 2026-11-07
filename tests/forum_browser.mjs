// The forum, account and player pages in Chromium against the Supabase stand-in (fake-supabase.mjs): nothing reaches
// the real project. Run: node tests/forum_browser.mjs   (SHOTS=<dir> also saves the 1440x900 screenshots, en and he)
import { startServer, launch, newContext, makeWorld } from './harness.mjs';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
global.window = {}; require('../forum-i18n.js'); require('../account-i18n.js');
const FT = window.SO_FT, AT = window.SO_AT;
const SHOTS = process.env.SHOTS || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

let pass = 0, fail = 0;
const ok = (c, name, extra = '') => { if (c) { pass++; console.log('  ok  ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? '  -> ' + extra : '')); } };
const eq = (a, b, name) => ok(a === b, name, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);

// a world: three players with different ranks, one topic with replies, and characters for Ariadne
function world() {
  const W = makeWorld();
  const a = W.addUser({ username: 'Ariadne' }), k = W.addUser({ username: 'Kallias' }), r = W.addUser({ username: 'Roy', admin: true });
  k.bonus = 170; r.bonus = 1300;
  W.chars[a.id] = [
    { slot: 0, name: 'Ariadne', level: 14, active_job: 'archer', jobs: { archer: { tier: 1 } }, appearance: { body: 'f' } },
    { slot: 1, name: 'Theron', level: 7, active_job: 'warrior', jobs: { warrior: { tier: 0 } }, appearance: { body: 'm' } },
  ];
  W.addTopic({ cat: 'quests', author: a, title: "Where is the Herald's Road?", body: 'I finished the first quest. Where do I go next?\nhttps://example.com/map',
    replies: [{ author: k, body: 'North of the agora, past the well.' }, { author: r, body: 'Thanks for asking. The road opens after the second quest.' }] });
  W.addTopic({ cat: 'builds', author: k, title: 'Archer build at level 20', body: 'Dexterity first, then agility.', pinned: true });
  W.addTopic({ cat: 'announcements', author: r, title: 'Welcome to the forum', body: 'Be kind. Have fun.' });
  return { W, a, k, r };
}
const go = async (p, url, lang = 'en') => { await p.goto(srv.url + url + (url.includes('?') ? '&' : '?') + 'lang=' + lang); await p.waitForLoadState('networkidle'); await p.waitForTimeout(250); };
const shot = async (p, name) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, name + '.png') }); };
async function signIn(p, who = 'Ariadne', pw = 'Secret-pass-1', lang = 'en') {
  await go(p, 'account.html', lang);
  await p.fill('#a-identifier', who); await p.fill('#a-password', pw);
  await p.click('#view form button[type=submit]');
  await p.waitForSelector('.chars, .uhead, #view .fmsg.err', { timeout: 8000 }).catch(() => null);
  await p.waitForTimeout(200);
}

const srv = await startServer();
const browser = await launch();
const errors = [];
const page = async (ctx) => { const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); return p; };

try {
  // ---------- 1. the forum, signed out ----------
  console.log('forum home (signed out)');
  {
    const { W } = world(); const ctx = await newContext(browser, W); const p = await page(ctx);
    await go(p, 'forum.html');
    eq(await p.locator('.crow').count(), 16, '16 categories listed');
    eq(await p.locator('#view h2[id^=sec-]').count(), 4, '4 sections (news, game, community, support)');
    eq(await p.locator('html').getAttribute('dir'), 'ltr', 'page direction ltr');
    eq((await p.locator('#view h1').first().innerText()).trim(), FT.en.f_title, 'English title');
    ok((await p.locator('#view').innerText()).includes("Where is the Herald's Road?"), 'latest topic shown on its category');
    await go(p, 'forum.html?c=quests');
    eq(await p.locator('.trow').count(), 1, 'quests category: one topic row');
    await go(p, 'forum.html?view=ranks');
    eq(await p.locator('.ranks tbody tr').count(), 12, 'ranks legend: 12 rows');
    ok((await p.locator('.ranks tbody tr').first().innerText()).includes('Zeus'), 'ranks legend: Zeus at the top');
    ok((await p.locator('.ranks tbody tr').last().innerText()).includes('Hestia'), 'ranks legend: Hestia at the bottom');
    // the new-topic page asks to sign in
    await go(p, 'forum.html?new=general');
    eq(await p.locator('.signin-box').count(), 1, 'new topic signed out: sign-in box');
    await ctx.close();
  }

  // ---------- 2. a topic, rank badges ----------
  console.log('topic and rank badges');
  {
    const { W } = world(); const ctx = await newContext(browser, W); const p = await page(ctx);
    const tp = W.topics[0];
    await go(p, `forum.html?t=${tp.id}`);
    eq(await p.locator('article.post').count(), 3, 'topic: opening post + 2 replies');
    const badges = await p.locator('article.post .rk .gd').allInnerTexts();
    eq(badges.length, 3, 'a rank badge on every post');
    eq(badges[0], 'Hestia', 'Ariadne (3 points): Hestia');
    eq(badges[1], 'Ares', 'Kallias (171 points): Ares');
    eq(badges[2], 'Zeus', 'Roy (1301 points): Zeus');
    eq(await p.locator('article.post .adm').count(), 1, 'admin flag on the admin only');
    eq(await p.locator('article.post a[href="https://example.com/map"]').count(), 1, 'links in a post are clickable');
    eq(await p.locator('.reply-box').count(), 0, 'no reply box when signed out');
    eq(await p.locator('article.post .body[dir=auto]').count(), 3, 'post bodies carry dir=auto');
    await ctx.close();
  }

  // ---------- 3. sign in by username, own page with characters ----------
  console.log('sign in');
  {
    const { W } = world(); const ctx = await newContext(browser, W); const p = await page(ctx);
    await signIn(p, 'Ariadne', 'wrong-password');
    ok(await p.locator('#view .fmsg.err').isVisible(), 'wrong password: error shown');
    eq(await p.locator('.chars').count(), 0, 'wrong password: not signed in');
    await p.fill('#a-password', 'Secret-pass-1'); await p.click('#view form button[type=submit]');
    await p.waitForSelector('.chars .chc', { timeout: 8000 }).catch(() => null);
    const names = await p.locator('.chars .chc .nm').allInnerTexts();
    eq(names.join(','), 'Ariadne,Theron', 'own page lists both characters');
    ok((await p.locator('.uhead h1').innerText()).includes('Ariadne'), 'own page: username');
    ok((await p.locator('#view time').count()) > 0 && /2026/.test(await p.locator('#view').innerText()), 'own page: join date shown');
    ok(W.calls.some((c) => c.includes('/rpc/login_email')), 'username sign-in goes through login_email');
    // the top bar now shows the name, on the forum and on the home page
    await go(p, 'forum.html');
    eq((await p.locator('[data-nav=acct]').first().innerText()).trim(), 'Ariadne', 'forum top bar: signed-in name');
    await go(p, 'index.html');
    eq((await p.locator('[data-nav=forum]').first().innerText()).trim(), FT.en.nav_forum, 'home page nav: Forum link');
    eq((await p.locator('[data-nav=acct]').first().innerText()).trim(), 'Ariadne', 'home page nav: signed-in name');
    // someone else's page shows no characters
    await go(p, 'user.html?u=Kallias');
    ok((await p.locator('.uhead h1').innerText()).includes('Kallias'), "other player's page");
    eq(await p.locator('.uchars').count(), 0, "other player's page: no characters");
    await ctx.close();
  }

  // ---------- 4. register and the code step ----------
  console.log('register');
  {
    const { W } = world(); const ctx = await newContext(browser, W); const p = await page(ctx);
    await go(p, 'account.html?mode=register');
    await p.fill('#a-inviteCode', 'ABCD2345'); await p.fill('#a-username', 'Nikandros'); await p.fill('#a-email', 'nik@example.com'); // (the invitation code came with the new site, 11.2026)
    await p.fill('#a-password', 'Strong-pass-77'); await p.fill('#a-password2', 'Strong-pass-77');
    await p.selectOption('select[name=day]', '05'); await p.selectOption('select[name=month]', '03'); await p.selectOption('select[name=year]', '2000');
    await p.check('input[name=gender][value=male]'); await p.check('#a-acceptTerms');
    await p.click('#view form button[type=submit]'); await p.waitForSelector('#a-code input', { timeout: 8000 }).catch(() => null); await p.waitForTimeout(150);
    eq(await p.locator('#a-code input').count(), 6, 'code step: six boxes');
    const su = W.log.find((x) => x[0] === 'signup');
    ok(!!su, 'sign-up sent');
    const d = su ? su[1].data || {} : {};
    eq(d.username, 'Nikandros', 'sign-up metadata: username');
    eq(d.birth_date, '2000-03-05', 'sign-up metadata: birth date');
    eq(d.gender, 'male', 'sign-up metadata: gender');
    eq(d.terms_version, '2026-10-30', 'sign-up metadata: terms version');
    await shot(p, 'register-code-en');
    // the resend countdown ticks every second; what is typed in the boxes must stay
    await p.locator('#a-code input').first().click(); await p.keyboard.type('12'); await p.waitForTimeout(2300);
    eq(await p.evaluate(() => [...document.querySelectorAll('#a-code input')].map((x) => x.value).join('') + '|' + [...document.querySelectorAll('#a-code input')].indexOf(document.activeElement)), '12|2', 'code boxes keep typing and focus through the countdown');
    ok(/\d/.test(await p.locator('#view form .frow button').first().innerText()), 'resend button counts down');
    for (const b of await p.locator('#a-code input').all()) await b.fill('');
    await p.locator('#a-code input').first().click(); await p.keyboard.type('111111'); await p.waitForSelector('#view .fmsg.err', { timeout: 8000 }).catch(() => null);
    ok(await p.locator('#view .fmsg.err').isVisible(), 'wrong code: error');
    await p.waitForFunction(() => document.querySelectorAll('#a-code input:not([disabled])').length === 6);
    for (const b of await p.locator('#a-code input').all()) await b.fill('');
    await p.locator('#a-code input').first().click(); await p.keyboard.type('123456', { delay: 30 });
    await p.waitForSelector('.uhead h1', { timeout: 6000 }).catch(() => null);
    ok((await p.locator('.uhead h1').innerText().catch(() => '')).includes('Nikandros'), 'right code: signed in on own page');
    await ctx.close();
  }

  // ---------- 5. replying, a new topic, the word filter ----------
  console.log('posting and the word filter');
  {
    const { W } = world(); const ctx = await newContext(browser, W); const p = await page(ctx);
    await signIn(p);
    const tp = W.topics[0];
    await go(p, `forum.html?t=${tp.id}`);
    await p.fill('#reply-body', 'Found it, thank you both!'); await p.click('.reply-box button[type=submit]'); await p.waitForFunction(() => document.querySelectorAll('article.post').length === 4, null, { timeout: 8000 }).catch(() => null); await p.waitForTimeout(150);
    eq(await p.locator('article.post').count(), 4, 'reply posted: 4 posts');
    ok((await p.locator('article.post').last().innerText()).includes('Found it, thank you both!'), 'reply text shown');
    eq(W.posts.filter((x) => x.topic_id === tp.id).length, 4, 'reply stored');
    // the instant check
    await p.fill('#reply-body', 'what a bastard'); await p.waitForTimeout(150);
    eq((await p.locator('#reply-body-err').innerText()).trim(), FT.en.filter_live, 'reply: instant word check');
    // a new topic
    await go(p, 'forum.html?new=quests');
    await p.fill('#new-title', 'A question about the oracle'); await p.fill('#new-body', 'Is this bullshit or a real quest?'); await p.waitForTimeout(150);
    eq((await p.locator('#new-body-err').innerText()).trim(), FT.en.filter_live, 'new topic: instant word check');
    const before = W.calls.filter((c) => c.includes('forum_new_topic')).length;
    await p.click('#view form.fform button[type=submit]'); await p.waitForTimeout(300);
    eq((await p.locator('#new-msg').innerText()).trim(), FT.en.e_PROFANITY, 'new topic: refused before sending');
    eq(W.calls.filter((c) => c.includes('forum_new_topic')).length, before, 'nothing sent to the server');
    await shot(p, 'new-topic-profanity-en');
    // a word only the server knows: the server's refusal comes back in the page's words
    await p.evaluate(() => { document.querySelector('#new-msg').textContent = ''; }); await p.fill('#new-body', 'A grumblefrog stole my sandals.'); await p.click('#view form.fform button[type=submit]'); await p.waitForFunction(() => document.querySelector('#new-msg')?.textContent.trim(), null, { timeout: 8000 }).catch(() => null);
    eq(W.calls.filter((c) => c.includes('forum_new_topic')).length, before + 1, 'server-only word: sent');
    eq((await p.locator('#new-msg').innerText()).trim(), FT.en.e_PROFANITY, "server-only word: the server's PROFANITY shown translated");
    // a clean topic goes through and opens
    await p.fill('#new-body', 'Where is the oracle of the second quest?'); await p.click('#view form.fform button[type=submit]'); await p.waitForURL(/[?&]t=\d+/, { timeout: 8000 }).catch(() => null); await p.waitForLoadState('networkidle'); await p.waitForTimeout(300);
    ok(/[?&]t=\d+/.test(p.url()), 'clean topic: opened');
    eq((await p.locator('#view h1').first().innerText()).trim(), 'A question about the oracle', 'clean topic: title');
    await ctx.close();
  }

  // ---------- 6. languages: the words change, the layout does not ----------
  console.log('languages and layout');
  {
    const { W, a } = world(); const ctx = await newContext(browser, W); const p = await page(ctx);
    for (const lang of ['en', 'he', 'es']) {
      await go(p, 'forum.html', lang);
      eq(await p.locator('html').getAttribute('lang'), lang, `${lang}: html lang`);
      eq(await p.locator('html').getAttribute('dir'), 'ltr', `${lang}: still ltr`);
      eq((await p.locator('#view h1').first().innerText()).trim(), FT[lang].f_title, `${lang}: forum title`);
      eq((await p.locator('[data-nav=forum]').first().innerText()).trim(), FT[lang].nav_forum, `${lang}: nav Forum`);
      await go(p, 'account.html', lang);
      eq((await p.locator('#view form button[type=submit]').innerText()).trim(), AT[lang].g_signin_btn, `${lang}: sign-in button`);
    }
    const boxes = async (url, lang, sels) => {
      await go(p, url, lang); const out = {};
      for (const s of sels) { const b = await p.locator(s).first().boundingBox({ timeout: 3000 }).catch(() => null); out[s] = b && { x: Math.round(b.x), w: Math.round(b.width) }; }
      return out;
    };
    const same = (A, B, what) => {
      const bad = Object.keys(A).filter((k) => !A[k] || !B[k] || Math.abs(A[k].x - B[k].x) > 1 || Math.abs(A[k].w - B[k].w) > 1);
      ok(bad.length === 0, `${what}: same layout in he and en`, bad.map((k) => `${k} en=${JSON.stringify(A[k])} he=${JSON.stringify(B[k])}`).join('; '));
    };
    const tp = W.topics[0];
    const pages = [
      ['forum.html', ['header', '.fgrid', '.fmain', '.fgrid aside', '.crow', '.crow .cmain', '.crow .clast']],
      [`forum.html?t=${tp.id}`, ['.crumbs', '.posts', 'article.post', 'article.post .acard', 'article.post .pmain', '.signin-box']],
      ['forum.html?view=ranks', ['.ranks', '.ranks tbody tr', '.ranks td.n', '.ranks td.p']],
      ['account.html', ['.acct-grid', '.acct-box', '#a-identifier', '#view form button[type=submit]']],
      [`user.html?u=${a.username}`, ['.fgrid', '.uhead', '.ustats']],
    ];
    for (const [url, sels] of pages) same(await boxes(url, 'en', sels), await boxes(url, 'he', sels), url);
    // Hebrew screenshots of the signed-out pages
    await go(p, 'forum.html', 'he'); await shot(p, 'forum-home-he');
    await go(p, `forum.html?t=${tp.id}`, 'he'); await shot(p, 'topic-he');
    await go(p, 'forum.html?view=ranks', 'he'); await shot(p, 'ranks-he');
    await go(p, 'account.html', 'he'); await shot(p, 'account-signin-he');
    await go(p, 'forum.html', 'en'); await shot(p, 'forum-home-en');
    await go(p, `forum.html?t=${tp.id}`, 'en'); await shot(p, 'topic-en');
    await go(p, 'forum.html?view=ranks', 'en'); await shot(p, 'ranks-en');
    await go(p, 'account.html', 'en'); await shot(p, 'account-signin-en');
    await ctx.close();
  }

  // ---------- 7. the remaining Hebrew screenshots ----------
  if (SHOTS) {
    const { W } = world(); const ctx = await newContext(browser, W); const p = await page(ctx);
    await go(p, 'account.html?mode=register', 'he');
    await p.fill('#a-inviteCode', 'ABCD2345'); await p.fill('#a-username', 'Nikandros'); await p.fill('#a-email', 'nik@example.com'); // (the invitation code came with the new site, 11.2026)
    await p.fill('#a-password', 'Strong-pass-77'); await p.fill('#a-password2', 'Strong-pass-77');
    await p.selectOption('select[name=day]', '05'); await p.selectOption('select[name=month]', '03'); await p.selectOption('select[name=year]', '2000');
    await p.check('input[name=gender][value=male]'); await p.check('#a-acceptTerms');
    await p.click('#view form button[type=submit]'); await p.waitForSelector('#a-code input', { timeout: 8000 }).catch(() => null); await p.waitForTimeout(150); await shot(p, 'register-code-he');
    await ctx.close();
    for (const lang of ['en', 'he']) {
      const { W: W2 } = world(); const c2 = await newContext(browser, W2); const q = await page(c2);
      await signIn(q, 'Ariadne', 'Secret-pass-1', lang); await q.waitForTimeout(300); await shot(q, `user-page-own-${lang}`);
      await go(q, 'forum.html?new=quests', lang);
      await q.fill('#new-title', lang === 'he' ? 'שאלה על האורקל' : 'A question about the oracle');
      await q.fill('#new-body', lang === 'he' ? 'זה בולשיט או משימה אמיתית? bullshit' : 'Is this bullshit or a real quest?');
      await q.click('#view form.fform button[type=submit]'); await q.waitForTimeout(300);
      if (lang === 'he') { await shot(q, 'new-topic-profanity-he'); }
      await c2.close();
    }
  }

  eq(errors.length, 0, 'no page errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
} finally {
  await browser.close(); srv.close();
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
