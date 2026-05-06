/* =============================================
   OKNLAB — Shared App Utilities (app.js)
   Loaded by: all .html pages (plain JS, no JSX)
   React components live in each page's <script type="text/babel">
   ============================================= */

(function () {
  'use strict';

  /* --- Active Nav Highlighting ---
     Reads the current filename and marks the matching nav anchor
     as active. Called after DOMContentLoaded so React has mounted. */
  function highlightActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('[data-nav-link]').forEach(function (el) {
      const target = el.getAttribute('data-nav-link');
      if (path === target || (path === '' && target === 'index.html')) {
        el.classList.add('nav-active');
      }
    });
  }

  /* --- Smooth anchor scrolling for in-page hash links --- */
  function initSmoothAnchors() {
    document.addEventListener('click', function (e) {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* --- GSAP registration (plugins loaded via CDN before this script) --- */
  function registerGSAP() {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }
  }

  /* --- Init --- */
  document.addEventListener('DOMContentLoaded', function () {
    registerGSAP();
    initSmoothAnchors();
    // Nav highlight runs after React mount (small delay)
    setTimeout(highlightActiveNav, 100);
  });

  /* --- Expose helpers for page scripts if needed --- */
  window.OKNLAB = window.OKNLAB || {};

  window.OKNLAB.reveal = function (selector, options) {
    if (typeof gsap === 'undefined') return;
    var opts = options || {};
    gsap.utils.toArray(selector).forEach(function (el) {
      gsap.fromTo(
        el,
        { opacity: 0, y: opts.y !== undefined ? opts.y : 40 },
        {
          opacity: 1,
          y: 0,
          duration: opts.duration || 1,
          ease: opts.ease || 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: opts.start || 'top 85%',
          },
        }
      );
    });
  };

  window.OKNLAB.scaleFade = function (selector) {
    if (typeof gsap === 'undefined') return;
    gsap.utils.toArray(selector).forEach(function (card) {
      gsap.fromTo(card, { scale: 0.9, opacity: 0.3 }, {
        scale: 1,
        opacity: 1,
        duration: 1,
        scrollTrigger: { trigger: card, start: 'top 90%', end: 'top 50%', scrub: 1 },
      });
    });
  };
})();
