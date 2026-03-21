import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STATS = [
  { value: 50, suffix: '+', label: 'Skills tracked' },
  { value: 12, suffix: '', label: 'Code challenges' },
  { value: 9, suffix: '', label: 'Role profiles' },
  { value: 4, suffix: '', label: 'Difficulty levels' },
]

export default function StatsSection() {
  const containerRef = useRef()
  const numRefs = useRef([])

  useEffect(() => {
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        numRefs.current.forEach((el, i) => {
          if (!el) return
          gsap.fromTo({ val: 0 }, { val: STATS[i].value }, {
            duration: 1.2,
            ease: 'power2.out',
            onUpdate() { el.textContent = Math.round(this.targets()[0].val) + STATS[i].suffix },
          })
        })
      },
    })
  }, [])

  return (
    <section ref={containerRef} className="py-20 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
        {STATS.map((s, i) => (
          <div key={i} className="text-center">
            <div
              ref={el => numRefs.current[i] = el}
              className="text-3xl font-semibold text-text-primary mb-1"
            >
              0{s.suffix}
            </div>
            <p className="text-xs text-text-dim">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
