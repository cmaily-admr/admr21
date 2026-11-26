/* =========================================================
   ADMR Côte-d'Or — Envoi des candidatures au bon cadre de secteur
   Page recrutement : formulaires « CV » et « Être rappelé(e) ».

   Le candidat saisit sa ville de résidence (avec suggestions).
   À l'envoi, on retrouve l'antenne de sa commune (js/communes-admr21.js),
   puis le cadre de secteur qui la suit, et le mail part à SON adresse.
   Si la ville n'est pas trouvée (hors Côte-d'Or, faute de frappe…),
   le mail part à l'adresse par défaut ci-dessous.

   ┌────────────────────────── RÉGLAGES ──────────────────────────┐ */

var CANDIDATURE_REGLAGES = {

  // Adresse utilisée quand la ville n'est pas reconnue
  parDefaut: 'communication@admr21.fr',

  // false = TOUT arrive à parDefaut (le mail indique quand même l'antenne et le cadre concerné)
  // true  = chaque candidature part directement au cadre de secteur
  envoiDirect: false,

  // Copie de chaque candidature (mettre '' pour ne pas en recevoir)
  copie: 'communication@admr21.fr',

  // Les 4 cadres de secteur : nom affiché dans le mail + adresse
  // A = nord-ouest · B = Dijon / nord-est · C = est / Saône · D = sud-ouest
  cadres: {
    A: { nom: 'Amélie Gay', email: 'agay@admr21.fr' },
    B: { nom: 'Marine Lecullier', email: 'mlecullier@admr21.fr' },
    C: { nom: 'Amélie Bouchet', email: 'abouchet@admr21.fr' },
    D: { nom: 'Stéphanie Rey', email: 'srey@admr21.fr' }
  },

  // Antenne (code de la carte) → lettre du cadre qui la suit
  antennes: {
    1:  'A', // Châtillon-sur-Seine (Pays Châtillonnais)
    2:  'A', // Laignes
    3:  'A', // Montbard + Semur-en-Auxois
    4:  'A', // Venarey-les-Laumes
    5:  'A', // Saint-Seine-l'Abbaye
    6:  'B', // Is-sur-Tille (3 Rivières)
    7:  'B', // Mirebeau-sur-Bèze
    8:  'B', // Dijon métropole (Chenôve)
    9:  'B', // Pontailler-sur-Saône
    10: 'A', // Vitteaux
    11: 'C', // Auxonne
    12: 'C', // Genlis
    13: 'C', // Gevrey-Chambertin
    14: 'C', // Nuits-Saint-Georges
    15: 'D', // Pouilly-en-Auxois
    16: 'D', // Liernais
    17: 'D', // Saulieu
    18: 'D', // Arnay-le-Duc
    19: 'D', // Beaune (Sud Côte-d'Or)
    20: 'C', // Saint-Jean-de-Losne
    21: 'C'  // Seurre
  },

  // Nom de l'antenne affiché dans le mail
  nomsAntennes: {
    1: 'Châtillon-sur-Seine', 2: 'Laignes', 3: 'Montbard / Semur-en-Auxois', 4: 'Venarey-les-Laumes',
    5: "Saint-Seine-l'Abbaye", 6: 'Is-sur-Tille', 7: 'Mirebeau-sur-Bèze', 8: 'Dijon métropole (Chenôve)',
    9: 'Pontailler-sur-Saône', 10: 'Vitteaux', 11: 'Auxonne', 12: 'Genlis', 13: 'Gevrey-Chambertin',
    14: 'Nuits-Saint-Georges', 15: 'Pouilly-en-Auxois', 16: 'Liernais', 17: 'Saulieu', 18: 'Arnay-le-Duc',
    19: 'Beaune', 20: 'Saint-Jean-de-Losne', 21: 'Seurre'
  }
};
/* └───────────────────────────────────────────────────────────────┘ */

