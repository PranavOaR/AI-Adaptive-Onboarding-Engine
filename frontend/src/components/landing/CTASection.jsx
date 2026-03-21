import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function CTASection({ onOpenAuth }) {
  const containerRef = useRef()

  useEffect(() => {
    gsap.fromTo(containerRef.current,
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: containerRef.current, start: 'top 85%' },
      }
    )
  }, [])

  return (
    <section className="py-28 px-6 border-t border-border">
      <div ref={containerRef} className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-4">
          Start closing the gap.
        </h2>
        <p className="text-sm text-text-dim mb-8 max-w-md mx-auto">
          Free to use. No credit card required.
        </p>

        <button
          onClick={() => onOpenAuth?.('signup')}
          className="text-sm text-text-primary bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.06] px-6 py-3 rounded-md transition-colors"
        >
          Get started free
        </button>
      </div>
    </section>
  )
}
