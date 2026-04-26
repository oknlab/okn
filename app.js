/* ═══════════════════════════════════════════════
   OKNLAB — Shared Utilities
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Init Lucide icons ── */
  function initIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  /* ── Grain canvas overlay ── */
  function initGrain() {
    if (document.getElementById('okn-grain')) return;

    const canvas = document.createElement('canvas');
    canvas.width = 200; canvas.height = 200;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(200, 200);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      img.data[i] = img.data[i+1] = img.data[i+2] = v;
      img.data[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);

    const el = document.createElement('div');
    el.id = 'okn-grain';
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999',
      'pointer-events:none', 'opacity:0.034',
      'mix-blend-mode:screen',
      `background-image:url(${canvas.toDataURL()})`,
      'background-repeat:repeat',
      'background-size:200px 200px'
    ].join(';');
    document.body.appendChild(el);
  }

  /* ── Header scroll state ── */
  function initHeader() {
    const h = document.querySelector('.site-header');
    if (!h) return;
    const update = () => h.classList.toggle('is-scrolled', window.scrollY > 20);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ── Reveal on scroll ── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
  }

  /* ── Spotlight effect on cards ── */
  function initSpotlight() {
    document.querySelectorAll('.card-spotlight').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--cx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--cy', ((e.clientY - r.top)  / r.height * 100) + '%');
      });
    });
  }

  /* ── Run on DOM ready ── */
  function init() {
    initIcons();
    initGrain();
    initHeader();
    initReveal();
    initSpotlight();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Expose for re-init after dynamic content */
  window.OKNLAB = { reinit: init, initIcons, initSpotlight };
})();
