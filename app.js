/* ══════════════════════════════════════════════════════
   OKNLAB — app.js
   Vue 3 Composition API — portfolio homepage
   Requires: lucide (global), Vue 3 (ESM CDN)
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

        /* ── Page scroll → sticky header ── */
        const handleScroll = () => {
            isScrolled.value = window.scrollY > 20
        }

        const toggleMobileMenu = () => {
            mobileMenuOpen.value = !mobileMenuOpen.value
        }

        /* ── Carousel scroll state (via rAF) ── */
        let ticking = false

        const updateScrollState = () => {
            const el = scrollContainer.value
            if (!el) return

            const max = el.scrollWidth - el.clientWidth
            canScrollLeft.value  = el.scrollLeft > 10
            canScrollRight.value = el.scrollLeft < max - 10
            scrollProgress.value = max > 0 ? (el.scrollLeft / max) * 100 : 0

            // Active dot = card closest to viewport center
            const center = el.scrollLeft + el.clientWidth / 2
            const cards  = el.querySelectorAll('.project-panel')
            let closest = 0
            let minDist = Infinity
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

        /* ── Navigate carousel by one card ── */
        const scrollByDir = (dir) => {
            const el = scrollContainer.value
            if (!el) return
            const card = el.querySelector('.project-panel')
            const dist = card ? card.offsetWidth + 24 : 420 // 24 = gap-6
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

        /* ── Mouse-wheel → horizontal scroll (desktop) ── */
        const onWheel = (e) => {
            const el = scrollContainer.value
            if (!el) return

            // Horizontal trackpad swipe: let browser handle it
            if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return

            const max    = el.scrollWidth - el.clientWidth
            const atEnd  = el.scrollLeft >= max - 1
            const atStart = el.scrollLeft <= 0

            // At boundary → let page scroll normally
            if ((e.deltaY > 0 && atEnd) || (e.deltaY < 0 && atStart)) return

            e.preventDefault()
            el.scrollLeft += e.deltaY
        }

        /* ── IntersectionObserver for card reveal ── */
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

        /* ── Expose to template ── */
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
            scrollToDot
        }
    }
}).mount('#app')
