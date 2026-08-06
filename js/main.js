/* ============================================
   ADMR 21 — Scripts communs
   ============================================ */

/* ---------- 1. Menu burger ---------- */
(function () {
  const burger = document.querySelector('.burger');
  const nav    = document.querySelector('.nav-main');
  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    const ouvert = nav.classList.toggle('ouvert');
    burger.classList.toggle('ouvert', ouvert);
    burger.setAttribute('aria-expanded', ouvert);
  });

  nav.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      nav.classList.remove('ouvert');
      burger.classList.remove('ouvert');
    })
  );
})();

/* ---------- 2. Apparition au scroll ---------- */
(function () {
  const cibles = document.querySelectorAll('.reveal');
  if (!cibles.length) return;

  if (!('IntersectionObserver' in window)) {
    cibles.forEach(el => el.classList.add('vu'));
    return;
  }

  const obs = new IntersectionObserver((entrees) => {
    entrees.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('vu'), i * 90);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  cibles.forEach(el => obs.observe(el));
})();

/* ---------- 3. Compteurs de chiffres ---------- */
(function () {
  const nombres = document.querySelectorAll('.chiffre .n[data-cible]');
  if (!nombres.length || !('IntersectionObserver' in window)) return;

  const anime = (el) => {
    const cible = parseInt(el.dataset.cible, 10);
    const duree = 1400;
    const t0 = performance.now();

    const pas = (t) => {
      const p = Math.min((t - t0) / duree, 1);
      el.textContent = Math.floor(p * cible);
      if (p < 1) requestAnimationFrame(pas);
      else el.textContent = cible;
    };
    requestAnimationFrame(pas);
  };

  const obs = new IntersectionObserver((entrees) => {
    entrees.forEach(e => {
      if (e.isIntersecting) { anime(e.target); obs.unobserve(e.target); }
    });
  }, { threshold: 0.6 });

  nombres.forEach(n => obs.observe(n));
})();

/* ---------- 4. Lecture des vidéos témoignages ---------- */
(function () {
  document.querySelectorAll('.video-item[data-video]').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.dataset.video;
      if (!src) { alert('Vidéo à venir : ajoutez l\'URL dans l\'attribut data-video.'); return; }

      item.innerHTML = `
        <div class="vignette">
          <iframe src="${src}?autoplay=1" title="Témoignage ADMR 21"
                  style="width:100%;height:100%;border:0;"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowfullscreen></iframe>
        </div>`;
      item.style.cursor = 'default';
    });
  });
})();

/* ---------- 5. Validation & envoi des formulaires ---------- */
(function () {
  document.querySelectorAll('form[data-admr-form]').forEach(form => {
    const retour = form.querySelector('.msg-retour');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validation native
      if (!form.checkValidity()) {
        form.reportValidity();
        afficher('err', 'Merci de compléter tous les champs obligatoires.');
        return;
      }

      // Au moins une case cochée dans les groupes obligatoires
      const groupes = form.querySelectorAll('[data-groupe-requis]');
      for (const g of groupes) {
        if (!g.querySelector('input[type="checkbox"]:checked')) {
          afficher('err', 'Merci de sélectionner au moins une option dans « ' + g.dataset.groupeRequis + ' ».');
          return;
        }
      }

      const btn = form.querySelector('button[type="submit"]');
      const txt = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';

      /* ⚠️ REMPLACEZ ce bloc par votre appel réel :
         fetch('/api/candidature', { method:'POST', body:new FormData(form) })
      */
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = txt;
        afficher('ok', '✅ Merci ! Votre demande a bien été envoyée. Notre équipe vous recontacte sous 48 h ouvrées.');
        form.reset();
      }, 1100);
    });

    function afficher(type, message) {
      if (!retour) return;
      retour.className = 'msg-retour ' + type;
      retour.textContent = message;
      retour.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
})();

/* ---------- 6. Nom du fichier CV choisi ---------- */
(function () {
  const input = document.getElementById('cv-file');
  const label = document.getElementById('cv-nom-fichier');
  if (!input || !label) return;

  input.addEventListener('change', () => {
    const f = input.files && input.files[0];
    if (!f) { label.textContent = 'Aucun fichier choisi'; label.style.color = ''; return; }
    const mo = f.size / (1024 * 1024);
    if (mo > 5) {
      label.textContent = f.name + ' (' + mo.toFixed(1) + ' Mo) — trop lourd, max ~5 Mo';
      label.style.color = '#C25E00';
    } else {
      label.textContent = f.name + ' (' + mo.toFixed(1) + ' Mo)';
      label.style.color = '';
    }
  });
})();

/* ---------- 7. Pop-up « Merci » après envoi (recrutement) ---------- */
(function () {
  const modal = document.getElementById('modal-merci');
  if (!modal) return;

  const ouvrir = () => { modal.classList.add('ouvert'); modal.setAttribute('aria-hidden', 'false'); };
  const fermer = () => { modal.classList.remove('ouvert'); modal.setAttribute('aria-hidden', 'true'); };

  modal.querySelectorAll('[data-fermer]').forEach(el => el.addEventListener('click', fermer));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fermer(); });

  // Les formulaires postent dans un iframe caché : la pop-up s'affiche si la
  // validation native est passée (les champs requis sont remplis).
  document.querySelectorAll('.form-cv, #form-rappel, .form-rdv').forEach(form => {
    form.addEventListener('submit', () => {
      setTimeout(() => {
        ouvrir();
        form.reset();
        const l = document.getElementById('cv-nom-fichier');
        if (l) { l.textContent = 'Aucun fichier choisi'; l.style.color = ''; }
      }, 60);
    });
  });
})();

