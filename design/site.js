/* site.js — shared chrome for AfroUp inner pages.
   Usage: <body data-active="tienda"> … <main class="content">…</main> <script src="site.js"></script> */
(function () {
  var P = {
    home: 'AfroUp Home (diseño).html',
    buscar: 'AfroUp Busqueda.html',
    cat: 'AfroUp Categoria Africa.html',
    articulo: 'AfroUp Articulo.html',
    tienda: 'AfroUp Tienda.html',
    producto: 'AfroUp Producto.html',
    carrito: 'AfroUp Carrito.html',
    recursos: 'AfroUp Recursos.html',
    donar: 'AfroUp Donacion.html',
    nosotros: 'AfroUp Nosotros.html',
    contacto: 'AfroUp Contacto.html',
    apoyanos: 'AfroUp Apoyanos.html',
    proyectos: 'AfroUp Proyectos.html',
    proyecto: 'AfroUp Proyecto (detalle).html',
    emprendedores: 'AfroUp Emprendedores.html',
    emprendimiento: 'AfroUp Emprendimiento (detalle).html',
    referentes: 'AfroUp Referentes.html',
    referente: 'AfroUp Referente (detalle).html',
    colabora: 'AfroUp Colabora.html',
    mapa: 'AfroUp Mapa del sitio.html'
  };
  window.AFROUP_PATHS = P;

  var ICONS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<symbol id="ic-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol>' +
    '<symbol id="ic-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/></symbol>' +
    '<symbol id="ic-bag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/></symbol>' +
    '<symbol id="ic-book2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5v15l4-2 4 2 4-2 4 2V5"/><path d="M8 8h8M8 12h8"/></symbol>' +
    '<symbol id="ic-users" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-5-5.9"/></symbol>' +
    '<symbol id="ic-bookmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 4h12v16l-6-4-6 4z"/></symbol>' +
    '<symbol id="ic-heart" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z"/></symbol>' +
    '<symbol id="ic-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>' +
    '<symbol id="ic-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>' +
    '<symbol id="ic-play" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></symbol>' +
    '<symbol id="ic-ig" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none"/></symbol>' +
    '<symbol id="ic-dl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 11l5 5 5-5"/><path d="M5 20h14"/></symbol>' +
    '<symbol id="ic-mail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></symbol>' +
    '<symbol id="ic-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></symbol>' +
    '<symbol id="ic-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8 11 8-4M8 13l8 4"/></symbol>' +
    '</defs></svg>';

  function navI(href, key, act, inner) {
    return '<a class="nav-i' + (key === act ? ' on' : '') + '" href="' + href + '">' + inner + '</a>';
  }
  function ic(name, sz) {
    return '<svg class="ic"' + (sz ? ' style="width:' + sz + 'px;height:' + sz + 'px"' : '') + '><use href="#' + name + '"/></svg>';
  }
  function dot(c) { return '<span class="dot" style="background:var(--' + c + ')"></span>'; }

  function sideHTML(act) {
    return '<aside class="side">' +
      '<a class="brand" href="' + P.home + '"><img src="assets/logo-black.png" alt="AfroUp" /></a>' +
      navI(P.home, 'inicio', act, ic('ic-home') + ' Inicio') +
      navI(P.buscar, 'buscar', act, ic('ic-search') + ' Buscar') +
      '<div class="nav-h">Aprende</div>' +
      navI(P.cat, 'africa', act, dot('azul') + ' África') +
      navI(P.cat, 'diaspora', act, dot('cian') + ' Diáspora') +
      navI(P.cat, 'antirracismo', act, dot('oro') + ' Antirracismo') +
      navI(P.cat, 'historia', act, dot('oro') + ' Historia') +
      navI(P.cat, 'estetica', act, dot('cian') + ' Estética') +
      navI(P.cat, 'actualidad', act, dot('azul') + ' Actualidad') +
      '<div class="nav-h">Comunidad</div>' +
      navI(P.tienda, 'tienda', act, ic('ic-bag') + ' Tienda') +
      navI(P.recursos, 'recursos', act, ic('ic-book2') + ' Recursos') +
      navI(P.proyectos, 'comunidad', act, ic('ic-users') + ' Comunidad') +
      navI('#', 'guardados', act, ic('ic-bookmark') + ' Guardados') +
      '<div class="spacer"></div>' +
      '<div class="lang"><button class="on">ES</button><button>EN</button></div>' +
      '<a class="btn btn-oro btn-block" href="' + P.donar + '">' + ic('ic-heart', 18) + ' Haz tu Donación</a>' +
      '</aside>';
  }
  function topbarHTML() {
    return '<div class="topbar"><div class="wrap"><div class="inner">' +
      '<button class="btn btn-ghost btn-sm burger" aria-label="Menú">' + ic('ic-menu', 20) + '</button>' +
      '<form class="search" action="AfroUp Busqueda.html">' + ic('ic-search') + '<input type="search" name="q" placeholder="Busca temas, artículos, autores…" /></form>' +
      '<span class="mantra">Conocimiento = poder</span>' +
      '</div></div></div>';
  }
  function footHTML() {
    function li(href, t) { return '<li><a href="' + href + '">' + t + '</a></li>'; }
    return '<footer class="foot"><div class="pat"></div><div class="wrap"><div class="inner">' +
      '<div class="top"><img src="assets/logo-white.png" alt="AfroUp" />' +
      '<a class="btn btn-oro" href="' + P.donar + '">' + ic('ic-heart', 18) + ' Haz tu Donación</a></div>' +
      '<div class="cols">' +
      '<div><h5>Aprende</h5><ul>' + li(P.cat, 'África') + li(P.cat, 'Diáspora') + li(P.cat, 'Antirracismo') + li(P.cat, 'Historia') + li(P.cat, 'Estética') + li(P.cat, 'Actualidad') + '</ul></div>' +
      '<div><h5>AfroUp</h5><ul>' + li(P.tienda, 'Tienda') + li(P.recursos, 'Recursos') + li(P.nosotros, 'Nosotros') + li(P.contacto, 'Contacto') + li(P.apoyanos, 'Apóyanos') + '</ul></div>' +
      '<div><h5>Comunidad</h5><ul>' + li(P.proyectos, 'Proyectos') + li(P.emprendedores, 'Emprendedores') + li(P.referentes, 'Referentes') + li(P.colabora, 'Colabora') + '</ul></div>' +
      '<div><h5>Contáctanos</h5><ul>' + li(P.contacto, 'hello@afroup.org') + li(P.contacto, '+57 320 7146') + '</ul></div>' +
      '<div><h5>Síguenos</h5><ul><li><a>Instagram</a></li><li><a>TikTok</a></li><li><a>YouTube</a></li><li><a>Facebook</a></li></ul></div>' +
      '</div></div></div></footer>';
  }
  function mtabHTML(act) {
    function t(href, key, icon, lbl) { return '<a' + (key === act ? ' class="on"' : '') + ' href="' + href + '">' + ic(icon) + ' ' + lbl + '</a>'; }
    return '<nav class="mtab">' +
      t(P.home, 'inicio', 'ic-home', 'Inicio') + t(P.buscar, 'buscar', 'ic-search', 'Buscar') +
      t(P.tienda, 'tienda', 'ic-bag', 'Tienda') + t('#', 'guardados', 'ic-bookmark', 'Guardados') +
      t(P.donar, 'donar', 'ic-heart', 'Donar') + '</nav>';
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

    /* generic chip toggle (within each .chips group) */
    document.querySelectorAll('.chips').forEach(function (g) {
      g.addEventListener('click', function (e) {
        var c = e.target.closest('.chip'); if (!c || !g.contains(c)) return;
        g.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
      });
    });
    /* qty steppers */
    document.querySelectorAll('.qty').forEach(function (q) {
      var v = q.querySelector('.v');
      q.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b || !v) return;
        var n = parseInt(v.textContent, 10) || 1;
        v.textContent = Math.max(1, n + (b.dataset.d === '-' ? -1 : 1));
      });
    });
    /* segmented + amount pills */
    document.querySelectorAll('.seg').forEach(function (s) {
      s.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        s.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
      });
    });
    document.querySelectorAll('.amounts').forEach(function (s) {
      s.addEventListener('click', function (e) {
        var b = e.target.closest('.amt'); if (!b) return;
        s.querySelectorAll('.amt').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
