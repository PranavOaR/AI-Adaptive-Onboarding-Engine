import { useState } from 'react'

const DIFFICULTY_COLORS = {
  easy: 'text-mc-green border-mc-green',
  medium: 'text-mc-amber border-mc-amber',
  hard: 'text-mc-red border-mc-red',
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
  const scoreColor = pct >= 75 ? 'text-mc-green' : pct >= 50 ? 'text-mc-amber' : 'text-mc-red'

  return (
    <div className="fixed inset-0 z-50 bg-mc-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-mc-border bg-mc-bg2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-mc-cyan tracking-[0.2em] uppercase">
            Scenario Analysis
          </span>
          <span className="font-mono text-[10px] text-mc-text2">{challenge.id}</span>
          <span className={`badge border font-mono text-[9px] px-2 py-0.5 ${DIFFICULTY_COLORS[challenge.difficulty] || ''}`}>
            {challenge.difficulty}
          </span>
          <span className="font-mono text-[9px] text-mc-cyan/60 border border-mc-cyan/30 px-2 py-0.5 rounded">
            SCENARIO
          </span>
        </div>
        <button
          onClick={onClose}
          className="font-mono text-sm text-mc-text2 hover:text-mc-red transition-colors px-3 py-1"
        >
          ✕ CLOSE
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="font-mono text-lg text-mc-cyan font-bold mb-1">{challenge.title}</h2>
            <div className="flex flex-wrap gap-1 mt-2">
              {(challenge.tags || []).map((tag) => (
                <span key={tag} className="font-mono text-[9px] px-2 py-0.5 border border-mc-border text-mc-text2 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Scenario text / description */}
          <div className="card-glow p-5 border-l-2 border-mc-amber/50">
            <p className="font-mono text-[10px] text-mc-amber tracking-wider mb-3 uppercase">Scenario</p>
            <div className="text-sm text-mc-text2 font-body leading-relaxed whitespace-pre-wrap">
              {challenge.description}
            </div>
          </div>

          {/* Score banner */}
          {submitted && score && (
            <div className={`card-glow border p-4 flex items-center gap-4 ${
              pct >= 75 ? 'border-mc-green/50' : pct >= 50 ? 'border-mc-amber/50' : 'border-mc-red/50'
            }`}>
              <span className={`font-mono text-3xl font-bold ${scoreColor}`}>
                {score.correct}/{score.total}
              </span>
              <div>
                <div className={`font-mono text-sm ${scoreColor}`}>
                  {pct >= 75 ? '✓ INCIDENT CLOSED' : pct >= 50 ? '◐ PARTIAL RESPONSE' : '✗ ESCALATE'}
                </div>
                <div className="font-mono text-[10px] text-mc-text2">{pct}% correct triage</div>
              </div>
              <button
                onClick={handleReset}
                className="ml-auto font-mono text-[10px] text-mc-cyan border border-mc-cyan/50 px-3 py-1 rounded hover:bg-mc-cyan/10"
              >
                RETRY
              </button>
            </div>
          )}

          {/* Analysis Questions */}
          <div className="space-y-6">
            {questions.map((q, qi) => {
              const selected = answers[q.id]
              const isRealCorrect = (idx) => submitted && idx === q.correct_index
              const isWrongSelected = (idx) => submitted && selected === idx && idx !== q.correct_index

              return (
                <div key={q.id} className="card-glow p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="font-mono text-[10px] text-mc-amber bg-mc-bg2 px-2 py-0.5 rounded shrink-0 mt-0.5">
                      Q{qi + 1}
                    </span>
                    <p className="font-mono text-sm text-mc-text leading-relaxed">{q.text}</p>
                  </div>

                  <div className="space-y-2 pl-6">
                    {q.options.map((opt, idx) => {
                      let style = 'border-mc-border text-mc-text2 hover:border-mc-amber/50'
                      if (!submitted && selected === idx) {
                        style = 'border-mc-amber text-mc-amber bg-mc-amber/5'
                      } else if (isRealCorrect(idx)) {
                        style = 'border-mc-green text-mc-green bg-mc-green/5'
                      } else if (isWrongSelected(idx)) {
                        style = 'border-mc-red text-mc-red bg-mc-red/5'
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelect(q.id, idx)}
                          className={`w-full text-left px-4 py-2.5 rounded border font-mono text-[11px] transition-all ${style} ${!submitted ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <span className="text-mc-text2/50 mr-3">{String.fromCharCode(65 + idx)}.</span>
                          {opt}
                          {isRealCorrect(idx) && <span className="ml-2 text-mc-green text-xs">✓ Correct</span>}
                          {isWrongSelected(idx) && <span className="ml-2 text-mc-red text-xs">✗</span>}
                        </button>
                      )
                    })}
                  </div>

                  {submitted && q.explanation && (
                    <div className="mt-3 pl-6 p-3 bg-mc-bg2 border-l-2 border-mc-green/40 rounded-r">
                      <p className="font-mono text-[10px] text-mc-green mb-1">ANALYST NOTE</p>
                      <p className="text-xs text-mc-text2 font-body leading-relaxed">{q.explanation}</p>
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
                className={`font-mono text-sm tracking-wider px-6 py-2.5 border rounded transition-all ${
                  Object.keys(answers).length >= questions.length
                    ? 'border-mc-amber text-mc-amber hover:bg-mc-amber/10'
                    : 'border-mc-border text-mc-text2/40 cursor-not-allowed'
                }`}
              >
                SUBMIT ANALYSIS ({Object.keys(answers).length}/{questions.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
