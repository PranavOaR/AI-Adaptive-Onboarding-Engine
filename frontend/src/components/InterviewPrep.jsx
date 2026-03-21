import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from 'axios'

gsap.registerPlugin(ScrollTrigger)

const CATEGORY_LABELS = {
  technical:    { label: 'Technical',    color: 'text-accent',   pill: 'pill-accent' },
  behavioral:   { label: 'Behavioral',   color: 'text-success',  pill: 'pill-success' },
  scenario:     { label: 'Scenario',     color: 'text-warning',  pill: 'pill-warning' },
  role_specific:{ label: 'Role-Specific',color: 'text-error',    pill: 'pill-error' },
}

function QuestionCard({ q, index }) {
  const [open, setOpen] = useState(false)
  const answerRef = useRef()

  useEffect(() => {
    if (open) {
      gsap.fromTo(answerRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' }
      )
    }
  }, [open])

  return (
    <div className="card p-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-3 text-left"
      >
        <div className="flex items-start gap-3">
          <span className="text-xs font-mono text-text-dim mt-0.5 shrink-0">{String(index + 1).padStart(2,'0')}</span>
          <p className="text-sm text-text-body leading-relaxed">{q.question}</p>
        </div>
        <div className={`mt-0.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>

      {open && (
        <div ref={answerRef} className="overflow-hidden">
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs font-medium text-accent mb-1.5">Hint</p>
            <p className="text-sm text-text-muted leading-relaxed">{q.hint}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InterviewPrep({ role, gaps }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('technical')
  const [expanded, setExpanded] = useState(false)
  const sectionRef = useRef()

  useEffect(() => {
    if (!role && !gaps?.length) return

    setLoading(true)
    axios.post('/interview-prep', { role, gaps })
      .then(res => { setData(res.data.questions); setLoading(false) })
      .catch(err => {
        setError(err.response?.data?.detail || 'Failed to load interview prep')
        setLoading(false)
      })
  }, [role])

  useEffect(() => {
    if (!data || !sectionRef.current) return
    gsap.fromTo(sectionRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' } }
    )
  }, [data])

  if (error) return null
  if (!data && !loading) return null

  const currentQuestions = data ? (data[activeCategory] || []) : []
  const totalCount = data ? Object.values(data).reduce((s, arr) => s + arr.length, 0) : 0

  return (
    <section ref={sectionRef} className="py-14 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-1">Interview Prep</h2>
            <p className="text-sm text-text-muted">
              {totalCount} questions tailored to {role || 'your role'} and your skill gaps
            </p>
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5"
          >
            {expanded ? 'Collapse' : 'Expand'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-3 p-6 card-static">
            <div className="w-4 h-4 border-2 border-border border-t-accent rounded-full" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p className="text-sm text-text-muted">Generating questions…</p>
          </div>
        )}

        {data && (
          <>
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mb-5">
              {Object.entries(CATEGORY_LABELS).map(([key, meta]) => {
                const count = data[key]?.length || 0
                if (!count) return null
                return (
                  <button
                    key={key}
                    onClick={() => { setActiveCategory(key); setExpanded(true) }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      activeCategory === key
                        ? 'bg-surface-2 border-border text-text-primary'
                        : 'border-transparent text-text-muted hover:text-text-body hover:bg-surface-2'
                    }`}
                  >
                    {meta.label}
                    <span className={`pill ${meta.pill} text-[10px] px-1.5 py-0`}>{count}</span>
                  </button>
                )
              })}
            </div>

            {/* Questions */}
            {expanded && (
              <div className="space-y-2.5">
                {currentQuestions.map((q, i) => (
                  <QuestionCard key={i} q={q} index={i} />
                ))}
                {currentQuestions.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-6">No questions in this category.</p>
                )}
              </div>
            )}

            {!expanded && (
              <div className="card-static p-4 flex items-center justify-between">
                <p className="text-sm text-text-muted">{currentQuestions.length} questions ready in {CATEGORY_LABELS[activeCategory]?.label}</p>
                <button
                  onClick={() => setExpanded(true)}
                  className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                >
                  Show questions →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
