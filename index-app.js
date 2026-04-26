/* ═══════════════════════════════════════════════
   OKNLAB — Vue 3 App (index page)
   ═══════════════════════════════════════════════ */

import {
  createApp, ref, onMounted, onUpdated, onBeforeUnmount, nextTick
} from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

createApp({
  setup() {
    /* ── State ── */
    const mobileMenuOpen  = ref(false);
    const scrollContainer = ref(null);
    const canScrollLeft   = ref(false);
    const canScrollRight  = ref(true);
    const scrollProgress  = ref(0);
    const activeDot       = ref(0);

    /* ── Projects data ── */
    const projects = [
      {
        title: 'CodeSynthesizer X',
        category: 'DevTools',
        description: 'An IDE plugin that predicts your next logic block — not just the next line. Transformer-based architecture trained on production codebases to understand intent, not just syntax.',
        icon: 'terminal-square',
        logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg',
        link: '#project-codesynth',
        isNew: true
      },
      {
        title: 'DocuGen AI',
        category: 'Content',
        description: 'Automated technical documentation that reads your codebase and writes the manual. Supports JSDoc, TypeDoc, Sphinx, and custom templates with multi-language output.',
        icon: 'file-text',
        logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/markdown/markdown-original.svg',
        link: '#project-docugen',
        isNew: false
      },
      {
        title: 'FlowAutomate',
        category: 'Productivity',
        description: 'Visual workflow builder for connecting API endpoints without glue code. Drag, connect, deploy — with built-in error handling and retry logic baked in.',
        icon: 'workflow',
        logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg',
        link: '#project-flow',
        isNew: false
      },
      {
        title: 'VisionCraft API',
        category: 'Media',
        description: 'Enterprise-grade image manipulation for bulk e-commerce processing. Background removal, colour correction, and format optimisation at scale — processing millions of assets daily.',
        icon: 'aperture',
        logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opencv/opencv-original.svg',
        link: '#project-vision',
        isNew: false
      },
      {
        title: 'SecureGuard',
        category: 'Security',
        description: 'AI-powered vulnerability scanner with real-time zero-day detection. Continuous monitoring with automated patch suggestions and compliance reporting for SOC2 and ISO 27001.',
        icon: 'shield-check',
        logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
        link: '#project-secure',
        isNew: false
      }
    ];

    const toggleMobileMenu = () => { mobileMenuOpen.value = !mobileMenuOpen.value; };

    /* ── Scroll state ── */
    let ticking = false;
    const updateScrollState = () => {
      const el = scrollContainer.value;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      canScrollLeft.value  = el.scrollLeft > 10;
      canScrollRight.value = el.scrollLeft < max - 10;
      scrollProgress.value = max > 0 ? (el.scrollLeft / max) * 100 : 0;

      const center = el.scrollLeft + el.clientWidth / 2;
      const cards  = el.querySelectorAll('.project-panel');
      let closest = 0, minDist = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
        if (d < minDist) { minDist = d; closest = i; }
      });
      activeDot.value = closest;
    };

    const onTrackScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { updateScrollState(); ticking = false; });
        ticking = true;
      }
    };

    const scrollByDir = (dir) => {
      const el = scrollContainer.value;
      if (!el) return;
      const card = el.querySelector('.project-panel');
      const gap  = 20;
      el.scrollBy({ left: dir * ((card ? card.offsetWidth : 420) + gap), behavior: 'smooth' });
    };

    const scrollToDot = (i) => {
      const el = scrollContainer.value;
      if (!el) return;
      const card = el.querySelectorAll('.project-panel')[i];
      if (!card) return;
      el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' });
    };

    /* ── Mouse-wheel → horizontal (desktop) ── */
    const onWheel = (e) => {
      const el = scrollContainer.value;
      if (!el) return;
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((e.deltaY > 0 && el.scrollLeft >= max - 1) ||
          (e.deltaY < 0 && el.scrollLeft <= 0)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    /* ── Card reveal observer ── */
    const initReveal = () => {
      const obs = new IntersectionObserver(
        entries => entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        }),
        { root: scrollContainer.value, threshold: 0.12, rootMargin: '0px 180px 0px 180px' }
      );
      scrollContainer.value?.querySelectorAll('.project-panel').forEach(p => obs.observe(p));
    };

    /* ── Spotlight on cards ── */
    const initSpotlight = () => {
      scrollContainer.value?.querySelectorAll('.card-spotlight').forEach(card => {
        card.addEventListener('mousemove', e => {
          const r = card.getBoundingClientRect();
          card.style.setProperty('--cx', ((e.clientX - r.left) / r.width * 100) + '%');
          card.style.setProperty('--cy', ((e.clientY - r.top)  / r.height * 100) + '%');
        });
      });
    };

    /* ── Lifecycle ── */
    onMounted(() => {
      window.addEventListener('resize', updateScrollState, { passive: true });
      if (typeof lucide !== 'undefined') lucide.createIcons();

      nextTick(() => {
        updateScrollState();
        initReveal();
        initSpotlight();
        scrollContainer.value?.addEventListener('wheel', onWheel, { passive: false });
      });
    });

    onUpdated(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateScrollState);
      scrollContainer.value?.removeEventListener('wheel', onWheel);
    });

    return {
      mobileMenuOpen,
      projects,
      toggleMobileMenu,
      scrollContainer,
      canScrollLeft,
      canScrollRight,
      scrollProgress,
      activeDot,
      onTrackScroll,
      scrollByDir,
      scrollToDot
    };
  }
}).mount('#app');
