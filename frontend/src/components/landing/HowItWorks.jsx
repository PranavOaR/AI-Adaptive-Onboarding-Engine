import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  { num: '01', label: 'Upload', desc: 'Drop your resume and paste or upload the job description.' },
  { num: '02', label: 'Analyze', desc: 'Skills extracted, proficiency estimated, target role detected.' },
  { num: '03', label: 'Learn', desc: 'Personalized course roadmap sorted by priority and prerequisites.' },
  { num: '04', label: 'Build', desc: 'Challenges, progress tracking, interview prep, and PDF export.' },
]

export default function HowItWorks({ id }) {
  const containerRef = useRef()

  useEffect(() => {
    const steps = containerRef.current?.querySelectorAll('.step-item')
    if (!steps) return

    gsap.fromTo(steps,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out',
        scrollTrigger: { trigger: containerRef.current, start: 'top 78%' },
      }
    )
  }, [])

  return (
    <section id={id} className="py-28 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs text-text-dim uppercase tracking-widest mb-3">Process</p>
        <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-14">
          From resume to roadmap in minutes.
        </h2>

        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {STEPS.map((step, i) => (
            <div key={i} className="step-item">
              <span className="text-xs text-text-dim font-mono">{step.num}</span>
              <h3 className="text-sm font-medium text-text-primary mt-1 mb-2">{step.label}</h3>
              <p className="text-sm text-text-dim leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
