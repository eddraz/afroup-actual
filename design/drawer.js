/* drawer.js — mobile menu drawer. Include AFTER site.js (or after inline .side markup). */
(function () {
  function init() {
    var side = document.querySelector('.app .side') || document.querySelector('.side');
    if (!side || document.querySelector('.drawer')) return;
    var drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.appendChild(side.cloneNode(true));
    drawer.insertAdjacentHTML('afterbegin', '<button class="drawer-close" aria-label="Cerrar">✕</button>');
    var scrim = document.createElement('div');
    scrim.className = 'scrim';
    document.body.appendChild(scrim);
    document.body.appendChild(drawer);
    function close() { document.body.classList.remove('drawer-open'); }
    document.querySelectorAll('.burger').forEach(function (b) {
      b.addEventListener('click', function () { document.body.classList.toggle('drawer-open'); });
    });
    scrim.addEventListener('click', close);
    drawer.querySelector('.drawer-close').addEventListener('click', close);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 0);
})();
