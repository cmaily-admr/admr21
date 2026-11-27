/* =========================================================
   ADMR Côte-d'Or — Candidatures envoyées au bon cadre de secteur
   Page recrutement : formulaires « CV » et « Être rappelé(e) ».

   - Le candidat choisit sa ville de résidence (suggestions).
   - À l'envoi, le formulaire part vers /api/candidature (Cloudflare),
     qui retrouve le cadre de secteur et envoie le mail via Brevo.
     Les adresses des cadres sont dans functions/api/candidature.js
     (elles ne sont donc plus visibles dans le code de la page).
   - Si ce service n'est pas encore configuré ou ne répond pas,
     la candidature part comme avant via FormSubmit vers l'adresse
     de secours ci-dessous : aucune candidature n'est perdue.
   ========================================================= */

var CANDIDATURE_REGLAGES = {
  secours: 'communication@admr21.fr',
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
  function champCache(form, nom) {
    var el = form.querySelector('input[type=hidden][name="' + nom + '"]');
    if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.name = nom; form.appendChild(el); }
    return el;
  }

  /* ---------- envoi ---------- */
  var modal = document.getElementById('merci-modal');
  function merci() {
    if (!modal) return;
    modal.classList.add('ouvert'); modal.setAttribute('aria-hidden', 'false');
    var b = modal.querySelector('.btn'); if (b) b.focus();
  }
  function erreur(form, texte) {
    var p = form.querySelector('.form-erreur');
    if (!p) { p = document.createElement('p'); p.className = 'form-erreur'; p.setAttribute('role', 'alert'); form.appendChild(p); }
    p.textContent = texte; p.hidden = !texte;
  }
  function val(form, nom) { var el = form.elements[nom]; return el ? el.value : ''; }

  // Ancien envoi (FormSubmit vers l'adresse de secours) : utilisé si le service ne répond pas
  function secours(form, champ) {
    var c = retrouver(champ.value);
    champCache(form, 'Antenne').value = c ? (R.nomsAntennes[c.code] || '—') : 'non reconnue';
    form.action = 'https://formsubmit.co/' + R.secours;
    form.target = 'fs-frame';
    HTMLFormElement.prototype.submit.call(form);
  }

  function envoyer(form, champ) {
    var btn = form.querySelector('button[type="submit"]');
    var texte = btn.textContent;
    btn.disabled = true; btn.textContent = 'Envoi en cours…'; erreur(form, '');

    var fd = new FormData();
    var cv = form.querySelector('input[type="file"]');
    fd.append('type', cv ? 'cv' : 'rappel');
    fd.append('ville', champ.value);
    fd.append('_honey', val(form, '_honey'));
    if (cv) {
      fd.append('nom', val(form, 'Nom et prénom'));
      if (cv.files[0]) fd.append('cv', cv.files[0]);
    } else {
      fd.append('prenom', val(form, 'Prénom')); fd.append('nom', val(form, 'Nom'));
      fd.append('email', val(form, 'E-mail')); fd.append('tel', val(form, 'Téléphone'));
    }

    function fin(ok) {
      btn.disabled = false; btn.textContent = texte;
      if (ok) {
        merci(); form.reset();
        var nf = document.getElementById('cv-nom-fichier'); if (nf && cv) nf.textContent = 'Aucun fichier choisi';
      }
    }

    fetch('/api/candidature', { method: 'POST', body: fd })
      .then(function (r) { return r.json().catch(function () { return { ok: false, repli: true }; }); })
      .then(function (d) {
        if (d && d.ok) { fin(true); return; }
        if (d && d.repli) { secours(form, champ); setTimeout(function () { fin(true); }, 1200); return; }
        erreur(form, 'Envoi impossible : ' + ((d && d.info) || 'vérifiez les champs') + '.');
        fin(false);
      })
      .catch(function () { secours(form, champ); setTimeout(function () { fin(true); }, 1200); });
  }

  document.querySelectorAll('.form-candidature [data-ville]').forEach(function (champ, i) {
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

    form.addEventListener('submit', function (e) { e.preventDefault(); envoyer(form, champ); });
  });

})();
