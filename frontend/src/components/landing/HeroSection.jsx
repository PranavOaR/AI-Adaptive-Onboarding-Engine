import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function HeroSection({ onOpenAuth, onScrollToFeatures }) {
  const headlineRef = useRef()
  const subRef = useRef()
  const ctaRef = useRef()

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    tl.fromTo(headlineRef.current.children,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out' }
    )
    .fromTo(subRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3'
    )
    .fromTo(ctaRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2'
    )
  }, [])

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-14">
      <div className="max-w-3xl mx-auto text-center">
        <h1 ref={headlineRef} className="text-[clamp(2.5rem,7vw,5.5rem)] font-semibold text-text-primary leading-[1.05] tracking-tight mb-8">
          <span className="block">Know your gaps.</span>
          <span className="block text-text-muted">Own your path.</span>
        </h1>

        <p ref={subRef} className="text-base sm:text-lg text-text-muted max-w-xl mx-auto mb-10 leading-relaxed">
          Upload a resume and job description. Get a skill-gap analysis,
          a learning roadmap, and interview prep — in seconds.
        </p>

        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onOpenAuth?.('signup')}
            className="text-sm text-text-primary bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.06] px-6 py-3 rounded-md transition-colors"
          >
            Get started
          </button>
          <button
            onClick={onScrollToFeatures}
            className="text-sm text-text-dim hover:text-text-muted transition-colors"
          >
            See how it works
          </button>
        </div>
      </div>
    </section>
  )
}
