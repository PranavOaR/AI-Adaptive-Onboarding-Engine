import { useState } from 'react'

function TraceItem({ trace }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-dim bg-surface-1 px-2.5 py-1 rounded-md">
            {trace.course_id}
          </span>
          <span className="text-sm font-medium text-text-primary">
            {trace.skill_gap_trigger?.replace(/_/g, ' ')}
          </span>
        </div>
        <span className="text-text-muted text-sm">{open ? '\u2212' : '+'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border-subtle">
          <div className="pt-4">
            <div className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">
              Why required
            </div>
            {trace.why_required && (
              <p className="text-sm text-text-muted leading-relaxed mb-2">{trace.why_required}</p>
            )}
            {trace.jd_evidence?.map((e, i) => (
              <p key={i} className="text-sm text-text-dim pl-4 border-l-2 border-accent/20 mb-2 italic leading-relaxed">
                &ldquo;{e}&rdquo;
              </p>
            ))}
          </div>

          <div>
            <div className="text-xs font-semibold text-success uppercase tracking-wide mb-2">
              Candidate level
            </div>
            {trace.why_candidate_level && (
              <p className="text-sm text-text-muted leading-relaxed mb-2">{trace.why_candidate_level}</p>
            )}
            {trace.resume_evidence?.length > 0 ? (
              trace.resume_evidence.map((e, i) => (
                <p key={i} className="text-sm text-text-dim pl-4 border-l-2 border-success/20 mb-2 italic leading-relaxed">
                  &ldquo;{e}&rdquo;
                </p>
              ))
            ) : (
              <p className="text-sm text-error/70 pl-4 border-l-2 border-error/20 italic">
                Not found in resume
              </p>
            )}
          </div>

          <div>
            <div className="text-xs font-semibold text-warning uppercase tracking-wide mb-2">
              Gap severity & course assignment
            </div>
            {trace.why_severity && (
              <p className="text-sm text-text-muted leading-relaxed mb-2">{trace.why_severity}</p>
            )}
            <div className="text-sm text-text-dim pl-4 border-l-2 border-warning/20 leading-relaxed">
              <p>{trace.course_selection_reason}</p>
              {trace.ordering_reason && <p className="mt-1">{trace.ordering_reason}</p>}
            </div>
          </div>

          {trace.assessment_reason && (
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                Assessment routing
              </div>
              <p className="text-sm text-text-dim pl-4 border-l-2 border-border leading-relaxed">
                {trace.assessment_reason}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReasoningPanel({ traces }) {
  if (!traces?.length) return null

  return (
    <section className="py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-1">
            Reasoning Trace
          </h2>
          <p className="text-sm text-text-muted">Detailed reasoning behind each recommendation</p>
        </div>

        <div className="space-y-2">
          {traces.map((trace) => (
            <TraceItem key={trace.course_id} trace={trace} />
          ))}
        </div>
      </div>
    </section>
  )
}
