/* =========================================================
   ADMR Côte-d'Or — Page recrutement « Une journée avec l'ADMR »
   ========================================================= */
(function () {
  'use strict';

  /* ---------- barre du haut : fond clair après le hero ---------- */
  var barre = document.getElementById('barre');
  function majBarre() { barre.classList.toggle('plein', window.scrollY > window.innerHeight * 0.75); }

  /* ---------- rail de la journée : progression au défilement ---------- */
  var rail = document.getElementById('rail');
  var jour = document.getElementById('journee');
  function majRail() {
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
    if (!lb.classList.contains('ouvert')) return;
    lb.classList.remove('ouvert');
    lb.setAttribute('aria-hidden', 'true');
    cadre.innerHTML = '';
    document.body.style.overflow = '';
    if (dernierBouton) dernierBouton.focus();
  }
  document.querySelectorAll('.vid[data-id]').forEach(function (b) {
    b.addEventListener('click', function () { ouvrirVideo(b.dataset.id, b); });
  });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb-fermer')) fermerVideo();
  });

  /* ---------- antennes : recherche par commune ou code postal ----------
     Données : js/communes-admr21.js  → [nom, code postal, code secteur]
     Chaque carte .antenne porte data-code = son code secteur.            */
  var filtre = document.getElementById('filtre-antennes');
  var listeSugg = document.getElementById('suggestions');
  var effacer = document.getElementById('effacer-recherche');
  var resultat = document.getElementById('resultat-commune');
  var aucune = document.getElementById('aucune-antenne');
  var grille = document.getElementById('grille-antennes');
  var voirTout = document.getElementById('voir-antennes');
  var cartes = Array.prototype.slice.call(document.querySelectorAll('.antenne'));
  var MAX_SUGG = 8;

  // minuscules, sans accents, tirets et apostrophes → espaces, « st » → « saint »
  function norm(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[-'’]/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/\bste\b/g, 'sainte').replace(/\bst\b/g, 'saint');
  }
  function echapper(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // antennes : code secteur → liste de noms de ville (Montbard + Semur partagent le code 3)
  var villesParCode = {};
  cartes.forEach(function (c) {
    c._texte = norm(c.textContent);
    (villesParCode[c.dataset.code] = villesParCode[c.dataset.code] || []).push(c.querySelector('h4').textContent);
  });

  // index des communes
  var communes = (window.COMMUNES_ADMR21 || []).map(function (r) {
    return { nom: r[0], cp: r[1], code: String(r[2]), n: norm(r[0]) };
  });

  if (voirTout) voirTout.addEventListener('click', function () { grille.classList.remove('replie'); });

  function chercher(q) {
    if (!q) return [];
    var chiffres = /^\d+$/.test(q);
    var debut = [], mot = [], ailleurs = [];
    communes.forEach(function (c) {
      if (chiffres) { if (c.cp.indexOf(q) === 0) debut.push(c); return; }
      if (c.n.indexOf(q) === 0) debut.push(c);
      else if (c.n.indexOf(' ' + q) !== -1) mot.push(c);
      else if (q.length > 2 && c.n.indexOf(q) !== -1) ailleurs.push(c);
    });
    return debut.concat(mot, ailleurs);
  }

  function libelleAntennes(code) {
    var v = villesParCode[code] || [];
    return v.length > 1 ? 'antennes de ' + v.join(' et de ') : 'antenne de ' + (v[0] || '?');
  }

  // affiche seulement les cartes dont le code est dans « codes » (null = toutes)
  function afficherCartes(codes, qTexte) {
    var n = 0;
    cartes.forEach(function (c) {
      var ok = !codes || codes[c.dataset.code] || (qTexte && c._texte.indexOf(qTexte) !== -1);
      c.hidden = !ok;
      if (ok) n++;
    });
    aucune.classList.toggle('visible', n === 0);
    return n;
  }

  var suggCourantes = [], actif = -1;
  function fermerSugg() {
    listeSugg.hidden = true; listeSugg.innerHTML = ''; actif = -1;
    filtre.setAttribute('aria-expanded', 'false'); filtre.removeAttribute('aria-activedescendant');
  }
  function majActif(i) {
    var items = listeSugg.children;
    if (!items.length) return;
    actif = (i + items.length) % items.length;
    for (var k = 0; k < items.length; k++) items[k].setAttribute('aria-selected', k === actif ? 'true' : 'false');
    filtre.setAttribute('aria-activedescendant', items[actif].id);
    items[actif].scrollIntoView({ block: 'nearest' });
  }
  function ouvrirSugg(liste) {
    suggCourantes = liste.slice(0, MAX_SUGG);
    if (!suggCourantes.length) { fermerSugg(); return; }
    listeSugg.innerHTML = suggCourantes.map(function (c, i) {
      return '<li role="option" id="sugg-' + i + '" aria-selected="false" data-i="' + i + '">' +
        '<span class="s-nom">' + echapper(c.nom) + ' <small>' + c.cp + '</small></span>' +
        '<span class="s-ant">' + echapper(libelleAntennes(c.code)) + '</span></li>';
    }).join('');
    listeSugg.hidden = false; actif = -1;
    filtre.setAttribute('aria-expanded', 'true');
  }

  function choisir(c) {
    filtre.value = c.nom;
    fermerSugg();
    var codes = {}; codes[c.code] = true;
    grille.classList.remove('replie');
    afficherCartes(codes);
    var plusieurs = (villesParCode[c.code] || []).length > 1;
    resultat.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-pin"/></svg><p><b>' + echapper(c.nom) + '</b> (' + c.cp + ') dépend ' +
      (plusieurs ? 'des <b>' : 'de l\'<b>') + echapper(libelleAntennes(c.code)) + '</b>. ' +
      (plusieurs ? 'Appelez l\'une ou l\'autre&nbsp;: on vous y accueille.' : 'Appelez-la ou passez la voir&nbsp;: on vous y accueille.') + '</p>' +
      '<button type="button" class="voir-toutes">Voir toutes les antennes</button>';
    resultat.hidden = false;
    resultat.querySelector('.voir-toutes').addEventListener('click', reinitialiser);
  }

  function reinitialiser() {
    filtre.value = '';
    effacer.hidden = true;
    resultat.hidden = true;
    fermerSugg();
    afficherCartes(null);
    filtre.focus();
  }

  if (filtre) {
    filtre.addEventListener('input', function () {
      var q = norm(filtre.value);
      effacer.hidden = !filtre.value;
      resultat.hidden = true;
      if (!q) { fermerSugg(); afficherCartes(null); return; }
      grille.classList.remove('replie');
      var trouvees = chercher(q);
      // une commune écrite en entier ou un code postal complet → réponse directe
      var exactes = trouvees.filter(function (c) { return c.n === q; });
      ouvrirSugg(trouvees);
      var codes = {};
      trouvees.forEach(function (c) { codes[c.code] = true; });
      afficherCartes(codes, /^\d+$/.test(q) ? null : q);
      if (exactes.length === 1 && trouvees.length === 1) choisir(exactes[0]);
    });
    filtre.addEventListener('keydown', function (e) {
      if (listeSugg.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); majActif(actif + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); majActif(actif - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); choisir(suggCourantes[actif >= 0 ? actif : 0]); }
      else if (e.key === 'Escape') { e.stopPropagation(); fermerSugg(); }
    });
    listeSugg.addEventListener('mousedown', function (e) {
      var li = e.target.closest('li');
      if (li) { e.preventDefault(); choisir(suggCourantes[+li.dataset.i]); }
    });
    filtre.addEventListener('blur', function () { setTimeout(fermerSugg, 150); });
    effacer.addEventListener('click', reinitialiser);
  }

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
  function fermerMerci() { modal.classList.remove('ouvert'); modal.setAttribute('aria-hidden', 'true'); }
  modal.querySelectorAll('[data-fermer]').forEach(function (el) { el.addEventListener('click', fermerMerci); });
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
