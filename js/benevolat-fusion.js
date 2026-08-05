/* ==========================================================================
   ADMR 21 — Page Bénévolat modernisée
   Scripts : fil du lien (SVG scroll-animé), navigation sticky,
   reveal au scroll, formulaire RDV, modal de remerciement,
   compteurs, accessibilité (prefers-reduced-motion).
   ========================================================================== */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* ---------- 1. Menu burger (mobile) ---------- */
  const burger = document.querySelector('.burger');
  const nav    = document.querySelector('.nav-main');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const ouvert = nav.classList.toggle('ouvert');
      burger.classList.toggle('ouvert', ouvert);
      burger.setAttribute('aria-expanded', String(ouvert));
    });
    nav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        nav.classList.remove('ouvert');
        burger.classList.remove('ouvert');
        burger.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------- 2. Reveal au scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      reveals.forEach(el => el.classList.add('vu'));
    } else {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('vu');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(el => obs.observe(el));
    }
  }

  /* ---------- 3. Fil du lien — animation SVG au scroll ---------- */
  const filSvg = document.querySelector('.fil-du-lien');
  if (filSvg && !prefersReducedMotion) {
    const filPath  = filSvg.querySelector('.fil-path');
    const filGlow  = filSvg.querySelector('.fil-glow');
    const nodeLayer = filSvg.querySelector('.fil-nodes');
    const sections = Array.from(document.querySelectorAll(
      'main section[id], main > section'
    ));
    const docEl = document.documentElement;

    // Mesure la longueur du path
    let longueur = 0;
    try { longueur = filPath.getTotalLength(); } catch (e) {}
    if (!longueur) longueur = 4000;
    filPath.style.setProperty('--fil-long', longueur);
    filGlow.style.setProperty('--fil-long', longueur);

    // Met à jour la position des nœuds à chaque redimensionnement
    function placerNoeuds() {
      if (!nodeLayer) return;
      const svgRect = filSvg.getBoundingClientRect();
      const svgHeight = svgRect.height;
      const pageHeight = docEl.scrollHeight;

      // Clear
      nodeLayer.innerHTML = '';

      sections.forEach((sec) => {
        if (!sec.id) return;
        const rect = sec.getBoundingClientRect();
        // Position relative du top de la section dans le document (0..1)
        const yAbs = rect.top + window.scrollY;
        const yRel = yAbs / pageHeight;
        const y = Math.max(0.02, Math.min(0.98, yRel)) * svgHeight;

        // Le fil serpente : on suit la courbe (utilise une sinusoïde)
        const xCenter = svgRect.width / 2;
        const sway = Math.sin(yRel * Math.PI * 3) * (svgRect.width * 0.18);
        const x = Math.max(20, Math.min(svgRect.width - 20, xCenter + sway));

        // Cercle principal
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', x);
        c.setAttribute('cy', y);
        c.setAttribute('r', 7);
        c.setAttribute('class', 'fil-node');
        c.setAttribute('data-section', sec.id);
        nodeLayer.appendChild(c);

        // Pulse (cercle externe)
        const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pulse.setAttribute('cx', x);
        pulse.setAttribute('cy', y);
        pulse.setAttribute('r', 6);
        pulse.setAttribute('class', 'fil-pulse');
        pulse.setAttribute('data-pulse', sec.id);
        nodeLayer.appendChild(pulse);
      });
    }

    // Met à jour le dashoffset en fonction du scroll
    function animerFil() {
      const scrolled = window.scrollY;
      const max = docEl.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? scrolled / max : 0;
      // Garantir un minimum visible (35% du fil) même en haut de page,
      // pour éviter que la ligne disparaisse si le scroll est en haut
      // ou si getTotalLength() renvoie une valeur trop grande.
      const ratioMin = 0.35;
      const offset = longueur * (1 - Math.max(ratio, ratioMin));
      filPath.style.strokeDashoffset = offset;
      filGlow.style.strokeDashoffset = offset;
    }

    // Met en évidence le nœud actif
    function noeudActif() {
      const trigger = window.innerHeight * 0.35;
      let current = null;
      sections.forEach(sec => {
        if (!sec.id) return;
        const r = sec.getBoundingClientRect();
        if (r.top <= trigger && r.bottom > trigger) current = sec.id;
      });
      filSvg.querySelectorAll('.fil-node').forEach(n => {
        n.classList.toggle('actif', n.getAttribute('data-section') === current);
      });
      filSvg.querySelectorAll('.fil-pulse').forEach(p => {
        p.classList.toggle('actif', p.getAttribute('data-pulse') === current);
      });
    }

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          animerFil();
          noeudActif();
          ticking = false;
        });
        ticking = true;
      }
    }

    // Initialisation après layout
    requestAnimationFrame(() => {
      placerNoeuds();
      animerFil();
      noeudActif();
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      placerNoeuds();
      animerFil();
      noeudActif();
    });
  } else if (filSvg) {
    // reduced-motion : on dessine tout le fil, pas d'animation
    const filPath = filSvg.querySelector('.fil-path');
    const filGlow = filSvg.querySelector('.fil-glow');
    [filPath, filGlow].forEach(p => {
      if (p) p.style.strokeDashoffset = '0';
    });
  }

  /* ---------- 4. Nav sticky : section active ---------- */
  const navLinks = document.querySelectorAll('.benevolat-nav a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    const linkMap = {};
    navLinks.forEach(a => {
      const id = a.getAttribute('href').slice(1);
      linkMap[id] = a;
    });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && e.target.id && linkMap[e.target.id]) {
          navLinks.forEach(l => l.classList.remove('actif'));
          linkMap[e.target.id].classList.add('actif');
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

    document.querySelectorAll('main section[id]').forEach(s => obs.observe(s));
  }

  /* ---------- 5. Souligné du dernier mot du h2 ---------- */
  document.querySelectorAll('h2').forEach(h => {
    if (h.querySelector('.souligne')) return;
    const txt = h.textContent.trim();
    const m = txt.match(/^(.*?)(\s\W?)?$/);
    if (!m) return;
    // Cherche le dernier mot "significatif"
    const parts = txt.split(/\s+/);
    const last = parts.pop();
    if (!last || last.length < 3) return;
    const before = parts.join(' ');
    h.innerHTML = before + ' <span class="souligne">' + last + '</span>';
  });

  /* ---------- 6. Formulaire RDV (soumission + modal) ---------- */
  const form = document.querySelector('.form-rdv');
  const modal = document.getElementById('modal-merci');
  const retour = form && form.querySelector('.msg-retour');
  const btn = form && form.querySelector('.btn-rdv');

  function ouvrirModal() {
    if (!modal) return;
    modal.classList.add('ouvert');
    modal.setAttribute('aria-hidden', 'false');
    const focusable = modal.querySelector('.modal-ok');
    if (focusable) focusable.focus();
    document.body.style.overflow = 'hidden';
  }
  function fermerModal() {
    if (!modal) return;
    modal.classList.remove('ouvert');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.matches('[data-fermer]')) fermerModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('ouvert')) fermerModal();
    });
  }

  if (form && btn) {
    form.addEventListener('submit', (e) => {
      // Laisse la soumission réelle au navigateur (formsubmit.co via iframe)
      // mais affiche la modal après un délai pour feedback utilisateur.
      if (!form.checkValidity()) {
        // Validation native du navigateur
        return;
      }
      e.preventDefault();
      const txt = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';
      // Soumission via iframe caché (target="fs-frame" sur le form)
      const frame = document.querySelector('iframe[name="fs-frame"]');
      if (frame) form.submit();
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = txt;
        form.reset();
        ouvrirModal();
        if (retour) {
          retour.className = 'msg-retour succes';
          retour.textContent = 'Votre demande a bien été envoyée. Merci !';
        }
      }, 900);
    });
  }

  /* ---------- 7. Compteurs (chiffres clés) ---------- */
  const nombres = document.querySelectorAll('[data-cible]');
  if (nombres.length && 'IntersectionObserver' in window) {
    const animer = (el) => {
      const cible = parseInt(el.dataset.cible, 10);
      if (isNaN(cible)) return;
      if (prefersReducedMotion) { el.textContent = cible; return; }
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
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { animer(e.target); obs.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    nombres.forEach(n => obs.observe(n));
  }
benevolat-modernise.js
})();
