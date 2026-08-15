/* site.js — shared chrome for AfroUp inner pages.
   Usage: <body data-active="inicio"> … <main class="content">…</main> <script src="site.js"></script>

   TEMPORARY (emergency slice): sidebar/footer/mobile tab only expose Inicio, contact, and socials.
   Restore the full Aprende / Comunidad / Donar chrome from design/site.js when those pages exist. */
(function () {
  var P = {
    home: '/',
    email: 'hi@afroup.com',
    instagram: 'https://www.instagram.com/afroup',
    youtube: 'https://www.youtube.com/@afroup',
    threads: 'https://www.threads.net/@afroup',
    x: 'https://x.com/afroup',
    tiktok: 'https://www.tiktok.com/@afroup',
    facebook: 'https://www.facebook.com/afroup'
  };
  window.AFROUP_PATHS = P;

  var ICONS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<symbol id="ic-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol>' +
    '<symbol id="ic-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/></symbol>' +
    '<symbol id="ic-heart" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z"/></symbol>' +
    '<symbol id="ic-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>' +
    '<symbol id="ic-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>' +
    '<symbol id="ic-ig" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none"/></symbol>' +
    '<symbol id="ic-mail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></symbol>' +
    '<symbol id="ic-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></symbol>' +
    '<symbol id="ic-yt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="m10 9 6 3-6 3z" fill="currentColor" stroke="none"/></symbol>' +
    '<symbol id="ic-threads" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8.5 9.5c.6-2.2 2.4-3.5 4.7-3.5 3 0 4.8 1.8 4.8 4.6 0 4.6-4 6.9-7.5 6.9-2.2 0-3.8-.8-4.5-2"/><path d="M7.2 12.2c1.4 3.6 7.6 3.4 8.4-.4.5-2.3-1-3.6-2.8-3.2-1.6.4-2.4 2-2.1 3.6.3 1.4 1.5 2.3 2.8 2.3 1.6 0 2.7-1 2.7-1"/></symbol>' +
    '<symbol id="ic-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m5 5 14 14M19 5 5 19"/></symbol>' +
    '<symbol id="ic-tt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 7.2V15a4 4 0 1 1-4-4"/><path d="M14 7.2A6 6 0 0 0 18 8.5V11a8 8 0 0 1-4-1.1"/></symbol>' +
    '<symbol id="ic-fb" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.2l.8-3H13V9c0-.6.4-1 1-1z"/></symbol>' +
    '<symbol id="ic-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></symbol>' +
    '</defs></svg>';

  function navI(href, key, act, inner) {
    return '<a class="nav-i' + (key === act ? ' on' : '') + '" href="' + href + '">' + inner + '</a>';
  }
  function ic(name, sz) {
    return '<svg class="ic"' + (sz ? ' style="width:' + sz + 'px;height:' + sz + 'px"' : '') + '><use href="#' + name + '"/></svg>';
  }
  function socialNav(href, label, icon) {
    return '<a class="nav-i" href="' + href + '" target="_blank" rel="noopener noreferrer">' + ic(icon) + ' ' + label + '</a>';
  }

  function sideHTML(act) {
    return '<aside class="side">' +
      '<a class="brand" href="' + P.home + '"><img src="assets/logo-black.png" alt="AfroUp" /></a>' +
      navI(P.home, 'inicio', act, ic('ic-home') + ' Inicio') +
      '<div class="nav-h">Contacto</div>' +
      socialNav('mailto:' + P.email, P.email, 'ic-mail') +
      '<div class="nav-h">Síguenos</div>' +
      socialNav(P.instagram, 'Instagram', 'ic-ig') +
      socialNav(P.youtube, 'YouTube', 'ic-yt') +
      socialNav(P.threads, 'Threads', 'ic-threads') +
      socialNav(P.x, 'X', 'ic-x') +
      socialNav(P.tiktok, 'TikTok', 'ic-tt') +
      socialNav(P.facebook, 'Facebook', 'ic-fb') +
      '<div class="spacer"></div>' +
      '</aside>';
  }
  function topbarHTML() {
    return '<div class="topbar"><div class="wrap"><div class="inner">' +
      '<button class="btn btn-ghost btn-sm burger" aria-label="Menú">' + ic('ic-menu', 20) + '</button>' +
      '<form class="search" action="/">' + ic('ic-search') + '<input type="search" name="q" placeholder="Busca ayudas, lugares o contactos…" /></form>' +
      '<span class="mantra">Conocimiento = poder</span>' +
      '</div></div></div>';
  }
  function footHTML() {
    return '<footer class="foot"><div class="wrap"><div class="inner">' +
      '<a class="brand-foot" href="' + P.home + '"><img src="assets/logo-white.png" alt="AfroUp" /></a>' +
      '</div></div></footer>';
  }
  function mtabHTML(act) {
    return '<nav class="mtab">' +
      '<a' + (act === 'inicio' ? ' class="on"' : '') + ' href="' + P.home + '">' + ic('ic-home') + ' Inicio</a>' +
      '</nav>';
  }

  function init() {
    var act = document.body.getAttribute('data-active') || '';
    var main = document.querySelector('main.content');
    if (!main) return;
    document.body.insertAdjacentHTML('afterbegin', ICONS);
    var app = document.createElement('div');
    app.className = 'app';
    app.innerHTML = sideHTML(act) + '<div class="main">' + topbarHTML() + '<div class="page-slot"></div>' + footHTML() + '</div>';
    app.querySelector('.page-slot').replaceWith(main);
    document.body.appendChild(app);
    document.body.insertAdjacentHTML('beforeend', mtabHTML(act));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
