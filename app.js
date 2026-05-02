/* ══════════════════════════════════════════════════════
   OKNLAB — app.js
   Vue 3 Composition API · portfolio homepage
   Requires: lucide (global CDN), Vue 3 (ESM CDN)
══════════════════════════════════════════════════════ */

import {
  createApp,
  ref,
  onMounted,
  onUpdated,
  onBeforeUnmount,
  nextTick
} from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

createApp({
  setup() {

    /* ── State ── */
    const isScrolled      = ref(false)
    const mobileMenuOpen  = ref(false)
    const scrollContainer = ref(null)
    const canScrollLeft   = ref(false)
    const canScrollRight  = ref(true)
    const scrollProgress  = ref(0)
    const activeDot       = ref(0)

    /* ── Projects data ── */
    const projects = [
      {
        title: 'CodeSynthesizer X',
        category: 'DevTools',
        description: 'An IDE plugin that predicts your next logic block, not just the next line. Transformer-based architecture trained on production codebases to understand intent, not syntax.',
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
        description: 'Visual workflow builder for connecting API endpoints without glue code. Drag, connect, deploy — with built-in error handling and retry logic.',
        icon: 'workflow',
        logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg',
        link: '#project-flow',
        isNew: false
      },
      {
        title: 'VisionCraft API',
        category: 'Media',
        description: 'Enterprise image manipulation API for e-commerce at scale. Background removal, color correction, and format optimization — processing millions of images per day.',
        icon: 'aperture',
        logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opencv/opencv-original.svg',
        link: '#project-vision',
        isNew: false
      },
      {
        title: 'SecureGuard',
        category: 'Security',
        description: 'AI-powered vulnerability scanner with real-time detection. Continuous monitoring, automated patch suggestions, and compliance reporting for SOC2, HIPAA, and ISO 27001.',
        icon: 'shield-check',
        logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
        link: '#project-secure',
        isNew: false
      }
    ]

    /* ── Sticky header scroll state ── */
    const handleScroll = () => {
      isScrolled.value = window.scrollY > 20
    }

    /* ── Mobile menu toggle ── */
    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value
    }

    /* ── Carousel scroll state (rAF-throttled) ── */
    let ticking = false

    const updateScrollState = () => {
      const el = scrollContainer.value
      if (!el) return

      const max = el.scrollWidth - el.clientWidth
      canScrollLeft.value  = el.scrollLeft > 10
      canScrollRight.value = el.scrollLeft < max - 10
      scrollProgress.value = max > 0 ? (el.scrollLeft / max) * 100 : 0

      // Active dot — card closest to viewport center
      const center = el.scrollLeft + el.clientWidth / 2
      const cards  = el.querySelectorAll('.project-panel')
      let closest = 0
      let minDist  = Infinity
      cards.forEach((card, i) => {
        const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
        if (d < minDist) { minDist = d; closest = i }
      })
      activeDot.value = closest
    }

    const onTrackScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { updateScrollState(); ticking = false })
        ticking = true
      }
    }

    /* ── Navigate carousel by one card width ── */
    const scrollByDir = (dir) => {
      const el = scrollContainer.value
      if (!el) return
      const card = el.querySelector('.project-panel')
      const dist = card ? card.offsetWidth + 20 : 440 // 20 = gap
      el.scrollBy({ left: dir * dist, behavior: 'smooth' })
    }

    /* ── Jump carousel to dot index ── */
    const scrollToDot = (i) => {
      const el = scrollContainer.value
      if (!el) return
      const card = el.querySelectorAll('.project-panel')[i]
      if (!card) return
      const target = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2
      el.scrollTo({ left: target, behavior: 'smooth' })
    }

    /* ── Wheel → horizontal scroll (desktop) ── */
    const onWheel = (e) => {
      const el = scrollContainer.value
      if (!el) return
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return // horizontal trackpad

      const max     = el.scrollWidth - el.clientWidth
      const atEnd   = el.scrollLeft >= max - 1
      const atStart = el.scrollLeft <= 0
      if ((e.deltaY > 0 && atEnd) || (e.deltaY < 0 && atStart)) return

      e.preventDefault()
      el.scrollLeft += e.deltaY
    }

    /* ── Spotlight: track mouse per card ── */
    const onCardMouseMove = (e) => {
      const card = e.currentTarget
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px')
      card.style.setProperty('--my', (e.clientY - rect.top) + 'px')
    }

    /* ── IntersectionObserver — card reveal ── */
    const initReveal = () => {
      const observer = new IntersectionObserver(
        (entries) => entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }),
        {
          root:       scrollContainer.value,
          threshold:  0.12,
          rootMargin: '0px 180px 0px 180px'
        }
      )
      scrollContainer.value
        ?.querySelectorAll('.project-panel')
        .forEach((p) => observer.observe(p))
    }

    /* ── Lifecycle ── */
    onMounted(() => {
      window.addEventListener('scroll', handleScroll,      { passive: true })
      window.addEventListener('resize', updateScrollState, { passive: true })
      lucide.createIcons()

      nextTick(() => {
        updateScrollState()
        initReveal()
        // Must be non-passive to call preventDefault
        scrollContainer.value?.addEventListener('wheel', onWheel, { passive: false })
      })
    })

    onUpdated(() => {
      lucide.createIcons()
    })

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateScrollState)
      scrollContainer.value?.removeEventListener('wheel', onWheel)
    })

    return {
      isScrolled,
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
      scrollToDot,
      onCardMouseMove
    }
  }
}).mount('#app')