/* ---------- 8. Soulignement animé du dernier mot des titres (bénévolat) ---------- */
(function () {
  const titres = document.querySelectorAll('.page-benevolat h2');
  if (!titres.length) return;
  titres.forEach(h => {
    if (h.querySelector('.souligne')) return;
    const m = h.textContent.match(/([A-Za-zÀ-ÿ'’\-]{2,})(?:[^A-Za-zÀ-ÿ]*)$/u);
    if (!m) return;
    const word = m[1];
    const html = h.innerHTML;
    const idx = html.lastIndexOf(word);
    if (idx < 0) return;
    h.innerHTML = html.slice(0, idx) + '<span class="souligne">' + word + '</span>' + html.slice(idx + word.length);
  });
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('trace'); obs.unobserve(e.target); } });
  }, { threshold: 0.6 });
  document.querySelectorAll('.souligne').forEach(s => obs.observe(s));
})();

/* ---------- 10. Carrousel des témoignages ---------- */
(function () {
  const grid = document.querySelector('.page-benevolat .temoins-grid');
  if (!grid) return;
  const cards = grid.querySelectorAll('.ph-temoin');
  if (cards.length < 2) return;
  const wrap = document.createElement('div');
  wrap.className = 'temoins-carousel';
  grid.parentNode.insertBefore(wrap, grid);
  wrap.appendChild(grid);
  const mk = (cls, lbl, sym) => { const b = document.createElement('button'); b.className = 'tc-arrow ' + cls; b.type = 'button'; b.setAttribute('aria-label', lbl); b.textContent = sym; return b; };
  const prev = mk('tc-prev', 'Témoignage précédent', '‹');
  const next = mk('tc-next', 'Témoignage suivant', '›');
  wrap.appendChild(prev); wrap.appendChild(next);
  const step = () => cards[0].getBoundingClientRect().width + 20;
  prev.addEventListener('click', () => grid.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => grid.scrollBy({ left: step(), behavior: 'smooth' }));
})();

/* ---------- 11. Fil du lien : animation SVG ondulée au scroll ---------- */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const filSvg = document.querySelector('.fil-du-lien');
  if (!filSvg) return;
  const filPath = filSvg.querySelector('.fil-path');
  const filGlow = filSvg.querySelector('.fil-glow');
  const nodeLayer = filSvg.querySelector('.fil-nodes');
  if (!filPath) return;
  if (reduce) {
    filPath.style.strokeDashoffset = '0';
    if (filGlow) filGlow.style.strokeDashoffset = '0';
    return;
  }
  const sections = Array.from(document.querySelectorAll('main section[id], main > section'));
  const docEl = document.documentElement;
  let longueur = 0;
  try { longueur = filPath.getTotalLength(); } catch (e) {}
  if (!longueur) longueur = 4000;
  filPath.style.setProperty('--fil-long', longueur);
  if (filGlow) filGlow.style.setProperty('--fil-long', longueur);

  function placerNoeuds() {
    if (!nodeLayer) return;
    const svgRect = filSvg.getBoundingClientRect();
    const svgHeight = svgRect.height;
    const pageHeight = docEl.scrollHeight;
    nodeLayer.innerHTML = '';
    sections.forEach((sec) => {
      if (!sec.id) return;
      const rect = sec.getBoundingClientRect();
      const yAbs = rect.top + window.scrollY;
      const yRel = yAbs / pageHeight;
      const y = Math.max(0.02, Math.min(0.98, yRel)) * svgHeight;
      const xCenter = svgRect.width / 2;
      const sway = Math.sin(yRel * Math.PI * 3) * (svgRect.width * 0.18);
      const x = Math.max(20, Math.min(svgRect.width - 20, xCenter + sway));
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 7);
      c.setAttribute('class', 'fil-node'); c.setAttribute('data-section', sec.id);
      nodeLayer.appendChild(c);
      const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulse.setAttribute('cx', x); pulse.setAttribute('cy', y); pulse.setAttribute('r', 6);
      pulse.setAttribute('class', 'fil-pulse'); pulse.setAttribute('data-pulse', sec.id);
      nodeLayer.appendChild(pulse);
    });
  }
  function animerFil() {
    const scrolled = window.scrollY;
    const max = docEl.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? scrolled / max : 0;
    const offset = longueur * (1 - Math.max(ratio, 0.35));
    filPath.style.strokeDashoffset = offset;
    if (filGlow) filGlow.style.strokeDashoffset = offset;
  }
  function noeudActif() {
    const trigger = window.innerHeight * 0.35;
    let current = null;
    sections.forEach(sec => {
      if (!sec.id) return;
      const r = sec.getBoundingClientRect();
      if (r.top <= trigger && r.bottom > trigger) current = sec.id;
    });
    filSvg.querySelectorAll('.fil-node').forEach(n => n.classList.toggle('actif', n.getAttribute('data-section') === current));
    filSvg.querySelectorAll('.fil-pulse').forEach(pp => pp.classList.toggle('actif', pp.getAttribute('data-pulse') === current));
  }
  let ticking = false;
  function onScroll() {
    if (!ticking) { requestAnimationFrame(() => { animerFil(); noeudActif(); ticking = false; }); ticking = true; }
  }
  requestAnimationFrame(() => { placerNoeuds(); animerFil(); noeudActif(); });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { placerNoeuds(); animerFil(); noeudActif(); });
  window.addEventListener('load', () => { placerNoeuds(); animerFil(); noeudActif(); });
})();
