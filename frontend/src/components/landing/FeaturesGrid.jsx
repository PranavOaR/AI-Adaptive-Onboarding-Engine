import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FEATURES = [
  {
    title: 'Resume parsing',
    desc: 'Extracts skills from PDF, DOCX, and TXT with alias mapping across 50+ technologies.',
  },
  {
    title: 'Gap analysis',
    desc: 'Compares your profile against JD requirements with priority scoring and proficiency levels.',
  },
  {
    title: 'Learning roadmap',
    desc: 'Topologically sorted course recommendations from foundation through role-specific phases.',
  },
  {
    title: 'Code challenges',
    desc: 'Monaco editor with Judge0 execution across 12 challenges in Python, JS, and Java.',
  },
  {
    title: 'Interview prep',
    desc: 'Role-specific questions generated from your gap profile — technical, behavioral, and scenario.',
  },
  {
    title: 'AI assistant',
    desc: 'Ask questions about your roadmap and gaps. Contextual answers powered by LLM inference.',
  },
]

export default function FeaturesGrid({ id }) {
  const containerRef = useRef()

  useEffect(() => {
    const items = containerRef.current?.querySelectorAll('.feature-item')
    if (!items) return

    gsap.fromTo(items,
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: containerRef.current, start: 'top 80%' },
      }
    )
  }, [])

  return (
    <section id={id} className="py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs text-text-dim uppercase tracking-widest mb-3">Capabilities</p>
        <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-14">
          Everything you need to close the gap.
        </h2>

        <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-item">
              <h3 className="text-sm font-medium text-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-dim leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
