// The site's footer, the same on every page (Roy 2.11): the logotype, the social icons, the line, the links and the
// rights. Each page has an empty <footer class="sitefoot"></footer>; this fills it and follows the language globe.
(() => {
  const T = {
    he: { foot: 'משחק הרפתקאות חינמי ל-Windows (ול-Mac בבטא). המשגר מתקין ומעדכן אותו.', home: 'דף הבית', privacy: 'פרטיות', terms: 'תנאי שימוש', releases: 'כל ההורדות', top: 'למעלה', soon: 'בקרוב' },
    en: { foot: 'A free adventure game for Windows (and Mac, in beta). The launcher installs and updates it.', home: 'Home', privacy: 'Privacy', terms: 'Terms', releases: 'All downloads', top: 'Back to top', soon: 'Coming soon' },
    es: { foot: 'Un juego de aventuras gratuito para Windows (y Mac, en beta). El launcher lo instala y lo actualiza.', home: 'Inicio', privacy: 'Privacidad', terms: 'Condiciones', releases: 'Todas las descargas', top: 'Volver arriba', soon: 'Próximamente' },
  };
  const SVG = {"x": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z\"/></svg>", "instagram": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4.2\"/><circle cx=\"17.4\" cy=\"6.6\" r=\"1.25\" class=\"dot\"/></svg>", "facebook": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z\"/></svg>"};
  const NAMES = { x: 'X', instagram: 'Instagram', facebook: 'Facebook' };
  const isHome = /(^|\/)(index\.html)?$/.test(location.pathname);
  function draw(L) {
    const t = T[L] || T.en, R = (s) => (L === 'he' ? '\u200f' : '') + s, SOC = (window.SITE || {}).SOCIAL || {};
    for (const f of document.querySelectorAll('footer.sitefoot')) {
      const social = Object.keys(SVG).map((k) => SOC[k] ? `<a href="${SOC[k]}" target="_blank" rel="noopener" aria-label="${NAMES[k]}" title="${NAMES[k]}">${SVG[k]}</a>`
        : `<a class="off" aria-disabled="true" aria-label="${NAMES[k]}: ${t.soon}" title="${NAMES[k]}: ${t.soon}">${SVG[k]}</a>`).join('');
      f.innerHTML = `<div class="fline" aria-hidden="true"></div><div class="in wrap">
        <a href="index.html" aria-label="The Serpent's Oath"><img src="assets/r3/logotype.webp" alt="The Serpent's Oath" width="209" height="150"></a>
        <nav class="social" aria-label="Social">${social}</nav>
        <p>${R(t.foot)}</p>
        <p class="links">${isHome ? '' : `<a href="index.html">${R(t.home)}</a>`}<a href="privacy.html">${R(t.privacy)}</a><a href="terms.html">${R(t.terms)}</a><a href="https://github.com/serpents-oath/serpents-oath.github.io/releases" rel="noopener">${R(t.releases)}</a><a href="#" data-top>${R(t.top)}</a></p>
      </div><p class="rights" aria-label="Copyright"><span lang="he">© 2026 · כל הזכויות שמורות ל-The Serpent's Oath</span><span lang="en">© 2026 The Serpent's Oath. All rights reserved.</span><span lang="es">© 2026 The Serpent's Oath. Todos los derechos reservados.</span></p>`;
    }
  }
  document.addEventListener('click', (e) => { if (e.target.closest('footer.sitefoot [data-top]')) { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); } });
  // the essential-cookies note: information only (nothing to accept), a quiet close, and it stays closed
  const COOKIE = { he: ['האתר משתמש בעוגיות חיוניות בלבד, כדי לשמור על החיבור לחשבון. אין צורך לאשר דבר.', 'סגירה'], en: ['This site uses essential cookies only, to keep you signed in. There is nothing to approve.', 'Close'], es: ['Este sitio solo usa cookies esenciales, para mantener tu sesión iniciada. No hay nada que aceptar.', 'Cerrar'] };
  let note = null;
  function cookie(L) {
    let shut = false; try { shut = localStorage.getItem('so-cookie-note') === '1'; } catch (e) { /* storage off */ }
    if (shut || document.getElementById('cookie')) return;
    if (!note) {
      note = document.createElement('aside'); note.className = 'cookie'; note.id = 'cookie-note'; note.setAttribute('aria-live', 'polite');
      const p = document.createElement('p'), x = document.createElement('button'); x.type = 'button'; x.textContent = '×';
      x.addEventListener('click', () => { note.hidden = true; try { localStorage.setItem('so-cookie-note', '1'); } catch (e) { /* storage off */ } });
      note.append(p, x); document.body.append(note);
    }
    const c = COOKIE[L] || COOKIE.en; note.firstChild.textContent = (L === 'he' ? '\u200f' : '') + c[0]; note.lastChild.setAttribute('aria-label', c[1]);
  }
  cookie(window.SoLang ? SoLang.pick() : 'en');
  document.addEventListener('so-lang', (e) => cookie(e.detail));
  draw(window.SoLang ? SoLang.pick() : 'en');
  document.addEventListener('so-lang', (e) => draw(e.detail));
})();
