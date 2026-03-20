import { useEffect, useRef } from 'react'
import { useScrollReveal, animateBars } from '../hooks/useScrollAnimation'

export default function RequiredProfile({ profile }) {
  const sectionRef = useRef()
  useScrollReveal(sectionRef)

  useEffect(() => {
    if (profile?.length) {
      const timer = setTimeout(() => animateBars(sectionRef.current), 300)
      return () => clearTimeout(timer)
    }
  }, [profile])

  if (!profile?.length) return null

  return (
    <section ref={sectionRef} className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 bg-mc-amber rounded-full" />
          <h2 className="font-mono text-xs text-mc-amber tracking-[0.2em] uppercase">
            Required Profile
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profile.map((skill) => (
            <div key={skill.skill} className="card-glow p-4 reveal-item">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm text-mc-text">
                  {skill.skill.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-xs text-mc-text2">
                  LVL {skill.level}/4
                </span>
              </div>
              <div className="skill-bar-track">
                <div
                  className="skill-bar-fill bg-mc-amber"
                  data-width={skill.level * 25}
                />
              </div>
              {skill.evidence?.[0] && (
                <p className="text-[10px] text-mc-text2/60 mt-2 truncate font-body">
                  &ldquo;{skill.evidence[0]}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
