export default function AIInsightsPanel({ insights }) {
  if (!insights) return null

  const { strengths, improvement_areas, action_plan, overall_assessment, resume_tips, interview_focus } = insights

  return (
    <section className="max-w-[1200px] mx-auto px-6 pt-10 space-y-6">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
        <h2 className="text-2xl font-bold tracking-tight text-on-surface font-headline">AI-Powered Insights</h2>
        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">Groq AI</span>
      </div>

      {/* Overall Assessment */}
      {overall_assessment && (
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl">
          <p className="text-sm font-bold text-primary uppercase tracking-wide mb-2">Overall Assessment</p>
          <p className="text-base text-on-surface leading-relaxed">{overall_assessment}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        {strengths?.length > 0 && (
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-green-600 text-xl">thumb_up</span>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">Key Strengths</h3>
            </div>
            <ul className="space-y-3">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span className="text-sm text-on-surface-variant leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvement Areas */}
        {improvement_areas?.length > 0 && (
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-amber-600 text-xl">trending_up</span>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">Areas to Improve</h3>
            </div>
            <ul className="space-y-3">
              {improvement_areas.map((a, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span className="text-sm text-on-surface-variant leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Plan */}
      {action_plan && (
        <div className="p-6 bg-surface-container-low rounded-2xl border-l-4 border-primary">
          <p className="text-sm font-bold text-primary uppercase tracking-wide mb-2">30-Day Action Plan</p>
          <p className="text-sm text-on-surface leading-relaxed">{action_plan}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Resume Tips */}
        {resume_tips?.length > 0 && (
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">description</span>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">Resume Tips</h3>
            </div>
            <ul className="space-y-3">
              {resume_tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-primary font-bold text-sm shrink-0">{i + 1}.</span>
                  <span className="text-sm text-on-surface-variant leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Interview Focus */}
        {interview_focus?.length > 0 && (
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">record_voice_over</span>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">Interview Focus Areas</h3>
            </div>
            <ul className="space-y-3">
              {interview_focus.map((topic, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span className="text-sm text-on-surface-variant leading-relaxed">{topic}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
