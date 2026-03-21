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
    score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--error)'

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
        <span className="text-3xl font-bold text-text-primary">{Math.round(score)}%</span>
        <span className="text-xs text-text-muted mt-0.5">Readiness</span>
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
    <div className="card px-5 py-4 text-center min-w-[100px]">
      <div ref={ref} className="text-2xl font-bold" style={{ color }}>
        0
      </div>
      <div className="text-xs text-text-muted mt-1">
        {label}
      </div>
    </div>
  )
}

export default function SummaryBanner({ summary, onDownloadPDF, isExporting }) {
  if (!summary) return null

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary mb-1">
              Analysis Summary
            </h2>
            <p className="text-sm text-text-muted">
              Overview of your skill alignment with the target role ({summary.total_skills_required} skills analyzed)
            </p>
          </div>
          
          <button
            onClick={onDownloadPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-1 border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-surface-2 transition-colors disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {isExporting ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
        </div>

        <div className="card-static p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <RadialGauge score={summary.readiness_score} />

            <div className="flex-1">
              <div className="flex flex-wrap gap-3 mb-6">
                <StatChip
                  value={summary.matched_count}
                  label="Matched"
                  color="var(--success)"
                />
                <StatChip
                  value={summary.partial_count}
                  label="Partial"
                  color="var(--warning)"
                />
                <StatChip
                  value={summary.missing_count}
                  label="Missing"
                  color="var(--error)"
                />
                <StatChip
                  value={summary.estimated_learning_hours}
                  label="Hours"
                  color="var(--accent)"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {summary.detected_role && (
                  <span className="pill pill-accent">
                    {summary.role_display_name || summary.detected_role.replace(/_/g, ' ')}
                    <span className="opacity-60 ml-1">
                      {Math.round(summary.role_confidence * 100)}%
                    </span>
                  </span>
                )}
                {summary.role_candidates?.length > 1 && (
                  <>
                    {summary.role_candidates.slice(1, 3).map(c => (
                      <span key={c.role_id} className="pill pill-neutral">
                        {c.display_name}
                        <span className="opacity-60 ml-1">{Math.round(c.confidence * 100)}%</span>
                      </span>
                    ))}
                  </>
                )}
                {summary.top_gaps?.map((gap) => (
                  <span key={gap} className="pill pill-error">
                    {gap.replace(/_/g, ' ')}
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
