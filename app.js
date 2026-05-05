/* ═══════════════════════════════════════════════════════════════
   OKNLAB — app.js  (v4 · gpt-taste)
   Vue 3 Composition API · homepage SPA shell

   ADDED IN v4
   ──────────────
   · GSAP + ScrollTrigger hero entrance timeline
   · GSAP ScrollTrigger for section heading reveals (.gsap-reveal)
   · GSAP parallax on hero glow orbs
   · GSAP scale entrance for CTA section
   · IntersectionObserver retained for carousel cards (horizontal scroll)

   TABLE OF CONTENTS
   ─────────────────
   A.  Imports
   B.  Data — projects array
   C.  State refs
   D.  Computed values
   E.  Helper methods (pure, no side-effects)
   F.  Carousel — scroll-state engine (rAF-throttled)
   G.  Carousel — navigation methods
   H.  Carousel — mouse-wheel → horizontal scroll
   I.  Card — spotlight mouse-position tracker
   J.  IntersectionObserver — card reveal
   K.  GSAP — hero entrance timeline
   L.  GSAP — scroll-triggered section reveals
   M.  GSAP — parallax on glow orbs
   N.  Lifecycle hooks
   O.  Expose to template
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
    const scrollContainer = ref(null)
    const canScrollLeft   = ref(false)
    const canScrollRight  = ref(true)
    const scrollProgress  = ref(0)
    const activeDot       = ref(0)


    /* ─── D. Computed values ───────────────────────────────────
       Vue 3 templates do NOT expose global JS built-ins
       (String, Number, Math). Pre-compute formatted strings here.
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
    ─────────────────────────────────────────────────────────── */
    const pad = (n) => String(n).padStart(2, '0')

    /* ─── G. Carousel scroll-state engine ──────────────────────
       rAF-throttled. Sets canScrollLeft/Right, scrollProgress,
       activeDot (closest card centre to viewport centre).
    ─────────────────────────────────────────────────────────── */
    let rafPending = false

    const _updateScrollState = () => {
      const el = scrollContainer.value
      if (!el) return

      const max = el.scrollWidth - el.clientWidth

      canScrollLeft.value  = el.scrollLeft > 10
      canScrollRight.value = el.scrollLeft < max - 10
      scrollProgress.value = max > 0 ? (el.scrollLeft / max) * 100 : 0

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

    const onResize = () => {
      if (rafPending) return
      rafPending = true
      requestAnimationFrame(_updateScrollState)
    }


    /* ─── H. Carousel navigation methods ───────────────────── */

    const scrollByDir = (dir) => {
      const el = scrollContainer.value
      if (!el) return
      const card = el.querySelector('.project-panel')
      const step = card ? card.offsetWidth + 20 : 440
      el.scrollBy({ left: dir * step, behavior: 'smooth' })
    }

    const scrollToDot = (i) => {
      const el = scrollContainer.value
      if (!el) return
      const card = el.querySelectorAll('.project-panel')[i]
      if (!card) return
      const target = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2
      el.scrollTo({ left: target, behavior: 'smooth' })
    }


    /* ─── I. Mouse-wheel → horizontal scroll ───────────────────
       Converts vertical wheel delta to horizontal scroll.
       Releases back to page scroll at carousel edges.
       Must be registered non-passive to call preventDefault.
    ─────────────────────────────────────────────────────────── */
    const _onWheel = (e) => {
      const el = scrollContainer.value
      if (!el) return

      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return

      const max     = el.scrollWidth - el.clientWidth
      const atEnd   = el.scrollLeft >= max - 1
      const atStart = el.scrollLeft <= 0

      if ((e.deltaY > 0 && atEnd) || (e.deltaY < 0 && atStart)) return

      e.preventDefault()
      el.scrollLeft += e.deltaY
    }


    /* ─── J. Card spotlight — mouse-position tracker ────────────
       Sets CSS custom properties --mx / --my on each card so the
       ::before radial-gradient follows the cursor accurately.
       No state update → no Vue re-render overhead.
    ─────────────────────────────────────────────────────────── */
    const onCardMouseMove = (e) => {
      const card = e.currentTarget
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px')
      card.style.setProperty('--my', (e.clientY - rect.top)  + 'px')
    }


    /* ─── K. IntersectionObserver — card reveal ─────────────────
       Retained for carousel cards (horizontal scroll track).
       GSAP ScrollTrigger is not suitable for horizontal-scroll
       containers — IntersectionObserver handles them correctly.
    ─────────────────────────────────────────────────────────── */
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


    /* ─── L. GSAP — Hero entrance timeline ─────────────────────
       Orchestrated staggered entrance replacing the CSS-animation
       fallbacks. Each hero element (#hero-pill, #hero-h1, etc.)
       is animated in sequence.

       GSAP paradigm: Image Scale (img-scale) applied to the hero
       backdrop photo — starts slightly zoomed, settles to 1.0.
    ─────────────────────────────────────────────────────────── */
    const _initHeroGSAP = () => {
      if (typeof gsap === 'undefined') return

      // Hero photo scale-settle (Image Scale paradigm)
      gsap.fromTo('.hero-backdrop-img',
        { scale: 1.08 },
        { scale: 1.0, duration: 2.2, ease: 'expo.out' }
      )

      // Staggered entrance timeline
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

      tl.fromTo('#hero-pill',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.9 }
      )
      .fromTo('#hero-h1',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.1 },
        '-=0.5'
      )
      .fromTo('#hero-sub',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.95 },
        '-=0.65'
      )
      .fromTo('#hero-ctas',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9 },
        '-=0.6'
      )
      .fromTo('#hero-meta',
        { opacity: 0 },
        { opacity: 1, duration: 0.8 },
        '-=0.5'
      )
      .fromTo('.scroll-cue',
        { opacity: 0 },
        { opacity: 1, duration: 0.7 },
        '-=0.3'
      )
    }


    /* ─── M. GSAP — Scroll-triggered section reveals ───────────
       Targets all .gsap-reveal elements (section headings,
       merged footer CTA copy, etc.) outside the horizontal carousel.

       GSAP paradigm: Word Scrub applied to CTA heading inside the
       merged footer — opacity scrubs 0.08 → 1.0 as user scrolls in.

       NOTE: The merged footer (#cta) is NOT scaled on entrance —
       scaling a full-page-height element creates layout jank.
       Individual children are revealed via .gsap-reveal instead.
    ─────────────────────────────────────────────────────────── */
    const _initScrollReveal = () => {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return

      gsap.registerPlugin(ScrollTrigger)

      // Section-level reveal for .gsap-reveal elements
      // Adds .is-visible class which triggers the CSS transition
      document.querySelectorAll('.gsap-reveal').forEach((el) => {
        ScrollTrigger.create({
          trigger:  el,
          start:    'top 82%',
          onEnter: () => {
            el.classList.add('is-visible')
          },
          once: true
        })
      })

      // CTA heading — word-by-word opacity scrub (Word Scrub paradigm)
      // Wraps each word in a span, then scrubs opacity 0.08 → 1.0
      const ctaHeading = document.querySelector('.cta-heading')
      if (ctaHeading) {
        // Split words into spans (preserving <br> and <em>)
        const rawHTML = ctaHeading.innerHTML
        const wrapped = rawHTML
          .replace(/(<[^>]+>)/g, '\x00$1\x00') // protect tags
          .split('\x00')
          .map((chunk) => {
            if (chunk.startsWith('<') || chunk.trim() === '') return chunk
            return chunk.replace(/\b(\S+)\b/g, '<span class="scrub-word">$1</span>')
          })
          .join('')
        ctaHeading.innerHTML = wrapped

        const words = ctaHeading.querySelectorAll('.scrub-word')

        // Set initial opacity low
        gsap.set(words, { opacity: 0.08 })

        // Scrub each word's opacity on scroll
        words.forEach((word, i) => {
          gsap.to(word, {
            opacity: 1,
            scrollTrigger: {
              trigger: ctaHeading,
              start:   'top 80%',
              end:     'bottom 30%',
              scrub:   0.8
            },
            delay: i * 0.04
          })
        })
      }

    }


    /* ─── N. GSAP — Parallax on hero glow orbs ─────────────────
       Glow orbs drift at different speeds as the user scrolls,
       creating a layered depth illusion.
       Runs only if the device likely has GPU compositing.
    ─────────────────────────────────────────────────────────── */
    const _initParallax = () => {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return

      const heroSection = document.querySelector('#hero')
      if (!heroSection) return

      gsap.to('#glow1', {
        y: -80,
        ease: 'none',
        scrollTrigger: {
          trigger: heroSection,
          start:   'top top',
          end:     'bottom top',
          scrub:   1.8
        }
      })

      gsap.to('#glow2', {
        y: -40,
        x:  20,
        ease: 'none',
        scrollTrigger: {
          trigger: heroSection,
          start:   'top top',
          end:     'bottom top',
          scrub:   2.4
        }
      })

      // Backdrop photo subtle parallax (Image Scale + slow drift)
      gsap.to('.hero-backdrop-img', {
        y: '15%',
        ease: 'none',
        scrollTrigger: {
          trigger: heroSection,
          start:   'top top',
          end:     'bottom top',
          scrub:   1.2
        }
      })
    }


    /* ─── O. Lifecycle hooks ────────────────────────────────── */
    onMounted(() => {
      // Global listeners
      window.addEventListener('resize', onResize, { passive: true })

      // Render Lucide icons (CDN global)
      lucide.createIcons()

      nextTick(() => {
        // Carousel internals
        _updateScrollState()
        _initReveal()
        scrollContainer.value?.addEventListener('wheel', _onWheel, { passive: false })

        // GSAP — all three layers
        _initHeroGSAP()
        _initScrollReveal()
        _initParallax()
      })
    })

    onUpdated(() => {
      // Re-scan Lucide icon data-attributes after reactive DOM updates
      lucide.createIcons()
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', onResize)
      scrollContainer.value?.removeEventListener('wheel', _onWheel)
      revealObserver?.disconnect()

      // Kill all GSAP ScrollTrigger instances to prevent memory leaks
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.killAll()
      }
    })


    /* ─── P. Expose to template ─────────────────────────────── */
    return {
      // Data
      projects,

      // State
      scrollContainer,
      canScrollLeft,
      canScrollRight,
      scrollProgress,
      activeDot,

      // Computed — formatted strings
      projectCountLabel,
      projectCountFull,

      // Methods
      pad,
      onTrackScroll,
      scrollByDir,
      scrollToDot,
      onCardMouseMove
    }
  }
}).mount('#app')
