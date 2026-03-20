import { useEffect, useRef } from 'react'
import { useScrollReveal, animateBars } from '../hooks/useScrollAnimation'

export default function GapMatrix({ gaps }) {
  const sectionRef = useRef()
  useScrollReveal(sectionRef)

  useEffect(() => {
    if (gaps?.length) {
      const timer = setTimeout(() => animateBars(sectionRef.current), 400)
      return () => clearTimeout(timer)
    }
  }, [gaps])

  if (!gaps?.length) return null

  return (
    <section ref={sectionRef} className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 bg-mc-red rounded-full" />
          <h2 className="font-mono text-xs text-mc-red tracking-[0.2em] uppercase">
            Gap Analysis
          </h2>
        </div>

        <div className="space-y-3">
          {gaps.map((g) => {
            const statusClass =
              g.status === 'matched'
                ? 'badge-matched'
                : g.status === 'partial'
                  ? 'badge-partial'
                  : 'badge-missing'

            return (
              <div key={g.skill} className="card-glow p-5 reveal-item">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-mc-text font-bold">
                      {g.skill.replace(/_/g, ' ')}
                    </span>
                    <span className={`badge ${statusClass}`}>{g.status}</span>
                  </div>
                  <span className="font-mono text-[10px] text-mc-text2">
                    PRI {g.priority_score.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Candidate bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-[10px] text-mc-text2">CANDIDATE</span>
                      <span className="font-mono text-[10px] text-mc-green">
                        {g.candidate_level}/4
                      </span>
                    </div>
                    <div className="skill-bar-track">
                      <div
                        className="skill-bar-fill bg-mc-green"
                        data-width={g.candidate_level * 25}
                      />
                    </div>
                  </div>

                  {/* Required bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-[10px] text-mc-text2">REQUIRED</span>
                      <span className="font-mono text-[10px] text-mc-amber">
                        {g.required_level}/4
                      </span>
                    </div>
                    <div className="skill-bar-track">
                      <div
                        className="skill-bar-fill bg-mc-amber"
                        data-width={g.required_level * 25}
                      />
                    </div>
                  </div>
                </div>

                {g.gap > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-px bg-mc-red/30" />
                    <span className="font-mono text-[10px] text-mc-red">
                      GAP: {g.gap} LEVEL{g.gap > 1 ? 'S' : ''}
                    </span>
                    <div className="flex-1 h-px bg-mc-red/30" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
