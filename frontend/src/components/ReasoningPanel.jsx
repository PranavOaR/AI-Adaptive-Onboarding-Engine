import { useState } from 'react'

function TraceItem({ trace }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card-glow overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-mc-cyan/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-mc-text2 bg-mc-bg px-2 py-0.5 rounded">
            {trace.course_id}
          </span>
          <span className="font-mono text-xs text-mc-text">{trace.skill_gap_trigger}</span>
        </div>
        <span className="font-mono text-mc-cyan text-sm">{open ? '\u2212' : '+'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-mc-border">
          <div>
            <div className="font-mono text-[10px] text-mc-cyan tracking-wider mb-1">
              WHY REQUIRED (JD EVIDENCE)
            </div>
            {trace.why_required && <p className="text-xs text-mc-text2 font-body mb-2">{trace.why_required}</p>}
            {trace.jd_evidence.map((e, i) => (
              <p key={i} className="text-xs text-mc-text2/70 font-body pl-3 border-l border-mc-cyan/30 mb-1 italic">
                &ldquo;{e}&rdquo;
              </p>
            ))}
          </div>

          <div>
            <div className="font-mono text-[10px] text-mc-green tracking-wider mb-1">
              CANDIDATE LEVEL (RESUME EVIDENCE)
            </div>
            {trace.why_candidate_level && <p className="text-xs text-mc-text2 font-body mb-2">{trace.why_candidate_level}</p>}
            {trace.resume_evidence.length > 0 ? (
              trace.resume_evidence.map((e, i) => (
                <p key={i} className="text-xs text-mc-text2/70 font-body pl-3 border-l border-mc-green/30 mb-1 italic">
                  &ldquo;{e}&rdquo;
                </p>
              ))
            ) : (
              <p className="text-xs text-mc-red/70 font-mono pl-3 border-l border-mc-red/30 italic">
                Not found in resume
              </p>
            )}
          </div>

          <div>
            <div className="font-mono text-[10px] text-mc-amber tracking-wider mb-1">
              GAP SEVERITY & COURSE ASSIGNMENT
            </div>
            {trace.why_severity && <p className="text-xs text-mc-text2 font-body mb-1">{trace.why_severity}</p>}
            <p className="text-xs text-mc-text2/70 font-body border-l border-mc-amber/30 pl-3">
              {trace.course_selection_reason}<br/>
              {trace.ordering_reason}
            </p>
          </div>

          {trace.assessment_reason && (
             <div>
              <div className="font-mono text-[10px] text-mc-text2 tracking-wider mb-1">
                ASSESSMENT ROUTING
              </div>
              <p className="text-xs text-mc-text2/70 font-body pl-3 border-l border-mc-border">
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
    <section className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 bg-mc-text2 rounded-full" />
          <h2 className="font-mono text-xs text-mc-text2 tracking-[0.2em] uppercase">
            Reasoning Trace
          </h2>
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
