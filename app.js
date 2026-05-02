/* ═══════════════════════════════════════════════════════════════
   OKNLAB — app.js  (v3)
   Vue 3 Composition API · homepage SPA shell

   TABLE OF CONTENTS
   ─────────────────
   A.  Imports
   B.  Data — projects array
   C.  State refs
   D.  Computed values
   E.  Helper methods (pure, no side-effects)
   F.  Header scroll handler
   G.  Carousel — scroll-state engine (rAF-throttled)
   H.  Carousel — navigation methods
   I.  Carousel — mouse-wheel → horizontal scroll
   J.  Card — spotlight mouse-position tracker
   K.  IntersectionObserver — card reveal
   L.  Lifecycle hooks
   M.  Expose to template
═══════════════════════════════════════════════════════════════ */


/* ─── A. Imports ─────────────────────────────────────────────── */
import {
  createApp,
  ref,
  computed,
  onMounted,
  onUpdated,
  onBeforeUnmount,
  nextTick
} from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'


createApp({
  setup () {

    /* ─── B. Projects data ─────────────────────────────────── */
    const projects = [
      {
        title:       'CodeSynthesizer X',
        category:    'DevTools',
        description: 'An IDE plugin that predicts your next logic block, not just the next line. Transformer-based architecture trained on production codebases to understand intent, not syntax.',
        icon:        'terminal-square',
        logo:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg',
        link:        '#project-codesynth',
        isNew:       true
      },
      {
        title:       'DocuGen AI',
        category:    'Content',
        description: 'Automated technical documentation that reads your codebase and writes the manual. Supports JSDoc, TypeDoc, Sphinx, and custom templates with multi-language output.',
        icon:        'file-text',
        logo:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/markdown/markdown-original.svg',
        link:        '#project-docugen',
        isNew:       false
      },
      {
        title:       'FlowAutomate',
        category:    'Productivity',
        description: 'Visual workflow builder for connecting API endpoints without glue code. Drag, connect, deploy — with built-in error handling and retry logic.',
        icon:        'workflow',
        logo:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg',
        link:        '#project-flow',
        isNew:       false
      },
      {
        title:       'VisionCraft API',
        category:    'Media',
        description: 'Enterprise image manipulation API for e-commerce at scale. Background removal, color correction, and format optimisation — processing millions of images per day.',
        icon:        'aperture',
        logo:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opencv/opencv-original.svg',
        link:        '#project-vision',
        isNew:       false
      },
      {
        title:       'SecureGuard',
        category:    'Security',
        description: 'AI-powered vulnerability scanner with real-time detection. Continuous monitoring, automated patch suggestions, and compliance reporting for SOC2, HIPAA, and ISO 27001.',
        icon:        'shield-check',
        logo:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
        link:        '#project-secure',
        isNew:       false
      }
    ]


    /* ─── C. State refs ────────────────────────────────────── */
    const isScrolled      = ref(false)
    const mobileMenuOpen  = ref(false)
    const scrollContainer = ref(null)
    const canScrollLeft   = ref(false)
    const canScrollRight  = ref(true)
    const scrollProgress  = ref(0)   // 0–100, drives the progress bar width
    const activeDot       = ref(0)   // index of the centred card


    /* ─── D. Computed values ───────────────────────────────────
       WHY: Vue 3 templates do NOT expose global JS built-ins
       (String, Number, Math, etc.) — calling them directly in
       {{ }} causes silent undefined errors.
       Fix: pre-compute every formatted string here and expose
       the result to the template instead.
    ─────────────────────────────────────────────────────────── */

    /** "05" — zero-padded total project count shown in the hero aside */
    const projectCountLabel = computed(() =>
      String(projects.length).padStart(2, '0')
    )

    /** "05 Projects" label shown in the portfolio header */
    const projectCountFull = computed(() =>
      `${projectCountLabel.value} Projects`
    )


    /* ─── E. Helper methods (pure) ─────────────────────────────
       pad(n) — zero-pad a 1-based index for card display.
       Called in v-for: pad(i + 1) → "01", "02", …
    ─────────────────────────────────────────────────────────── */
    const pad = (n) => String(n).padStart(2, '0')


    /* ─── F. Header scroll handler ─────────────────────────── */
    const handleScroll = () => {
      isScrolled.value = window.scrollY > 20
    }

    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value
    }


    /* ─── G. Carousel scroll-state engine ──────────────────────
       Wrapped in rAF to debounce rapid scroll events to one
       frame. Sets canScrollLeft/Right, scrollProgress, activeDot.
    ─────────────────────────────────────────────────────────── */
    let rafPending = false

    const _updateScrollState = () => {
      const el = scrollContainer.value
      if (!el) return

      const max = el.scrollWidth - el.clientWidth

      canScrollLeft.value  = el.scrollLeft > 10
      canScrollRight.value = el.scrollLeft < max - 10
      scrollProgress.value = max > 0 ? (el.scrollLeft / max) * 100 : 0

      // Active dot = card whose centre is closest to the viewport centre
      const vpCentre = el.scrollLeft + el.clientWidth / 2
      const cards    = el.querySelectorAll('.project-panel')
      let closestIdx = 0
      let minDist    = Infinity

      cards.forEach((card, i) => {
        const cardCentre = card.offsetLeft + card.offsetWidth / 2
        const dist       = Math.abs(cardCentre - vpCentre)
        if (dist < minDist) {
          minDist    = dist
          closestIdx = i
        }
      })

      activeDot.value = closestIdx
      rafPending = false
    }

    const onTrackScroll = () => {
      if (rafPending) return
      rafPending = true
      requestAnimationFrame(_updateScrollState)
    }

    // Also trigger on resize (card widths change at breakpoints)
    const onResize = () => {
      if (rafPending) return
      rafPending = true
      requestAnimationFrame(_updateScrollState)
    }


    /* ─── H. Carousel navigation methods ───────────────────── */

    /** Scroll one card-width left (dir = -1) or right (dir = 1) */
    const scrollByDir = (dir) => {
      const el = scrollContainer.value
      if (!el) return
      const card = el.querySelector('.project-panel')
      const step = card ? card.offsetWidth + 20 : 440 // 20 ≈ gap
      el.scrollBy({ left: dir * step, behavior: 'smooth' })
    }

    /** Jump carousel so card[i] is centred in the viewport */
    const scrollToDot = (i) => {
      const el = scrollContainer.value
      if (!el) return
      const card = el.querySelectorAll('.project-panel')[i]
      if (!card) return
      const target = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2
      el.scrollTo({ left: target, behavior: 'smooth' })
    }


    /* ─── I. Mouse-wheel → horizontal scroll ───────────────────
       Converts vertical wheel delta to horizontal scroll on
       desktop. Passes through when the carousel is at its edge
       so the page can scroll normally again.
       Must be registered as non-passive to call preventDefault.
    ─────────────────────────────────────────────────────────── */
    const _onWheel = (e) => {
      const el = scrollContainer.value
      if (!el) return

      // Let browser handle native horizontal trackpad swipes
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return

      const max     = el.scrollWidth - el.clientWidth
      const atEnd   = el.scrollLeft >= max - 1
      const atStart = el.scrollLeft <= 0

      // At boundary → release back to page scroll
      if ((e.deltaY > 0 && atEnd) || (e.deltaY < 0 && atStart)) return

      e.preventDefault()
      el.scrollLeft += e.deltaY
    }


    /* ─── J. Card spotlight — mouse-position tracker ────────────
       Sets CSS custom properties --mx / --my on each card so the
       ::before radial-gradient follows the cursor accurately.
       Runs on mousemove; no state update → no Vue re-render.
    ─────────────────────────────────────────────────────────── */
    const onCardMouseMove = (e) => {
      const card = e.currentTarget
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px')
      card.style.setProperty('--my', (e.clientY - rect.top)  + 'px')
    }


    /* ─── K. IntersectionObserver — card reveal ─────────────── */
    let revealObserver = null

    const _initReveal = () => {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              revealObserver.unobserve(entry.target)
            }
          })
        },
        {
          root:       scrollContainer.value,
          threshold:  0.12,
          rootMargin: '0px 200px 0px 200px'
        }
      )

      scrollContainer.value
        ?.querySelectorAll('.project-panel')
        .forEach((panel) => revealObserver.observe(panel))
    }


    /* ─── L. Lifecycle hooks ────────────────────────────────── */
    onMounted(() => {
      // Global listeners (passive where possible)
      window.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('resize', onResize,     { passive: true })

      // Render Lucide icons (CDN global)
      lucide.createIcons()

      // Wait one tick so the DOM (including v-for cards) is fully painted
      nextTick(() => {
        _updateScrollState()
        _initReveal()
        // Non-passive so we can call e.preventDefault()
        scrollContainer.value?.addEventListener('wheel', _onWheel, { passive: false })
      })
    })

    onUpdated(() => {
      // Re-scan for new icon data-attributes after reactive DOM updates
      lucide.createIcons()
    })

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', onResize)
      scrollContainer.value?.removeEventListener('wheel', _onWheel)
      revealObserver?.disconnect()
    })


    /* ─── M. Expose to template ─────────────────────────────── */
    return {
      // Data
      projects,

      // State
      isScrolled,
      mobileMenuOpen,
      scrollContainer,
      canScrollLeft,
      canScrollRight,
      scrollProgress,
      activeDot,

      // Computed — formatted strings (fixes the String() template bug)
      projectCountLabel,
      projectCountFull,

      // Methods
      pad,
      toggleMobileMenu,
      onTrackScroll,
      scrollByDir,
      scrollToDot,
      onCardMouseMove
    }
  }
}).mount('#app')
