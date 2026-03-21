import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const TABS = [
  { key: 'technical', label: 'Technical' },
  { key: 'behavioral', label: 'Behavioral' },
  { key: 'scenario', label: 'Scenario' },
  { key: 'role_specific', label: 'Role-Specific' },
]

function QuestionCard({ q, index }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 cursor-pointer transition-all hover:bg-surface-container-high/40"
      onClick={() => setOpen(v => !v)}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1 pr-4">
          <span className="text-[10px] text-primary font-black uppercase tracking-widest">
            Question {index + 1}
          </span>
          <p className="font-bold text-lg leading-tight text-on-surface">{q.question}</p>
        </div>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="shrink-0 text-on-surface-variant transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {open && q.hint && (
        <div className="mt-4 flex items-start gap-3">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-container-high rounded-lg text-xs font-bold text-primary flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Hint
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{q.hint}</p>
        </div>
      )}
    </div>
  )
}

export default function InterviewPrep({ role, gaps }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('technical')

  useEffect(() => {
    if (!role && !gaps?.length) return
    setLoading(true)
    axios.post('/interview-prep', { role, gaps })
      .then(res => { setData(res.data.questions); setLoading(false) })
      .catch(err => { setError(err.response?.data?.detail || 'Failed'); setLoading(false) })
  }, [role])

  if (error || (!data && !loading)) return null

  const availableTabs = TABS.filter(t => data?.[t.key]?.length > 0)
  const currentQuestions = data?.[activeTab] || []

  return (
    <section className="max-w-[1200px] mx-auto px-6 pt-10">
      <h2 className="text-2xl font-bold tracking-tight text-on-surface font-headline mb-6">Interview Preparation</h2>

      <div className="bg-surface-container-low rounded-xl overflow-hidden">
        {/* Tab Header */}
        <div className="bg-surface-container-highest/30 px-8 py-4 flex gap-8">
          {(data ? availableTabs : TABS).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`text-sm font-semibold pb-2 transition-colors border-b-2 ${
                activeTab === t.key
                  ? 'text-primary border-primary font-bold'
                  : 'text-on-surface-variant border-transparent hover:text-on-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8 space-y-4">
          {loading && (
            <div className="flex items-center gap-3 py-6">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-on-surface-variant">Generating questions…</p>
            </div>
          )}

          {!loading && currentQuestions.map((q, i) => (
            <QuestionCard key={i} q={q} index={i} />
          ))}

          {!loading && data && currentQuestions.length === 0 && (
            <p className="text-sm text-on-surface-variant text-center py-6">No questions in this category.</p>
          )}
        </div>
      </div>
    </section>
  )
}
