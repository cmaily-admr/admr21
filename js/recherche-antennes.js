/* =========================================================
   ADMR Côte-d'Or — Recherche « Quelle antenne pour ma commune ? »
   Outil commun aux pages recrutement, bénévolat (et ménage).

   Nécessite js/communes-admr21.js chargé AVANT ce fichier.

   Balisage attendu (les classes comptent, pas les id) :
   <div data-recherche-antennes>
     <input class="ra-input">                ← champ de saisie
     <button class="ra-effacer">             ← bouton ×
     <ul class="ra-suggestions">             ← liste déroulante
     <div class="ra-resultat">               ← phrase de résultat
     <div class="ra-grille replie">          ← les cartes .antenne[data-code]
     <button class="ra-voir-tout">           ← « Voir les 22 antennes » (mobile)
     <p class="ra-aucun">                    ← message « introuvable »
   </div>

   Sur chaque carte .antenne :
     data-code="12"                (obligatoire, code secteur de la carte)
     data-referentes="Marine|06 84 05 89 03"   (facultatif : ajoute la ou les
       référentes au résultat ; plusieurs séparées par « ; »)
   ========================================================= */
(function () {
  'use strict';

  var COMMUNES = (window.COMMUNES_ADMR21 || []);
  var MAX_SUGG = 8;

  // minuscules, sans accents, tirets/apostrophes → espaces, « st » → « saint »
  function norm(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[-'’]/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/\bste\b/g, 'sainte').replace(/\bst\b/g, 'saint');
  }
  function echapper(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  var index = COMMUNES.map(function (r) { return { nom: r[0], cp: r[1], code: String(r[2]), n: norm(r[0]) }; });

  function chercher(q) {
    if (!q) return [];
    var chiffres = /^\d+$/.test(q);
    var debut = [], mot = [], ailleurs = [];
    index.forEach(function (c) {
      if (chiffres) { if (c.cp.indexOf(q) === 0) debut.push(c); return; }
      if (c.n.indexOf(q) === 0) debut.push(c);
      else if (c.n.indexOf(' ' + q) !== -1) mot.push(c);
      else if (q.length > 2 && c.n.indexOf(q) !== -1) ailleurs.push(c);
    });
    return debut.concat(mot, ailleurs);
  }

  function initialiser(zone, numero) {
    var champ = zone.querySelector('.ra-input');
    var liste = zone.querySelector('.ra-suggestions');
    var effacer = zone.querySelector('.ra-effacer');
    var resultat = zone.querySelector('.ra-resultat');
    var grille = zone.querySelector('.ra-grille');
    var voirTout = zone.querySelector('.ra-voir-tout');
    var aucune = zone.querySelector('.ra-aucun');
    if (!champ || !grille) return;

    var cartes = Array.prototype.slice.call(grille.querySelectorAll('.antenne'));
    var parCode = {};
    cartes.forEach(function (c) {
      c._texte = norm(c.textContent);
      (parCode[c.dataset.code] = parCode[c.dataset.code] || []).push(c);
    });
    function villes(code) { return (parCode[code] || []).map(function (c) { return c.querySelector('h4').textContent; }); }
    function libelle(code) {
      var v = villes(code);
      return v.length > 1 ? 'antennes de ' + v.join(' et de ') : 'antenne de ' + (v[0] || '?');
    }

    liste.id = liste.id || 'ra-suggestions-' + numero;
    champ.setAttribute('role', 'combobox');
    champ.setAttribute('aria-autocomplete', 'list');
    champ.setAttribute('aria-expanded', 'false');
    champ.setAttribute('aria-controls', liste.id);

    if (voirTout) voirTout.addEventListener('click', function () { grille.classList.remove('replie'); });

    function afficherCartes(codes, qTexte) {
      var n = 0;
      cartes.forEach(function (c) {
        var ok = !codes || codes[c.dataset.code] || (qTexte && c._texte.indexOf(qTexte) !== -1);
        c.hidden = !ok;
        if (ok) n++;
      });
      if (aucune) aucune.classList.toggle('visible', n === 0);
    }

    var sugg = [], actif = -1;
    function fermer() {
      liste.hidden = true; liste.innerHTML = ''; actif = -1;
      champ.setAttribute('aria-expanded', 'false'); champ.removeAttribute('aria-activedescendant');
    }
    function surligner(i) {
      var items = liste.children;
      if (!items.length) return;
      actif = (i + items.length) % items.length;
      for (var k = 0; k < items.length; k++) items[k].setAttribute('aria-selected', k === actif ? 'true' : 'false');
      champ.setAttribute('aria-activedescendant', items[actif].id);
      items[actif].scrollIntoView({ block: 'nearest' });
    }
    function ouvrir(trouvees) {
      sugg = trouvees.slice(0, MAX_SUGG);
      if (!sugg.length) { fermer(); return; }
      liste.innerHTML = sugg.map(function (c, i) {
        return '<li role="option" id="' + liste.id + '-' + i + '" aria-selected="false" data-i="' + i + '">' +
          '<span class="s-nom">' + echapper(c.nom) + ' <small>' + c.cp + '</small></span>' +
          '<span class="s-ant">' + echapper(libelle(c.code)) + '</span></li>';
      }).join('');
      liste.hidden = false; actif = -1;
      champ.setAttribute('aria-expanded', 'true');
    }

    function choisir(c) {
      if (!c) return;
      champ.value = c.nom;
      fermer();
      var codes = {}; codes[c.code] = true;
      grille.classList.remove('replie');
      afficherCartes(codes);
      var plusieurs = villes(c.code).length > 1;
      var html = '<svg class="ico" aria-hidden="true"><use href="#i-pin"/></svg><p><b>' + echapper(c.nom) + '</b> (' + c.cp + ') dépend ' +
        (plusieurs ? 'des <b>' : 'de l\'<b>') + echapper(libelle(c.code)) + '</b>. ' +
        (plusieurs ? 'Appelez l\'une ou l\'autre&nbsp;: on vous y accueille.' : 'Appelez-la ou passez la voir&nbsp;: on vous y accueille.');
      // référente(s) : data-referentes="Nom|06 00 00 00 00;Nom|06 …" (ou data-referente-nom / -tel)
      var carte = (parCode[c.code] || [])[0];
      var refs = [];
      if (carte && carte.dataset.referentes) {
        refs = carte.dataset.referentes.split(';').map(function (x) { var p = x.split('|'); return { nom: p[0], tel: p[1] || '' }; });
      } else if (carte && carte.dataset.referenteNom) {
        refs = [{ nom: carte.dataset.referenteNom, tel: carte.dataset.referenteTel || '' }];
      }
      if (refs.length) {
        html += '<br>' + (refs.length > 1 ? 'Vos référentes vie associative&nbsp;: ' : 'Votre référente vie associative&nbsp;: ') +
          refs.map(function (r) {
            return '<b>' + echapper(r.nom) + '</b>' + (r.tel ? ', <a href="tel:+33' + r.tel.replace(/\D/g, '').replace(/^0/, '') + '">' + echapper(r.tel) + '</a>' : '');
          }).join(' ou ') + '.';
      }
      html += '</p><button type="button" class="voir-toutes">Voir toutes les antennes</button>';
      resultat.innerHTML = html;
      resultat.hidden = false;
      resultat.querySelector('.voir-toutes').addEventListener('click', reinitialiser);
    }

    function reinitialiser() {
      champ.value = '';
      if (effacer) effacer.hidden = true;
      resultat.hidden = true;
      fermer();
      afficherCartes(null);
      champ.focus();
    }

    champ.addEventListener('input', function () {
      var q = norm(champ.value);
      if (effacer) effacer.hidden = !champ.value;
      resultat.hidden = true;
      if (!q) { fermer(); afficherCartes(null); return; }
      grille.classList.remove('replie');
      var trouvees = chercher(q);
      ouvrir(trouvees);
      var codes = {};
      trouvees.forEach(function (c) { codes[c.code] = true; });
      afficherCartes(codes, /^\d+$/.test(q) ? null : q);
      // commune tapée en entier, sans ambiguïté → réponse directe
      if (trouvees.length === 1 && trouvees[0].n === q) choisir(trouvees[0]);
    });
    champ.addEventListener('keydown', function (e) {
      if (liste.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); surligner(actif + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); surligner(actif - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); choisir(sugg[actif >= 0 ? actif : 0]); }
      else if (e.key === 'Escape') { e.stopPropagation(); fermer(); }
    });
    liste.addEventListener('mousedown', function (e) {
      var li = e.target.closest('li');
      if (li) { e.preventDefault(); choisir(sugg[+li.dataset.i]); }
    });
    champ.addEventListener('blur', function () { setTimeout(fermer, 150); });
    if (effacer) effacer.addEventListener('click', reinitialiser);
  }

  function demarrer() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-recherche-antennes]'), initialiser);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