(function () {
  'use strict';
  var R = CANDIDATURE_REGLAGES;
  var MAX_SUGG = 6;

  function norm(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[-'’]/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/\bste\b/g, 'sainte').replace(/\bst\b/g, 'saint');
  }
  function echapper(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var communes = (window.COMMUNES_ADMR21 || []).map(function (r) { return { nom: r[0], cp: r[1], code: String(r[2]), n: norm(r[0]) }; });

  function chercher(q) {
    if (!q) return [];
    var chiffres = /^\d+$/.test(q), debut = [], mot = [];
    communes.forEach(function (c) {
      if (chiffres) { if (c.cp.indexOf(q) === 0) debut.push(c); return; }
      if (c.n.indexOf(q) === 0) debut.push(c);
      else if (c.n.indexOf(' ' + q) !== -1) mot.push(c);
    });
    return debut.concat(mot);
  }
  // « Flavigny-sur-Ozerain (21150) » ou « Flavigny-sur-Ozerain » → commune
  function retrouver(texte) {
    var m = /^(.*?)\s*\((\d{5})\)\s*$/.exec(texte || '');
    var nom = norm(m ? m[1] : texte), cp = m ? m[2] : null;
    if (!nom) return null;
    var exactes = communes.filter(function (c) { return c.n === nom && (!cp || c.cp === cp); });
    return exactes.length ? exactes[0] : null;
  }
  function emailValide(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && e.indexOf('A_COMPLETER') === -1; }

  function destinataire(commune) {
    if (!commune) return { email: R.parDefaut, cadre: 'Non attribué (ville non reconnue)', antenne: '—' };
    var lettre = R.antennes[commune.code];
    var cadre = lettre && R.cadres[lettre];
    var antenne = R.nomsAntennes[commune.code] || '—';
    if (!cadre || !emailValide(cadre.email)) return { email: R.parDefaut, cadre: 'Non attribué', antenne: antenne };
    return { email: R.envoiDirect ? cadre.email : R.parDefaut, cadre: cadre.nom, antenne: antenne };
  }

  function champCache(form, nom) {
    var el = form.querySelector('input[type=hidden][name="' + nom + '"]');
    if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.name = nom; form.appendChild(el); }
    return el;
  }

  document.querySelectorAll('.form-fs [data-ville]').forEach(function (champ, i) {
    var form = champ.form;
    var zone = champ.closest('.champ-ville');
    var liste = zone.querySelector('.ville-suggestions');
    var info = zone.querySelector('.ville-info');
    liste.id = liste.id || 'ville-sugg-' + i;
    champ.setAttribute('role', 'combobox');
    champ.setAttribute('aria-autocomplete', 'list');
    champ.setAttribute('aria-expanded', 'false');
    champ.setAttribute('aria-controls', liste.id);
    var sugg = [], actif = -1;

    function fermer() { liste.hidden = true; liste.innerHTML = ''; actif = -1; champ.setAttribute('aria-expanded', 'false'); champ.removeAttribute('aria-activedescendant'); }
    function surligner(k) {
      var it = liste.children; if (!it.length) return;
      actif = (k + it.length) % it.length;
      for (var j = 0; j < it.length; j++) it[j].setAttribute('aria-selected', j === actif ? 'true' : 'false');
      champ.setAttribute('aria-activedescendant', it[actif].id);
    }
    function majInfo(final) {
      var c = retrouver(champ.value);
      if (!champ.value.trim()) { info.textContent = ''; info.className = 'ville-info'; return; }
      if (c) { info.textContent = 'Antenne de ' + (R.nomsAntennes[c.code] || '—'); info.className = 'ville-info ok'; }
      else if (final) { info.textContent = 'Commune non reconnue : choisissez-la dans la liste, ou laissez tel quel si vous habitez hors Côte-d\'Or.'; info.className = 'ville-info'; }
      else { info.textContent = ''; info.className = 'ville-info'; }
    }
    function choisir(c) { if (!c) return; champ.value = c.nom + ' (' + c.cp + ')'; fermer(); majInfo(); }

    champ.addEventListener('input', function () {
      sugg = chercher(norm(champ.value)).slice(0, MAX_SUGG);
      if (!sugg.length) { fermer(); majInfo(); return; }
      liste.innerHTML = sugg.map(function (c, k) {
        return '<li role="option" id="' + liste.id + '-' + k + '" data-i="' + k + '" aria-selected="false"><b>' + echapper(c.nom) + '</b> <small>' + c.cp + '</small></li>';
      }).join('');
      liste.hidden = false; actif = -1; champ.setAttribute('aria-expanded', 'true');
      majInfo();
    });
    champ.addEventListener('keydown', function (e) {
      if (liste.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); surligner(actif + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); surligner(actif - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); choisir(sugg[actif >= 0 ? actif : 0]); }
      else if (e.key === 'Escape') { e.stopPropagation(); fermer(); }
    });
    liste.addEventListener('mousedown', function (e) {
      var li = e.target.closest('li'); if (li) { e.preventDefault(); choisir(sugg[+li.dataset.i]); }
    });
    champ.addEventListener('blur', function () { setTimeout(function () { fermer(); majInfo(true); }, 150); });
    form.addEventListener('reset', function () { setTimeout(function () { fermer(); majInfo(); }, 0); });

    // À l'envoi : on choisit le destinataire (s'exécute avant l'envoi réel du formulaire)
    form.addEventListener('submit', function () {
      var d = destinataire(retrouver(champ.value));
      form.action = 'https://formsubmit.co/' + d.email;
      champCache(form, 'Antenne').value = d.antenne;
      champCache(form, 'Cadre de secteur').value = d.cadre;
      var cc = champCache(form, '_cc');
      cc.value = (R.copie && R.copie !== d.email) ? R.copie : '';
      if (!cc.value) cc.remove();
    });
  });

  window.CANDIDATURE_DESTINATAIRE = function (ville) { return destinataire(retrouver(ville)); }; // pour tester
})();
