import { useEffect, useRef } from 'react'
import { animateCount } from '../hooks/useScrollAnimation'

function RadialGauge({ score }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const gaugeRef = useRef()

  useEffect(() => {
    if (gaugeRef.current) {
      gaugeRef.current.style.strokeDashoffset = circumference
      requestAnimationFrame(() => {
        gaugeRef.current.style.strokeDashoffset = offset
      })
    }
  }, [offset, circumference])

  const color =
    score >= 70 ? 'var(--accent-green)' : score >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)'

  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="6"
        />
        <circle
          ref={gaugeRef}
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          className="gauge-circle"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold text-mc-text">{Math.round(score)}%</span>
        <span className="font-mono text-[9px] text-mc-text2 tracking-wider">READINESS</span>
      </div>
    </div>
  )
}

function StatChip({ value, label, color }) {
  const ref = useRef()
  useEffect(() => {
    animateCount(ref.current, value)
  }, [value])

  return (
    <div className="card-glow px-4 py-3 text-center min-w-[100px]">
      <div ref={ref} className="font-mono text-xl font-bold" style={{ color }}>
        0
      </div>
      <div className="font-mono text-[9px] text-mc-text2 tracking-wider uppercase mt-1">
        {label}
      </div>
    </div>
  )
}

export default function SummaryBanner({ summary }) {
  if (!summary) return null

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-2 h-2 bg-mc-cyan rounded-full" />
          <h2 className="font-mono text-xs text-mc-cyan tracking-[0.2em] uppercase">
            Analysis Summary
          </h2>
        </div>

        <div className="card-glow p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <RadialGauge score={summary.readiness_score} />

            <div className="flex-1">
              <div className="flex flex-wrap gap-3 mb-6">
                <StatChip
                  value={summary.matched_count}
                  label="Matched"
                  color="var(--accent-green)"
                />
                <StatChip
                  value={summary.partial_count}
                  label="Partial"
                  color="var(--accent-amber)"
                />
                <StatChip
                  value={summary.missing_count}
                  label="Missing"
                  color="var(--accent-red)"
                />
                <StatChip
                  value={summary.estimated_learning_hours}
                  label="Hours"
                  color="var(--accent-cyan)"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {summary.detected_role && (
                  <div className="flex items-center gap-2 border border-mc-cyan px-3 py-1 bg-mc-cyan/5 rounded">
                    <span className="font-mono text-[10px] tracking-wider text-mc-cyan">
                      {summary.role_display_name?.toUpperCase() || summary.detected_role.toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px] text-mc-cyan border-l border-mc-cyan/30 pl-2">
                       CONF: {Math.round(summary.role_confidence * 100)}%
                    </span>
                  </div>
                )}
                {summary.role_candidates?.length > 1 && (
                  <div className="flex items-center gap-2 ml-2">
                    <span className="font-mono text-[8px] text-mc-text2 uppercase tracking-widest mr-1">Other Matches:</span>
                    {summary.role_candidates.slice(1, 3).map(c => (
                      <span key={c.role_id} className="font-mono text-[8px] text-mc-text2/70 border border-mc-border px-1.5 py-0.5 rounded">
                        {c.display_name} ({Math.round(c.confidence * 100)}%)
                      </span>
                    ))}
                  </div>
                )}
                {summary.top_gaps?.map((gap) => (
                  <span
                    key={gap}
                    className="font-mono text-[10px] tracking-wider px-3 py-1 border border-mc-red/50 text-mc-red rounded"
                  >
                    GAP: {gap.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
