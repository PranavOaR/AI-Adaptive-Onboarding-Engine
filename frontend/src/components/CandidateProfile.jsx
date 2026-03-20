import { useEffect, useRef } from 'react'
import { useScrollReveal, animateBars } from '../hooks/useScrollAnimation'

export default function CandidateProfile({ profile }) {
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
    <section ref={sectionRef} className="py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-1">
            Candidate Profile
          </h2>
          <p className="text-sm text-text-muted">Skills detected from your resume</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profile.map((skill) => (
            <div key={skill.skill} className="card p-5 reveal-item">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text-primary">
                  {skill.skill.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-text-muted">
                  Level {skill.level}/4
                </span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bg-success"
                  data-width={skill.level * 25}
                />
              </div>
              {skill.evidence?.[0] && (
                <p className="text-xs text-text-dim mt-2.5 leading-relaxed line-clamp-2">
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
