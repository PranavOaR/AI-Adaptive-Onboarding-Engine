import { useEffect, useRef, useState } from 'react'
import { useScrollReveal, animateBars } from '../hooks/useScrollAnimation'

function GapCard({ g }) {
  const [expanded, setExpanded] = useState(false)
  const hasEvidence = g.gap > 0 && (g.why_required || g.why_candidate_level)

  const statusPill =
    g.status === 'matched'
      ? 'pill-success'
      : g.status === 'partial'
        ? 'pill-warning'
        : 'pill-error'

  return (
    <div className="card p-6 reveal-item">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-base font-semibold text-text-primary">
            {g.skill.replace(/_/g, ' ')}
          </span>
          <span className={`pill ${statusPill}`}>{g.status}</span>
          {g.requirement_type && g.requirement_type !== 'none' && (
            <span className={`pill ${g.requirement_type === 'required' ? 'pill-warning' : 'pill-neutral'}`}>
              {g.requirement_type}
            </span>
          )}
        </div>
        <span className="text-xs text-text-dim shrink-0 ml-2">
          Priority {Math.round(g.priority_score * 100) / 100}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Candidate bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-medium text-text-muted">You</span>
            <span className="text-xs text-success">
              {g.candidate_level}/4
            </span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill bg-success"
              data-width={g.candidate_level * 25}
            />
          </div>
        </div>

        {/* Required bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-medium text-text-muted">Required</span>
            <span className="text-xs text-warning">
              {g.required_level}/4
            </span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill bg-warning"
              data-width={g.required_level * 25}
            />
          </div>
        </div>
      </div>

      {hasEvidence && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-accent hover:text-accent-hover transition-colors"
            >
              Show reasoning...
            </button>
          ) : (
            <div className="space-y-3">
              {g.why_required && (
                <div>
                  <span className="text-xs font-semibold text-accent uppercase tracking-wide">Why required</span>
                  <p className="text-sm text-text-muted leading-relaxed mt-1">{g.why_required}</p>
                </div>
              )}
              {g.why_candidate_level && (
                <div>
                  <span className="text-xs font-semibold text-warning uppercase tracking-wide">
                    Your level
                    {g.candidate_confidence != null && (
                      <span className="text-text-dim font-normal ml-1">
                        ({Math.round(g.candidate_confidence * 100)}% confidence)
                      </span>
                    )}
                  </span>
                  <p className="text-sm text-text-muted leading-relaxed mt-1">{g.why_candidate_level}</p>
                </div>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="text-xs text-text-dim hover:text-text-muted transition-colors"
              >
                Hide reasoning
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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
    <section ref={sectionRef} className="py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-1">
            Gap Analysis
          </h2>
          <p className="text-sm text-text-muted">Comparison of your skills against requirements</p>
        </div>

        <div className="space-y-3">
          {gaps.filter(g => g.status !== 'irrelevant').map((g) => (
            <GapCard key={g.skill} g={g} />
          ))}
        </div>
      </div>
    </section>
  )
}
