// The top bar on every page: its texts in the three languages, the menu button on narrow screens, and the sign-in
// link (nav-auth.js, from the forum, swaps it for the player's name once they are signed in). Loaded after lang.js;
// it listens for the 'so-lang' event that SoLang.show sends on every language change.
(() => {
  const NAV = {
    he: { nav_game: 'המשחק', nav_lb: 'היכל התהילה', nav_upd: 'עדכונים', nav_wiki: 'ויקי', nav_comp: 'Companion', nav_forum: 'פורום', nav_account: 'כניסה', nav_dl: 'הורדה', nav_play: 'לשחק בחינם', nav_menu: 'תפריט' },
    en: { nav_game: 'The game', nav_lb: 'Hall of Fame', nav_upd: 'Updates', nav_wiki: 'Wiki', nav_comp: 'Companion', nav_forum: 'Forum', nav_account: 'Sign in', nav_dl: 'Download', nav_play: 'Play for free', nav_menu: 'Menu' },
    es: { nav_game: 'El juego', nav_lb: 'Salón de la fama', nav_upd: 'Novedades', nav_wiki: 'Wiki', nav_comp: 'Companion', nav_forum: 'Foro', nav_account: 'Entrar', nav_dl: 'Descargar', nav_play: 'Jugar gratis', nav_menu: 'Menú' },
  };
  // The 2026 bar: the logotype on the left, the links in the middle, "Play for free" and the language on the right.
  // There is no "Sign in" link any more: signing in is one step of "Play for free", and the account page is still there.
  // Once a player is signed in, nav-auth.js writes their name into the account link, which sits beside the language.
  (function shape() {
    const bar = document.querySelector('.bar .in'), nav = document.getElementById('mainnav');
    if (!bar || !nav || bar.dataset.r3) return;
    bar.dataset.r3 = '1';
    for (const im of bar.querySelectorAll('.brand img:not(.lt)')) im.remove();
    const lt = bar.querySelector('.brand .lt'); if (lt) { lt.src = 'assets/r3/logotype_bar.webp'; lt.removeAttribute('height'); }
    let tools = bar.querySelector('.tools'); if (!tools) { tools = document.createElement('div'); tools.className = 'tools'; bar.append(tools); }
    const play = nav.querySelector('.navdl'), acct = nav.querySelector('[data-nav="acct"]'), tg = document.getElementById('navtg');
    if (play) { play.className = 'playnav'; play.dataset.t = 'nav_play'; play.href = 'index.html?play=1'; tools.prepend(play); }
    if (acct) { acct.classList.add('who'); tools.prepend(acct); }
    let tg2 = tg; if (!tg2) { tg2 = document.createElement('button'); tg2.className = 'navtg'; tg2.id = 'navtg'; tg2.type = 'button'; tg2.setAttribute('aria-expanded', 'false'); tg2.setAttribute('aria-controls', 'mainnav'); tg2.append(document.createElement('i')); nav.hidden = true; }
    tools.append(tg2);
  })();
  function fill(L) {
    const t = NAV[L] || NAV.en, pre = L === 'he' ? '‏' : '';
    for (const n of document.querySelectorAll('.bar [data-t]')) { const k = n.dataset.t; if (k in t && !n.dataset.nav) n.textContent = pre + t[k]; }
    const tg = document.getElementById('navtg'); if (tg) tg.setAttribute('aria-label', t.nav_menu);
  }
  // (the Forum and Sign-in links carry data-nav: nav-auth.js paints them, with the player's name once signed in)
  const tg = document.getElementById('navtg'), nav = document.getElementById('mainnav');
  if (tg && nav) {
    tg.addEventListener('click', () => { const on = nav.hidden; nav.hidden = !on; tg.setAttribute('aria-expanded', String(on)); });
    nav.addEventListener('click', (e) => { if (e.target.closest('a') && innerWidth <= 900) { nav.hidden = true; tg.setAttribute('aria-expanded', 'false'); } });
  }
  document.addEventListener('so-lang', (e) => fill(e.detail));
  fill(document.documentElement.lang || 'en');
  window.SoBar = { fill };
})();
