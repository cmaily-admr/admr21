/* =========================================================
   ADMR Côte-d'Or — Pages « journée » (recrutement, bénévolat)
   Script commun : barre, rail, apparitions, vidéos, formulaires.
   Chaque bloc ne s'active que si les éléments existent sur la page.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- barre du haut : fond clair après le hero ---------- */
  var barre = document.getElementById('barre');
  function majBarre() { if (barre) barre.classList.toggle('plein', window.scrollY > window.innerHeight * 0.75); }

  /* ---------- rail de la journée : progression au défilement ---------- */
  var rail = document.getElementById('rail');
  var jour = document.getElementById('journee');
  function majRail() {
    if (!rail || !jour) return;
    var r = jour.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, (window.innerHeight * 0.6 - r.top) / r.height));
    rail.style.setProperty('--prog', (p * 100) + '%');
  }
  window.addEventListener('scroll', function () { majBarre(); majRail(); }, { passive: true });
  majBarre(); majRail();

  /* ---------- apparitions + tracés animés ---------- */
  var cibles = document.querySelectorAll('.fade:not(.on), .draw');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
      });
    }, { threshold: 0.2 });
    cibles.forEach(function (el) { io.observe(el); });
  } else {
    cibles.forEach(function (el) { el.classList.add('on'); });
  }

  /* ---------- vidéos : lecture dans une fenêtre (youtube-nocookie) ---------- */
  var lb = document.getElementById('lb');
  var cadre = document.getElementById('lb-cadre');
  var dernierBouton = null;
  function ouvrirVideo(id, bouton) {
    dernierBouton = bouton;
    cadre.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
      '?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen title="Témoignage ADMR"></iframe>';
    lb.classList.add('ouvert');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-fermer').focus();
  }
  function fermerVideo() {
    if (!lb || !lb.classList.contains('ouvert')) return;
    lb.classList.remove('ouvert');
    lb.setAttribute('aria-hidden', 'true');
    cadre.innerHTML = '';
    document.body.style.overflow = '';
    if (dernierBouton) dernierBouton.focus();
  }
  document.querySelectorAll('.vid[data-id]').forEach(function (b) {
    b.addEventListener('click', function () { ouvrirVideo(b.dataset.id, b); });
  });
  if (lb) lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb-fermer')) fermerVideo();
  });

  /* ---------- antennes : la recherche par commune est dans js/recherche-antennes.js ---------- */

  /* ---------- formulaires : nom du fichier + confirmation ---------- */
  var fichier = document.getElementById('cv-file');
  var nomFichier = document.getElementById('cv-nom-fichier');
  if (fichier) {
    fichier.addEventListener('change', function () {
      nomFichier.textContent = fichier.files.length ? fichier.files[0].name : 'Aucun fichier choisi';
    });
  }
  var modal = document.getElementById('merci-modal');
  function ouvrirMerci() { modal.classList.add('ouvert'); modal.setAttribute('aria-hidden', 'false'); modal.querySelector('.btn').focus(); }
  function fermerMerci() { if (!modal) return; modal.classList.remove('ouvert'); modal.setAttribute('aria-hidden', 'true'); }
  if (modal) modal.querySelectorAll('[data-fermer]').forEach(function (el) { el.addEventListener('click', fermerMerci); });
  document.querySelectorAll('.form-fs').forEach(function (form) {
    form.addEventListener('submit', function () {
      var btn = form.querySelector('button[type="submit"]');
      var texte = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';
      setTimeout(function () {
        ouvrirMerci();
        form.reset();
        if (nomFichier) nomFichier.textContent = 'Aucun fichier choisi';
        btn.disabled = false;
        btn.textContent = texte;
      }, 1200);
    });
  });

  /* ---------- touche Échap : ferme les fenêtres ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { fermerVideo(); fermerMerci(); }
  });
})();
