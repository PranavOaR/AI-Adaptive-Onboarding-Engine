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
          {gaps.filter(g => g.status !== 'irrelevant').map((g) => {
            const statusClass =
              g.status === 'matched'
                ? 'badge-matched'
                : g.status === 'partial'
                  ? 'badge-partial'
                  : g.status === 'missing'
                    ? 'badge-missing'
                    : 'badge bg-mc-border text-mc-text2' // irrelevant

            return (
              <div key={g.skill} className="card-glow p-5 reveal-item">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-mc-text font-bold">
                      {g.skill.replace(/_/g, ' ')}
                    </span>
                    <span className={`badge ${statusClass}`}>{g.status}</span>
                    {g.requirement_type && g.requirement_type !== 'none' && (
                       <span className={`font-mono text-[9px] px-2 py-0.5 border rounded ${g.requirement_type === 'required' ? 'text-mc-amber border-mc-amber/50' : 'text-mc-cyan border-mc-cyan/50'}`}>
                          {g.requirement_type.toUpperCase()}
                       </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-mc-text2">
                    PRI {Math.round(g.priority_score * 100) / 100}
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
                  <div className="mt-4 pt-3 border-t border-mc-border">
                    <div className="flex flex-col gap-2">
                      <p className="font-mono text-[10px] text-mc-text2 leading-relaxed">
                        <span className="text-mc-cyan">REQUIRED:</span> {g.why_required}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px] text-mc-text2 leading-relaxed">
                           <span className="text-mc-amber">CANDIDATE ({Math.round((g.candidate_confidence || 0) * 100)}% conf):</span> {g.why_candidate_level}
                        </p>
                      </div>
                    </div>
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
