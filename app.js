/* ═══════════════════════════════════════════════════════════════
   OKNLAB — app.js  (v4)
   Vue 3 Composition API · homepage shell

   TABLE OF CONTENTS
   ─────────────────
   A.  Imports
   B.  Projects data
   C.  Reactive state
   D.  Computed labels
   E.  Pure helpers
   F.  Header
   G.  Carousel — scroll state engine
   H.  Carousel — navigation
   I.  Carousel — drag-to-scroll
   J.  Carousel — wheel intercept
   K.  Card spotlight
   L.  IntersectionObserver — card reveal
   M.  Lifecycle
   N.  Template exports
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
        description: 'Enterprise image manipulation API for e-commerce at scale. Background removal, colour correction, and format optimisation — processing millions of images daily.',
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


    /* ─── C. Reactive state ────────────────────────────────── */
    const isScrolled      = ref(false)
    const mobileMenuOpen  = ref(false)
    const scrollContainer = ref(null)
    const canScrollLeft   = ref(false)
    const canScrollRight  = ref(true)
    const scrollProgress  = ref(0)
    const activeDot       = ref(0)


    /* ─── D. Computed labels ───────────────────────────────────
       Vue 3 templates have no access to global JS builtins
       (String, Number, Math). All formatting lives here.
    ─────────────────────────────────────────────────────────── */
    const projectCountLabel = computed(() =>
      String(projects.length).padStart(2, '0')
    )

    const projectCountFull = computed(() =>
      `${projectCountLabel.value} Projects`
    )


    /* ─── E. Pure helpers ──────────────────────────────────── */
    const pad = (n) => String(n).padStart(2, '0')


    /* ─── F. Header ────────────────────────────────────────── */
    const handleScroll = () => {
      isScrolled.value = window.scrollY > 24
    }

    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value
    }


    /* ─── G. Carousel — scroll state engine ─────────────────
       rAF-throttled to one frame per tick.
       Updates: canScrollLeft/Right, scrollProgress, activeDot.
    ─────────────────────────────────────────────────────────── */
    let rafPending = false

    const _updateScrollState = () => {
      const el = scrollContainer.value
      if (!el) { rafPending = false; return }

      const max = el.scrollWidth - el.clientWidth

      canScrollLeft.value  = el.scrollLeft > 8
      canScrollRight.value = el.scrollLeft < max - 8
      scrollProgress.value = max > 0 ? (el.scrollLeft / max) * 100 : 0

      // Dot = card whose centre is closest to viewport centre
      const vpCentre = el.scrollLeft + el.clientWidth / 2
      const cards    = el.querySelectorAll('.project-panel')
      let closestIdx = 0
      let minDist    = Infinity

      cards.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - vpCentre)
        if (dist < minDist) { minDist = dist; closestIdx = i }
      })

      activeDot.value = closestIdx
      rafPending = false
    }

    const _scheduleUpdate = () => {
      if (rafPending) return
      rafPending = true
      requestAnimationFrame(_updateScrollState)
    }

    const onTrackScroll = _scheduleUpdate
    const onResize      = _scheduleUpdate


    /* ─── H. Carousel — navigation ─────────────────────────── */
    const scrollByDir = (dir) => {
      const el = scrollContainer.value
      if (!el) return
      const card = el.querySelector('.project-panel')
      const step = card ? card.offsetWidth + parseInt(getComputedStyle(el).gap || '18') : 440
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


    /* ─── I. Drag-to-scroll ─────────────────────────────────
       Click-drag on the track scrolls horizontally.
       Uses pointercapture so leaving the element mid-drag works.
    ─────────────────────────────────────────────────────────── */
    let dragOriginX  = 0
    let dragScrollX  = 0
    let isDragging   = false

    const onTrackPointerDown = (e) => {
      // Ignore right-clicks and touch (touch has native momentum)
      if (e.button !== 0 || e.pointerType === 'touch') return
      const el = scrollContainer.value
      if (!el) return

      isDragging  = true
      dragOriginX = e.clientX
      dragScrollX = el.scrollLeft

      el.setPointerCapture(e.pointerId)
      el.classList.add('is-dragging')
    }

    const onTrackPointerMove = (e) => {
      if (!isDragging) return
      const el = scrollContainer.value
      if (!el) return
      const dx = e.clientX - dragOriginX
      el.scrollLeft = dragScrollX - dx
    }

    const onTrackPointerUp = (e) => {
      if (!isDragging) return
      isDragging = false
      const el = scrollContainer.value
      if (!el) return
      el.releasePointerCapture(e.pointerId)
      el.classList.remove('is-dragging')
    }


    /* ─── J. Wheel intercept ────────────────────────────────
       Vertical wheel → horizontal scroll.
       Releases to page scroll when carousel is at its edge.
       Must be non-passive to call preventDefault.
    ─────────────────────────────────────────────────────────── */
    const _onWheel = (e) => {
      const el = scrollContainer.value
      if (!el) return
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return   // native horizontal swipe

      const max     = el.scrollWidth - el.clientWidth
      const atStart = el.scrollLeft <= 1
      const atEnd   = el.scrollLeft >= max - 1

      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return

      e.preventDefault()
      el.scrollLeft += e.deltaY * 1.2
    }


    /* ─── K. Card spotlight ─────────────────────────────────
       Sets --mx / --my on each card for the CSS radial gradient.
       Pure DOM mutation — no reactive state, no re-render.
    ─────────────────────────────────────────────────────────── */
    const onCardMouseMove = (e) => {
      const card = e.currentTarget
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px')
      card.style.setProperty('--my', (e.clientY - rect.top)  + 'px')
    }


    /* ─── L. IntersectionObserver — card reveal ─────────────── */
    let revealObserver = null

    const _initReveal = () => {
      revealObserver?.disconnect()
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
          threshold:  0.10,
          rootMargin: '0px 160px 0px 160px'
        }
      )

      scrollContainer.value
        ?.querySelectorAll('.project-panel')
        .forEach((panel) => revealObserver.observe(panel))
    }


    /* ─── M. Lifecycle ──────────────────────────────────────── */
    onMounted(() => {
      window.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('resize', onResize,     { passive: true })

      lucide.createIcons()

      nextTick(() => {
        _updateScrollState()
        _initReveal()

        const el = scrollContainer.value
        if (el) {
          el.addEventListener('wheel',        _onWheel,            { passive: false })
          el.addEventListener('pointerdown',  onTrackPointerDown)
          el.addEventListener('pointermove',  onTrackPointerMove)
          el.addEventListener('pointerup',    onTrackPointerUp)
          el.addEventListener('pointercancel',onTrackPointerUp)
        }
      })
    })

    onUpdated(() => {
      lucide.createIcons()
    })

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', onResize)

      const el = scrollContainer.value
      if (el) {
        el.removeEventListener('wheel',        _onWheel)
        el.removeEventListener('pointerdown',  onTrackPointerDown)
        el.removeEventListener('pointermove',  onTrackPointerMove)
        el.removeEventListener('pointerup',    onTrackPointerUp)
        el.removeEventListener('pointercancel',onTrackPointerUp)
      }

      revealObserver?.disconnect()
    })


    /* ─── N. Template exports ───────────────────────────────── */
    return {
      projects,
      isScrolled,
      mobileMenuOpen,
      scrollContainer,
      canScrollLeft,
      canScrollRight,
      scrollProgress,
      activeDot,
      projectCountLabel,
      projectCountFull,
      pad,
      toggleMobileMenu,
      onTrackScroll,
      scrollByDir,
      scrollToDot,
      onCardMouseMove
    }
  }
}).mount('#app')
