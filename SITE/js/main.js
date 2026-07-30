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
