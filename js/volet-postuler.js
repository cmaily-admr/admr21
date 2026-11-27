/* =========================================================
   ADMR Côte-d'Or — Volet « Je postule » (page recrutement)
   Tous les boutons « Je postule » (liens vers #candidature) ouvrent
   les deux formulaires dans un volet, sans faire défiler la page.
   Sans JavaScript, les liens mènent simplement à la section du bas.
   ========================================================= */
(function () {
  'use strict';
  var volet = document.getElementById('volet-postuler');
  var corps = volet && volet.querySelector('.volet-corps');
  var grille = document.querySelector('#candidature .cand-grille');
  if (!volet || !corps || !grille) return;

  // 1) les formulaires passent dans le volet ; à leur place, un grand bouton
  corps.appendChild(grille);
  var cta = document.createElement('div');
  cta.className = 'cand-cta fade on';
  cta.innerHTML = '<a class="btn btn-j btn-xl" href="#candidature">Je postule maintenant <svg aria-hidden="true"><use href="#i-droite"/></svg></a>' +
    '<p>CV en 1 clic ou simple demande de rappel&nbsp;: 1 minute suffit.</p>';
  var offres = document.querySelector('#candidature .offres');
  offres.parentNode.insertBefore(cta, offres);

  // 2) ouverture / fermeture
  var dernier = null;
  function ouvrir(depuis) {
    dernier = depuis || document.activeElement;
    volet.hidden = false;
    requestAnimationFrame(function () { volet.classList.add('ouvert'); });
    document.documentElement.style.overflow = 'hidden';
    var premier = volet.querySelector('input:not([type=hidden]):not(.honey):not([type=file])');
    setTimeout(function () { (volet.querySelector('.volet-x')).focus(); }, 50);
  }
  function fermer() {
    if (volet.hidden) return;
    volet.classList.remove('ouvert');
    document.documentElement.style.overflow = '';
    setTimeout(function () { volet.hidden = true; }, 280);
    if (dernier && dernier.focus) dernier.focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#candidature"]');
    if (a) { e.preventDefault(); ouvrir(a); return; }
    if (e.target.closest('[data-fermer-volet]')) fermer();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !volet.hidden && !document.querySelector('.ville-suggestions:not([hidden])')) fermer();
  });
  // garder la tabulation dans le volet
  volet.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = volet.querySelectorAll('a[href],button:not([disabled]),input:not([type=hidden]):not(.honey),[tabindex="0"]');
    f = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null || el.type === 'file'; });
    if (!f.length) return;
    var p = f[0], d = f[f.length - 1];
    if (e.shiftKey && document.activeElement === p) { e.preventDefault(); d.focus(); }
    else if (!e.shiftKey && document.activeElement === d) { e.preventDefault(); p.focus(); }
  });
  // après un envoi réussi, la fenêtre « Merci » s'ouvre : on ferme le volet
  var merci = document.getElementById('merci-modal');
  if (merci) new MutationObserver(function () { if (merci.classList.contains('ouvert')) fermer(); })
    .observe(merci, { attributes: true, attributeFilter: ['class'] });
  // lien direct vers …/recrutement#candidature : on ouvre le volet
  if (location.hash === '#candidature') setTimeout(ouvrir, 300);
})();
