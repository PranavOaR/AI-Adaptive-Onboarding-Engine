import { useState } from 'react'
import HeroUpload from './components/HeroUpload'
import AnalysisProgress from './components/AnalysisProgress'
import SummaryBanner from './components/SummaryBanner'
import CandidateProfile from './components/CandidateProfile'
import RequiredProfile from './components/RequiredProfile'
import GapMatrix from './components/GapMatrix'
import RoadmapTimeline from './components/RoadmapTimeline'
import ReasoningPanel from './components/ReasoningPanel'
import AuthGuard from './components/AuthGuard'
import { runAnalysis } from './api/analyzeApi'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const [state, setState] = useState('idle') // idle | analyzing | results
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const { user, logout } = useAuth()

  const handleSubmit = async ({ resumeFile, jdFile, jdText }) => {
    setState('analyzing')
    setError(null)
    try {
      const result = await runAnalysis(resumeFile, jdFile, jdText)
      setData(result)
      setState('results')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || err.message || 'Analysis failed')
      setState('idle')
    }
  }

  const handleReset = () => {
    setState('idle')
    setData(null)
    setError(null)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-mc-bg">
        {state === 'analyzing' && <AnalysisProgress />}

        {(state === 'idle' || state === 'analyzing') && (
          <>
            <HeroUpload onSubmit={handleSubmit} />
            {error && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 card-glow border-mc-red px-6 py-3">
                <p className="font-mono text-xs text-mc-red">{error}</p>
              </div>
            )}
          </>
        )}

        {state === 'results' && data && (
          <>
            {/* Top bar */}
            <div className="sticky top-0 z-40 bg-mc-bg/90 backdrop-blur border-b border-mc-border">
              <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-mc-cyan tracking-[0.2em]">
                    ONBOARDING ENGINE
                  </span>
                  <span className="font-mono text-[10px] text-mc-text2">
                    {data.summary.total_skills_required} skills analyzed
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {user && (
                    <span className="font-mono text-[10px] text-mc-text2 hidden sm:inline">
                      {user.email}
                    </span>
                  )}
                  <button
                    onClick={handleReset}
                    className="font-mono text-[10px] text-mc-text2 hover:text-mc-cyan transition-colors tracking-wider"
                  >
                    NEW ANALYSIS
                  </button>
                  <button
                    onClick={logout}
                    className="font-mono text-[10px] text-mc-red/70 hover:text-mc-red transition-colors tracking-wider"
                  >
                    LOGOUT
                  </button>
                </div>
              </div>
            </div>

            <SummaryBanner summary={data.summary} />
            <CandidateProfile profile={data.candidate_profile} />
            <RequiredProfile profile={data.required_profile} />
            <GapMatrix gaps={data.gaps} />
            <RoadmapTimeline roadmap={data.roadmap} gaps={data.gaps} />
            <ReasoningPanel traces={data.reasoning_trace} />

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-mc-border">
              <div className="max-w-5xl mx-auto text-center">
                <p className="font-mono text-[10px] text-mc-text2/40 tracking-wider">
                  AI ONBOARDING ENGINE &middot; MISSION CONTROL &middot; ALL DATA GROUNDED IN EVIDENCE
                </p>
              </div>
            </footer>
          </>
        )}
      </div>
    </AuthGuard>
  )
}
