import React, { useState, useRef } from 'react'

const LEVEL_LABELS = ['None', 'Novice', 'Intermediate', 'Advanced', 'Expert']

function getPriority(g) {
  if (g.status === 'missing') return 'HIGH'
  if (g.status === 'partial') return 'MEDIUM'
  return 'LOW'
}

function getPriorityStyle(priority) {
  if (priority === 'HIGH') return 'bg-error-container text-on-error-container'
  if (priority === 'MEDIUM') return 'bg-secondary-container text-on-secondary-container'
  return 'bg-surface-container-high text-tertiary'
}

function getBarColor(level) {
  if (level <= 1) return 'bg-amber-400'
  if (level === 2) return 'bg-primary'
  return 'bg-green-500'
}

function GapRow({ g }) {
  const priority = getPriority(g)
  const barWidth = g.candidate_level * 25
  const levelLabel = LEVEL_LABELS[g.candidate_level] || 'None'
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <div className="grid grid-cols-12 items-center px-4 py-4 bg-surface-container-low rounded-lg transition-all hover:bg-surface-container-highest/50">
        <div className="col-span-4 font-semibold text-sm text-on-surface">
          {g.skill.replace(/_/g, ' ')}
        </div>
        <div className="col-span-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 bg-surface-container-high rounded-full overflow-hidden">
            <div className={`h-full ${getBarColor(g.candidate_level)} transition-all duration-700`} style={{ width: `${barWidth}%` }} />
          </div>
          <span className="text-xs text-on-surface-variant whitespace-nowrap">{levelLabel}</span>
        </div>
        <div className="col-span-2 flex justify-center">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getPriorityStyle(priority)}`}>
            {priority}
          </span>
        </div>
        <div className="col-span-2 flex items-center justify-end gap-2">
          {(g.why_required || g.why_candidate_level) && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              title="Show reasoning"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
          <button className="text-primary text-xs font-bold hover:underline">Learn</button>
        </div>
      </div>
      {expanded && (g.why_required || g.why_candidate_level) && (
        <div className="mx-4 mb-2 px-4 py-3 bg-surface-container-lowest rounded-lg border border-outline-variant/10 space-y-2">
          {g.why_required && (
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Why Required</span>
              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{g.why_required}</p>
            </div>
          )}
          {g.why_candidate_level && (
            <div>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Your Level</span>
              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{g.why_candidate_level}</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default function GapMatrix({ gaps }) {
  if (!gaps?.length) return null

  const filtered = gaps.filter(g => g.status !== 'irrelevant')

  return (
    <section className="max-w-[1200px] mx-auto px-6 pt-8">
      <div className="bg-surface-container-lowest rounded-xl p-8 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-on-surface font-headline">Skill Gap Analysis</h2>

        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <div className="col-span-4">Skill Name</div>
            <div className="col-span-4">Proficiency</div>
            <div className="col-span-2 text-center">Priority</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* Rows */}
          {filtered.map((g) => (
            <GapRow key={g.skill} g={g} />
          ))}
        </div>
      </div>
    </section>
  )
}
