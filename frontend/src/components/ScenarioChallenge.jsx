import { useState } from 'react'

export default function ScenarioChallenge({ challenge, onClose }) {
  const [response, setResponse] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const rubric = challenge.rubric || []

  const handleSubmit = () => {
    if (!response.trim()) return
    setSubmitted(true)
  }

  const handleReset = () => {
    setResponse('')
    setSubmitted(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white flex justify-between items-center w-full px-6 py-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black text-primary tracking-tighter font-headline">Skilo</span>
          <span className="text-sm font-bold text-primary">{challenge.title}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
            challenge.difficulty === 'advanced' ? 'text-red-600 bg-red-50' :
            challenge.difficulty === 'intermediate' ? 'text-amber-600 bg-amber-50' :
            'text-green-600 bg-green-50'
          }`}>
            {challenge.difficulty}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-500 hover:text-red-500"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </header>

      {/* Body */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left: Scenario */}
        <section className="flex-1 bg-white rounded-2xl overflow-y-auto p-8 border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-extrabold font-headline text-on-background mb-4 tracking-tight">{challenge.title}</h2>

          {challenge.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {challenge.skills.map(skill => (
                <span key={skill} className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div className="p-5 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl mb-8">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Scenario</p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
          </div>

          {rubric.length > 0 && (
            <div className="mb-8">
              <h4 className="text-sm font-bold text-on-background mb-3">Evaluation Criteria</h4>
              <ul className="space-y-2">
                {rubric.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-primary font-bold mt-0.5">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Right: Response */}
        <section className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-on-background">Your Analysis</span>
            {submitted && (
              <button onClick={handleReset} className="text-xs text-primary font-bold hover:underline">
                Reset
              </button>
            )}
          </div>

          {!submitted ? (
            <>
              <div className="flex-1 p-6">
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Write your incident response analysis here. Address each evaluation criterion..."
                  className="w-full h-full resize-none bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!response.trim()}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    response.trim()
                      ? 'bg-primary text-white hover:brightness-110'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Submit Analysis
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-5 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm font-bold text-green-700 mb-1">Response Submitted</p>
                <p className="text-xs text-green-600">Review your response against the evaluation criteria below.</p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Your Response</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{response}</p>
              </div>

              {rubric.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Self-Check Against Rubric</p>
                  {rubric.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-lg">
                      <span className="text-primary font-bold text-sm shrink-0">{i + 1}.</span>
                      <p className="text-sm text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
