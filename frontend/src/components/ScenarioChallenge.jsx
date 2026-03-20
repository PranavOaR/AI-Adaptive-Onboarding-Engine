import { useState } from 'react'

const DIFFICULTY_PILL = {
  easy: 'pill-success',
  medium: 'pill-warning',
  hard: 'pill-error',
  beginner: 'pill-success',
  intermediate: 'pill-warning',
  advanced: 'pill-error',
}

export default function ScenarioChallenge({ challenge, onClose }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)

  const questions = challenge.questions || []

  const handleSelect = (qid, idx) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [qid]: idx }))
  }

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) return
    let correct = 0
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_index) correct++
    })
    setScore({ correct, total: questions.length })
    setSubmitted(true)
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(null)
  }

  const pct = score ? Math.round((score.correct / score.total) * 100) : 0
  const scoreColor = pct >= 75 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-error'

  return (
    <div className="fixed inset-0 z-50 bg-surface-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-1 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-primary">
            Scenario Analysis
          </span>
          <span className="text-xs text-text-dim">{challenge.id}</span>
          <span className={`pill ${DIFFICULTY_PILL[challenge.difficulty] || 'pill-neutral'}`}>
            {challenge.difficulty}
          </span>
          <span className="pill pill-neutral">Scenario</span>
        </div>
        <button
          onClick={onClose}
          className="text-sm text-text-muted hover:text-error transition-colors px-3 py-1"
        >
          Close
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">{challenge.title}</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(challenge.tags || []).map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-surface-1 border border-border-subtle rounded-md text-text-dim">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Scenario text */}
          <div className="card-static p-6 border-l-2 border-warning/40">
            <p className="text-xs font-semibold text-warning uppercase tracking-wide mb-3">Scenario</p>
            <div className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
              {challenge.description}
            </div>
          </div>

          {/* Score banner */}
          {submitted && score && (
            <div className={`card-static p-5 flex items-center gap-4 ${
              pct >= 75 ? 'border-success/30' : pct >= 50 ? 'border-warning/30' : 'border-error/30'
            }`}>
              <span className={`text-3xl font-bold ${scoreColor}`}>
                {score.correct}/{score.total}
              </span>
              <div>
                <div className={`text-base font-medium ${scoreColor}`}>
                  {pct >= 75 ? 'Resolved' : pct >= 50 ? 'Partial response' : 'Review needed'}
                </div>
                <div className="text-xs text-text-dim">{pct}% correct</div>
              </div>
              <button
                onClick={handleReset}
                className="ml-auto text-sm text-accent border border-accent/40 px-4 py-2 rounded-lg hover:bg-accent/10 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((q, qi) => {
              const selected = answers[q.id]
              const isRealCorrect = (idx) => submitted && idx === q.correct_index
              const isWrongSelected = (idx) => submitted && selected === idx && idx !== q.correct_index

              return (
                <div key={q.id} className="card-static p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-xs font-medium text-warning bg-surface-1 px-2.5 py-1 rounded-md shrink-0 mt-0.5">
                      Q{qi + 1}
                    </span>
                    <p className="text-sm text-text-primary leading-relaxed">{q.text}</p>
                  </div>

                  <div className="space-y-2 pl-8">
                    {q.options.map((opt, idx) => {
                      let style = 'border-border text-text-body hover:border-warning/50'
                      if (!submitted && selected === idx) {
                        style = 'border-warning text-warning bg-warning/5'
                      } else if (isRealCorrect(idx)) {
                        style = 'border-success text-success bg-success/5'
                      } else if (isWrongSelected(idx)) {
                        style = 'border-error text-error bg-error/5'
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelect(q.id, idx)}
                          className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${style} ${!submitted ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <span className="text-text-dim mr-3">{String.fromCharCode(65 + idx)}.</span>
                          {opt}
                          {isRealCorrect(idx) && <span className="ml-2 text-success text-xs">\u2713 Correct</span>}
                          {isWrongSelected(idx) && <span className="ml-2 text-error text-xs">\u2717</span>}
                        </button>
                      )
                    })}
                  </div>

                  {submitted && q.explanation && (
                    <div className="mt-4 ml-8 p-4 bg-surface-1 border-l-2 border-success/30 rounded-r-lg">
                      <p className="text-xs font-semibold text-success uppercase tracking-wide mb-1">Analyst Note</p>
                      <p className="text-sm text-text-muted leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Submit */}
          {!submitted && (
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < questions.length}
                className={`text-sm font-medium px-6 py-3 rounded-lg transition-colors ${
                  Object.keys(answers).length >= questions.length
                    ? 'bg-accent text-white hover:bg-accent-hover'
                    : 'bg-surface-2 text-text-dim border border-border cursor-not-allowed'
                }`}
              >
                Submit analysis ({Object.keys(answers).length}/{questions.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
