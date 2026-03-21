import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const RESUME_LINES = [
  { type: 'name', text: 'Alex Johnson', highlight: false },
  { type: 'contact', text: 'alex@example.com  ·  GitHub  ·  LinkedIn', highlight: false },
  { type: 'section', text: 'SKILLS', highlight: false },
  { type: 'skill', text: 'Python · TensorFlow · PyTorch', highlight: true },
  { type: 'skill', text: 'React · TypeScript · Node.js', highlight: true },
  { type: 'skill', text: 'Docker · Kubernetes · CI/CD', highlight: true },
  { type: 'section', text: 'EXPERIENCE', highlight: false },
  { type: 'job', text: 'ML Intern — AcmeCorp (2023)', highlight: false },
  { type: 'bullet', text: '  Built NLP pipeline reducing latency 40%', highlight: false },
  { type: 'bullet', text: '  Deployed REST APIs with FastAPI + PostgreSQL', highlight: false },
  { type: 'section', text: 'EDUCATION', highlight: false },
  { type: 'edu', text: 'B.Tech Computer Science — IISc 2024', highlight: false },
]

const ANALYSIS_BARS = [
  { label: 'Python', match: 92 },
  { label: 'React', match: 78 },
  { label: 'ML / AI', match: 65 },
  { label: 'Docker', match: 45 },
  { label: 'TypeScript', match: 80 },
]

export default function ResumeScrollScene() {
  const sectionRef = useRef()
  const resumeRef = useRef()
  const panelRef = useRef()
  const lineRefs = useRef([])
  const barRefs = useRef([])

  useEffect(() => {
    const section = sectionRef.current
    const lines = lineRefs.current
    const bars = barRefs.current

    gsap.set(resumeRef.current, { x: 200, opacity: 0 })
    gsap.set(panelRef.current, { x: -140, opacity: 0 })
    gsap.set(lines, { opacity: 0, x: 8 })
    bars.forEach(b => b && gsap.set(b, { scaleX: 0, transformOrigin: 'left center' }))

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=2400',
        pin: true,
        scrub: 1,
        anticipatePin: 1,
      },
    })

    // Phase 1: resume flies in
    tl.to(resumeRef.current, { x: 0, opacity: 1, duration: 2, ease: 'power3.out' }, 0)

    // Phase 2: lines appear
    tl.to(lines, { opacity: 1, x: 0, duration: 0.5, stagger: 0.15, ease: 'power2.out' }, 2)

    // Phase 3: skill lines get subtle highlight
    lines.forEach((line, i) => {
      if (RESUME_LINES[i]?.highlight) {
        tl.to(line, {
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '4px',
          duration: 0.4,
        }, 5 + i * 0.12)
      }
    })

    // Phase 4: analysis panel + bars
    tl.to(panelRef.current, { x: 0, opacity: 1, duration: 1.8, ease: 'power3.out' }, 6)
    bars.forEach((bar, i) => {
      if (bar) tl.to(bar, { scaleX: 1, duration: 1, ease: 'power2.out' }, 6.3 + i * 0.18)
    })

    return () => ScrollTrigger.getAll().forEach(t => t.vars.trigger === section && t.kill())
  }, [])

  return (
    <section ref={sectionRef} className="relative h-screen overflow-hidden bg-surface-0">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10 text-center">
        <p className="text-xs text-text-dim uppercase tracking-widest mb-2">How it looks</p>
        <h2 className="text-xl sm:text-2xl font-semibold text-text-primary">Your resume, analysed in real time</h2>
      </div>

      <div className="absolute inset-0 flex items-center justify-center gap-8 px-6 pt-20">
        {/* Resume card */}
        <div
          ref={resumeRef}
          className="w-80 lg:w-96 bg-surface-1 border border-border rounded-xl p-6 flex-shrink-0"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-text-dim/40" />
              <span className="w-2 h-2 rounded-full bg-text-dim/40" />
              <span className="w-2 h-2 rounded-full bg-text-dim/40" />
            </div>
            <span className="text-[11px] text-text-dim ml-2">resume.pdf</span>
          </div>

          <div className="space-y-1">
            {RESUME_LINES.map((line, i) => (
              <div
                key={i}
                ref={el => lineRefs.current[i] = el}
                className={`px-1.5 py-0.5 ${
                  line.type === 'name' ? 'text-sm font-medium text-text-primary' :
                  line.type === 'section' ? 'text-[10px] font-medium text-text-muted tracking-widest uppercase mt-2' :
                  line.type === 'job' || line.type === 'edu' ? 'text-xs text-text-body' :
                  'text-[11px] text-text-dim'
                }`}
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>

        {/* Analysis panel */}
        <div
          ref={panelRef}
          className="w-72 lg:w-80 bg-surface-1 border border-border rounded-xl p-6 flex-shrink-0"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-medium text-text-primary">Skill match</h3>
            <span className="text-xs text-text-muted">72%</span>
          </div>

          <div className="space-y-4">
            {ANALYSIS_BARS.map((bar, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-text-dim">{bar.label}</span>
                  <span className="text-xs text-text-dim">{bar.match}%</span>
                </div>
                <div className="h-1 bg-surface-0 rounded-full overflow-hidden">
                  <div
                    ref={el => barRefs.current[i] = el}
                    className="h-full rounded-full bg-text-muted"
                    style={{ width: `${bar.match}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-[11px] text-text-dim mb-2">Top gaps</p>
            <div className="flex flex-wrap gap-1.5">
              {['Docker', 'Kubernetes', 'System Design'].map(g => (
                <span key={g} className="text-[10px] text-text-muted bg-white/[0.04] px-2 py-0.5 rounded">{g}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
